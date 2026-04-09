import { NextRequest } from 'next/server';
import { openai } from '@/lib/openai';
import { anthropic } from '@/lib/anthropic';
import { storage } from '@/lib/storage';
import { ensureSeeded } from '@/lib/seed';
import { checkRateLimit, incrementUsage } from '@/lib/rate-limit';
import type { Session } from '@/lib/types';

export async function POST(req: NextRequest) {
  await ensureSeeded();

  const sessionId = req.cookies.get('mest_session')?.value;
  if (!sessionId) return new Response('Unauthorized', { status: 401 });

  const session = await storage.get<Session>(`session:${sessionId}`);
  if (!session) return new Response('Unauthorized', { status: 401 });

  const { allowed } = await checkRateLimit(session.teamId);
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
  const encoder = new TextEncoder();

  if (model === 'both') {
    const stream = new ReadableStream({
      async start(controller) {
        const enqueue = (data: unknown) => {
          try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)); } catch {}
        };

        const gptPromise = (async () => {
          try {
            await incrementUsage(session.teamId, 0.01);
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
            await incrementUsage(session.teamId, 0.01);
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
        await incrementUsage(session.teamId, 0.01);

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
