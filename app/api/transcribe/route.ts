import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { ensureSeeded } from '@/lib/seed';

export const maxDuration = 30;
import { checkRateLimit, incrementUsage } from '@/lib/rate-limit';
import { getLanguageName } from '@/lib/languages';
import { toFile } from 'openai';
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
    return NextResponse.json({ ok: false, error: 'Rate limit exceeded' }, { status: 429 });
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    if (!audioFile) {
      return NextResponse.json({ ok: false, error: 'No audio file provided' }, { status: 400 });
    }

    await incrementUsage(teamId, 0.006);

    // Convert to buffer and create a proper file for the OpenAI SDK
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine extension from mime type
    const mimeType = audioFile.type || 'audio/webm';
    const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('wav') ? 'wav' : mimeType.includes('mpeg') ? 'mp3' : 'webm';
    const fileName = `recording.${ext}`;

    const file = await toFile(buffer, fileName, { type: mimeType });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      response_format: 'verbose_json',
    });

    const language = (transcription as unknown as { language?: string }).language || 'en';

    logApiCall(teamId, 'voice', `transcribe (${getLanguageName(language)})`, startTime, true).catch(() => {});
    return NextResponse.json({
      ok: true,
      text: transcription.text,
      language,
      languageName: getLanguageName(language),
      durationSeconds: (transcription as unknown as { duration?: number }).duration || 0,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorDetails = (err as { status?: number; error?: { message?: string } })?.error?.message || errorMessage;
    console.error('[transcribe] error:', errorDetails, err);
    logApiCall(teamId, 'voice', 'transcribe', startTime, false, errorDetails).catch(() => {});
    return NextResponse.json({
      ok: false,
      error: `Transcription failed: ${errorDetails}`
    }, { status: 500 });
  }
}
