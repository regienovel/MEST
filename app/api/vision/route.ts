import { NextRequest } from 'next/server';
import { openai } from '@/lib/openai';
import { anthropic } from '@/lib/anthropic';
import { ensureSeeded } from '@/lib/seed';

export const maxDuration = 60;
import { checkRateLimit, incrementUsage } from '@/lib/rate-limit';
import { logApiCall } from '@/lib/health-metrics';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  await ensureSeeded();

  const teamCookie = req.cookies.get('mest_team')?.value;
  if (!teamCookie) return new Response('Unauthorized', { status: 401 });
  let teamId: string;
  try { teamId = JSON.parse(decodeURIComponent(teamCookie)).id; } catch { return new Response('Unauthorized', { status: 401 }); }

  const { allowed } = await checkRateLimit(teamId);
  if (!allowed) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Rate limit exceeded' })}\n\n`));
        controller.close();
      },
    });
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } });
  }

  const { model, images, prompt } = await req.json();
  logApiCall(teamId, 'vision', `[${model}] ${(prompt || '').slice(0, 60)}`, startTime, true).catch(() => {});
  const encoder = new TextEncoder();

  if (model === 'both') {
    const stream = new ReadableStream({
      async start(controller) {
        const enqueue = (data: unknown) => {
          try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)); } catch {}
        };

        const gptPromise = (async () => {
          try {
            await incrementUsage(teamId, 0.01);
            const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
            for (const img of images) {
              content.push({ type: 'image_url', image_url: { url: img } });
            }
            content.push({ type: 'text', text: prompt });

            const response = await openai.chat.completions.create({
              model: 'gpt-4o',
              messages: [{ role: 'user', content: content as never }],
              max_tokens: 1024,
              stream: true,
            });
            for await (const chunk of response) {
              const text = chunk.choices[0]?.delta?.content;
              if (text) enqueue({ source: 'gpt', chunk: text });
            }
          } catch { enqueue({ source: 'gpt', error: 'GPT-4o Vision failed' }); }
        })();

        const claudePromise = (async () => {
          try {
            await incrementUsage(teamId, 0.01);
            const content: Array<unknown> = [];
            for (const img of images) {
              const match = img.match(/^data:(image\/\w+);base64,(.+)$/);
              if (match) {
                content.push({
                  type: 'image',
                  source: { type: 'base64', media_type: match[1], data: match[2] },
                });
              }
            }
            content.push({ type: 'text', text: prompt });

            const response = await anthropic.messages.stream({
              model: 'claude-sonnet-4-20250514',
              messages: [{ role: 'user', content: content as never }],
              max_tokens: 1024,
            });
            for await (const event of response) {
              if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                enqueue({ source: 'claude', chunk: event.delta.text });
              }
            }
          } catch { enqueue({ source: 'claude', error: 'Claude Vision failed' }); }
        })();

        await Promise.allSettled([gptPromise, claudePromise]);
        enqueue({ done: true });
        controller.close();
      },
    });

    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
  }

  // Single model
  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (data: unknown) => {
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)); } catch {}
      };

      try {
        await incrementUsage(teamId, 0.01);

        if (model === 'gpt-4o') {
          const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
          for (const img of images) {
            content.push({ type: 'image_url', image_url: { url: img } });
          }
          content.push({ type: 'text', text: prompt });

          const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: content as never }],
            max_tokens: 1024,
            stream: true,
          });
          for await (const chunk of response) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) enqueue({ chunk: text });
          }
        } else {
          const content: Array<unknown> = [];
          for (const img of images) {
            const match = img.match(/^data:(image\/\w+);base64,(.+)$/);
            if (match) {
              content.push({
                type: 'image',
                source: { type: 'base64', media_type: match[1], data: match[2] },
              });
            }
          }
          content.push({ type: 'text', text: prompt });

          const response = await anthropic.messages.stream({
            model: 'claude-sonnet-4-20250514',
            messages: [{ role: 'user', content: content as never }],
            max_tokens: 1024,
          });
          for await (const event of response) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              enqueue({ chunk: event.delta.text });
            }
          }
        }

        enqueue({ done: true });
      } catch {
        enqueue({ error: 'Vision analysis failed. Try again.' });
      }

      controller.close();
    },
  });

  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
}
