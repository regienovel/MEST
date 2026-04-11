import { NextRequest } from 'next/server';
import { ensureSeeded } from '@/lib/seed';
import { checkRateLimit, incrementUsage } from '@/lib/rate-limit';
import { executeChain } from '@/lib/chain-executor';
import { logApiCall } from '@/lib/health-metrics';

// Allow up to 60 seconds for chain execution (default is 10s on Vercel Hobby)
export const maxDuration = 60;

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

  const { blocks } = await req.json();
  const encoder = new TextEncoder();
  logApiCall(teamId, 'chain', `run (${blocks?.length || 0} blocks)`, startTime, true).catch(() => {});

  const stream = new ReadableStream({
    async start(controller) {
      try {
        await incrementUsage(teamId, 0.02);
        console.log(`[chain-run] Starting chain with ${blocks.length} blocks`);

        for await (const event of executeChain(blocks)) {
          const data = event as Record<string, unknown>;
          if (data.done) {
            data.totalDurationMs = Date.now() - startTime;
            console.log(`[chain-run] Chain completed in ${data.totalDurationMs}ms, success=${data.success}`);
          }
          if (data.status === 'error') {
            console.error(`[chain-run] Block ${data.blockId} error: ${data.error}`);
          }
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          } catch { break; }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Chain execution failed';
        console.error(`[chain-run] Fatal error: ${errorMsg}`);
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`));
        } catch {}
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  });
}
