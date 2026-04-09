import { NextRequest } from 'next/server';
import { storage } from '@/lib/storage';
import { ensureSeeded } from '@/lib/seed';
import { checkRateLimit, incrementUsage } from '@/lib/rate-limit';
import { executeChain } from '@/lib/chain-executor';
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

  const { blocks } = await req.json();
  const encoder = new TextEncoder();
  const startTime = Date.now();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        await incrementUsage(session.teamId, 0.02);

        for await (const event of executeChain(blocks)) {
          const data = event as Record<string, unknown>;
          if (data.done) {
            data.totalDurationMs = Date.now() - startTime;
          }
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          } catch { break; }
        }
      } catch (err) {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Chain execution failed' })}\n\n`));
        } catch {}
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  });
}
