import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { ensureSeeded } from '@/lib/seed';
import { checkRateLimit, incrementUsage } from '@/lib/rate-limit';
import { storage } from '@/lib/storage';
import { getLanguageName } from '@/lib/languages';
import type { Session } from '@/lib/types';

export async function POST(req: NextRequest) {
  await ensureSeeded();

  const sessionId = req.cookies.get('mest_session')?.value;
  if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const session = await storage.get<Session>(`session:${sessionId}`);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { allowed } = await checkRateLimit(session.teamId);
  if (!allowed) {
    return NextResponse.json({ ok: false, error: 'Rate limit exceeded' }, { status: 429 });
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    if (!audioFile) {
      return NextResponse.json({ ok: false, error: 'No audio file provided' }, { status: 400 });
    }

    await incrementUsage(session.teamId, 0.006);

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'verbose_json',
    });

    const language = (transcription as unknown as { language?: string }).language || 'en';

    return NextResponse.json({
      ok: true,
      text: transcription.text,
      language,
      languageName: getLanguageName(language),
      durationSeconds: (transcription as unknown as { duration?: number }).duration || 0,
    });
  } catch (err) {
    console.error('[transcribe] error:', err);
    return NextResponse.json({ ok: false, error: 'Transcription failed. Please try again.' }, { status: 500 });
  }
}
