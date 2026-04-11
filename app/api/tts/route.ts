import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { ensureSeeded } from '@/lib/seed';

export const maxDuration = 30;
import { checkRateLimit, incrementUsage } from '@/lib/rate-limit';
import { logApiCall } from '@/lib/health-metrics';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  await ensureSeeded();

  const teamCookie = req.cookies.get('mest_team')?.value;
  if (!teamCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let teamId: string;
  try { teamId = JSON.parse(decodeURIComponent(teamCookie)).id; } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const { allowed } = await checkRateLimit(teamId);
  if (!allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  try {
    const { text, voice = 'nova' } = await req.json();

    if (!text || text.length > 4096) {
      return NextResponse.json({ error: 'Text too long or empty' }, { status: 400 });
    }

    await incrementUsage(teamId, 0.015);

    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
      input: text,
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    logApiCall(teamId, 'voice', `tts (${voice})`, startTime, true).catch(() => {});

    return new Response(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (err) {
    console.error('[tts] error:', err);
    return NextResponse.json({ error: 'Voice generation failed. Please try again.' }, { status: 500 });
  }
}
