import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { ensureSeeded } from '@/lib/seed';
import { checkRateLimit, incrementUsage } from '@/lib/rate-limit';
import { getLanguageName } from '@/lib/languages';

export async function POST(req: NextRequest) {
  await ensureSeeded();

  const teamCookie = req.cookies.get('mest_team')?.value;
  if (!teamCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let teamId: string;
  try { teamId = JSON.parse(decodeURIComponent(teamCookie)).id; } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const { allowed } = await checkRateLimit(teamId);
  if (!allowed) {
    return NextResponse.json({ ok: false, error: 'Rate limit exceeded' }, { status: 429 });
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    if (!audioFile) {
      return NextResponse.json({ ok: false, error: 'No audio file provided' }, { status: 400 });
    }

    await incrementUsage(teamId, 0.006);

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
