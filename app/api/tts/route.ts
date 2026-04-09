import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { ensureSeeded } from '@/lib/seed';
import { checkRateLimit, incrementUsage } from '@/lib/rate-limit';
import { storage } from '@/lib/storage';
import type { Session } from '@/lib/types';

export async function POST(req: NextRequest) {
  await ensureSeeded();

  const sessionId = req.cookies.get('mest_session')?.value;
  if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const session = await storage.get<Session>(`session:${sessionId}`);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { allowed } = await checkRateLimit(session.teamId);
  if (!allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  try {
    const { text, voice = 'nova' } = await req.json();

    if (!text || text.length > 4096) {
      return NextResponse.json({ error: 'Text too long or empty' }, { status: 400 });
    }

    await incrementUsage(session.teamId, 0.015);

    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
      input: text,
    });

    const buffer = Buffer.from(await response.arrayBuffer());

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
