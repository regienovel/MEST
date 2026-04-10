import { NextRequest } from 'next/server';
import { openai } from '@/lib/openai';
import { anthropic } from '@/lib/anthropic';
import { ensureSeeded } from '@/lib/seed';

export const maxDuration = 60;
import { checkRateLimit, incrementUsage } from '@/lib/rate-limit';

const DEFAULT_SYSTEM = 'You are a helpful assistant. Respond in the language the user is writing in.';

export async function POST(req: NextRequest) {
  await ensureSeeded();

  const teamCookie = req.cookies.get('mest_team')?.value;
  if (!teamCookie) return new Response('Unauthorized', { status: 401 });
  let teamId: string;
  try { teamId = JSON.parse(decodeURIComponent(teamCookie)).id; } catch { return new Response('Unauthorized', { status: 401 }); }
  const { allowed, remaining } = await checkRateLimit(teamId);
  if (!allowed) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Rate limit exceeded. Your team has used its AI calls for this hour.' })}\n\n`));
        controller.close();
      },
    });
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } });
  }

  const body = await req.json();
  const { model, messages, temperature = 0.7, maxTokens = 1024 } = body;

  const encoder = new TextEncoder();

  if (model === 'both') {
    const stream = new ReadableStream({
      async start(controller) {
        const enqueue = (data: unknown) => {
          try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)); } catch {}
        };

        const gptPromise = (async () => {
          try {
            await incrementUsage(teamId, 0.005);
            const gptMessages = formatForOpenAI(messages);
            const response = await openai.chat.completions.create({
              model: 'gpt-4o',
              messages: gptMessages,
              temperature,
              max_tokens: maxTokens,
              stream: true,
            });
            for await (const chunk of response) {
              const text = chunk.choices[0]?.delta?.content;
              if (text) enqueue({ source: 'gpt', chunk: text });
            }
          } catch (err) {
            enqueue({ source: 'gpt', error: 'GPT-4o is unavailable right now.' });
          }
        })();

        const claudePromise = (async () => {
          try {
            await incrementUsage(teamId, 0.005);
            const { system, claudeMessages } = formatForAnthropic(messages);
            const response = await anthropic.messages.stream({
              model: 'claude-sonnet-4-20250514',
              system,
              messages: claudeMessages,
              temperature,
              max_tokens: maxTokens,
            });
            for await (const event of response) {
              if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                enqueue({ source: 'claude', chunk: event.delta.text });
              }
            }
          } catch (err) {
            enqueue({ source: 'claude', error: 'Claude is unavailable right now.' });
          }
        })();

        await Promise.allSettled([gptPromise, claudePromise]);
        enqueue({ done: true });
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
    });
  }

  // Single model mode
  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (data: unknown) => {
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)); } catch {}
      };

      try {
        await incrementUsage(teamId, 0.005);

        if (model === 'gpt-4o') {
          const gptMessages = formatForOpenAI(messages);
          const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: gptMessages,
            temperature,
            max_tokens: maxTokens,
            stream: true,
          });
          for await (const chunk of response) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) enqueue({ chunk: text });
          }
        } else {
          const { system, claudeMessages } = formatForAnthropic(messages);
          const response = await anthropic.messages.stream({
            model: 'claude-sonnet-4-20250514',
            system,
            messages: claudeMessages,
            temperature,
            max_tokens: maxTokens,
          });
          for await (const event of response) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              enqueue({ chunk: event.delta.text });
            }
          }
        }

        enqueue({ done: true });
      } catch (err) {
        enqueue({ error: 'Something went wrong. Try again.' });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
  });
}

function formatForOpenAI(messages: Array<{ role: string; content: string; image?: string }>) {
  const systemMsg = messages.find(m => m.role === 'system');
  const chatMessages = messages.filter(m => m.role !== 'system');

  const formatted: Array<{ role: string; content: unknown }> = [];

  if (systemMsg) {
    formatted.push({ role: 'system', content: systemMsg.content || DEFAULT_SYSTEM });
  } else {
    formatted.push({ role: 'system', content: DEFAULT_SYSTEM });
  }

  for (const msg of chatMessages) {
    if (msg.image && msg.role === 'user') {
      formatted.push({
        role: 'user',
        content: [
          { type: 'text', text: msg.content },
          { type: 'image_url', image_url: { url: msg.image } },
        ],
      });
    } else {
      formatted.push({ role: msg.role, content: msg.content });
    }
  }

  return formatted as Parameters<typeof openai.chat.completions.create>[0]['messages'];
}

function formatForAnthropic(messages: Array<{ role: string; content: string; image?: string }>) {
  const systemMsg = messages.find(m => m.role === 'system');
  const system = systemMsg?.content || DEFAULT_SYSTEM;
  const chatMessages = messages.filter(m => m.role !== 'system');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const claudeMessages: any[] = [];

  for (const msg of chatMessages) {
    const role = msg.role === 'user' ? 'user' : 'assistant';

    if (msg.image && msg.role === 'user') {
      const match = msg.image.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        claudeMessages.push({
          role,
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: match[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: match[2],
              },
            },
            { type: 'text', text: msg.content },
          ],
        });
      } else {
        claudeMessages.push({ role, content: msg.content });
      }
    } else {
      claudeMessages.push({ role, content: msg.content });
    }
  }

  return { system, claudeMessages };
}
