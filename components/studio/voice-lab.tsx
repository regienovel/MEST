'use client';
import { useState, useRef } from 'react';
import { useI18n } from '@/lib/i18n-context';
import { useAudioRecorder } from '@/lib/hooks/use-audio-recorder';
import { TopBar } from './top-bar';
import { ModelToggle } from './model-toggle';
import { SaveDialog } from './save-dialog';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { Mic, Square, Upload, Volume2, ArrowLeft, Save, Download } from 'lucide-react';
import Link from 'next/link';

const VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const;

interface VoiceLabProps {
  teamName: string;
  xp: number;
}

export function VoiceLab({ teamName, xp }: VoiceLabProps) {
  const { t } = useI18n();
  const { recording, audioLevel, start, stop } = useAudioRecorder();

  const [model, setModel] = useState<'gpt-4o' | 'claude-sonnet' | 'both'>('gpt-4o');
  const [voice, setVoice] = useState<string>('nova');
  const [transcription, setTranscription] = useState('');
  const [detectedLang, setDetectedLang] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null);
  const [continuous, setContinuous] = useState(false);
  const [error, setError] = useState('');
  const [showSave, setShowSave] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const continuousRef = useRef(false);
  continuousRef.current = continuous;

  async function handleRecord() {
    if (recording) {
      const blob = await stop();
      if (blob.size < 1000) {
        setError(t('voice.tooShort'));
        return;
      }
      await processAudio(blob);
    } else {
      setError('');
      setTranscription('');
      setAiResponse('');
      setTtsAudioUrl(null);
      try {
        await start();
      } catch {
        setError(t('voice.permissionDenied'));
      }
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setError('');
    setTranscription('');
    setAiResponse('');
    setTtsAudioUrl(null);
    await processAudio(file);
  }

  async function processAudio(audio: Blob | File) {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      // Use correct extension based on mime type
      const ext = audio.type?.includes('mp4') ? 'mp4' : audio.type?.includes('wav') ? 'wav' : 'webm';
      formData.append('audio', audio, `recording.${ext}`);
      const res = await fetch('/api/transcribe', { method: 'POST', body: formData });
      const data = await res.json();

      if (!data.ok) {
        setError(data.error || 'Transcription failed');
        setIsTranscribing(false);
        return;
      }

      setTranscription(data.text);
      setDetectedLang(`${data.languageName} (${data.language})`);
      setIsTranscribing(false);

      // Get AI response
      await getAiResponse(data.text);
    } catch {
      setError('Transcription failed. Please try again.');
      setIsTranscribing(false);
    }
  }

  async function getAiResponse(text: string) {
    setIsResponding(true);
    setAiResponse('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model === 'both' ? 'gpt-4o' : model,
          messages: [{ role: 'user', content: text }],
          temperature: 0.7,
          maxTokens: 1024,
        }),
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value, { stream: true }).split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.chunk) {
              fullResponse += data.chunk;
              setAiResponse(fullResponse);
            }
          } catch {}
        }
      }

      setIsResponding(false);

      // Auto-speak in continuous mode
      if (continuousRef.current && fullResponse) {
        await speakResponse(fullResponse);
      }
    } catch {
      setError('AI response failed. Please try again.');
      setIsResponding(false);
    }
  }

  async function speakResponse(text?: string) {
    const textToSpeak = text || aiResponse;
    if (!textToSpeak) return;

    setIsSpeaking(true);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSpeak.slice(0, 4096), voice }),
      });

      if (!res.ok) throw new Error('TTS failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setTtsAudioUrl(url);

      const audio = new Audio(url);
      audio.onended = () => {
        setIsSpeaking(false);
        if (continuousRef.current) {
          handleRecord();
        }
      };
      await audio.play();
    } catch {
      setError('Voice generation failed. Please try again.');
      setIsSpeaking(false);
    }
  }

  async function handleSaveToGallery(title: string) {
    await fetch('/api/gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'voice',
        title,
        data: { transcription, detectedLang, aiResponse, model },
      }),
    });
  }

  const hasContent = transcription || aiResponse;

  return (
    <div className="min-h-screen bg-mest-paper flex flex-col">
      <TopBar teamName={teamName} xp={xp} />

      <div className="bg-white border-b border-mest-grey-300/60 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link href="/studio" className="text-mest-grey-500 hover:text-mest-ink">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="font-serif text-xl text-mest-ink">{t('voice.title')}</h1>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <ModelToggle value={model} onChange={setModel} disabled={isResponding} />

            <NativeSelect value={voice} onChange={setVoice} className="w-28">
              {VOICES.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </NativeSelect>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={continuous}
                onChange={e => setContinuous(e.target.checked)}
                className="rounded"
              />
              {t('voice.continuousMode')}
            </label>

            {hasContent && (
              <Button variant="outline" size="sm" onClick={() => setShowSave(true)} className="gap-1.5">
                <Save size={14} />
                {t('chat.save')}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 space-y-8">
        {/* Record button */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleRecord}
            disabled={isTranscribing || isResponding}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
              recording
                ? 'bg-mest-rust text-white animate-pulse scale-110'
                : 'bg-mest-blue text-white hover:bg-mest-blue/90 hover:scale-105'
            } ${(isTranscribing || isResponding) ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={recording ? t('voice.recordStop') : t('voice.recordStart')}
          >
            {recording ? <Square size={32} /> : <Mic size={32} />}
          </button>

          <p className="text-sm text-mest-grey-500">
            {recording ? t('voice.recording') : isTranscribing ? t('voice.transcribing') : t('voice.recordStart')}
          </p>

          {/* Audio level */}
          {recording && (
            <div className="flex gap-1 items-end h-8">
              {Array.from({ length: 16 }).map((_, i) => (
                <div
                  key={i}
                  className="w-2 bg-mest-blue rounded-full transition-all duration-75"
                  style={{
                    height: `${Math.max(4, audioLevel * 32 * (0.5 + Math.random() * 0.5))}px`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Upload alternative */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileRef}
              onChange={handleFileUpload}
              accept="audio/mp3,audio/wav,audio/webm,audio/m4a,audio/mpeg"
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={recording || isTranscribing}
              className="gap-1.5"
            >
              <Upload size={14} />
              {t('voice.uploadAudio')}
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-mest-rust-light text-mest-rust px-4 py-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {/* Transcription */}
        {(transcription || isTranscribing) && (
          <div className="bg-white rounded-xl border border-mest-grey-300/60 p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-mest-ink">📝 Transcription</span>
              {detectedLang && (
                <span className="text-xs bg-mest-teal-light text-mest-teal px-2 py-0.5 rounded-full">
                  {t('voice.detected')}: {detectedLang}
                </span>
              )}
            </div>
            {isTranscribing ? (
              <p className="text-sm text-mest-grey-500 animate-pulse">{t('voice.transcribing')}</p>
            ) : (
              <p className="text-sm text-mest-grey-700 whitespace-pre-wrap">{transcription}</p>
            )}
          </div>
        )}

        {/* AI Response */}
        {(aiResponse || isResponding) && (
          <div className="bg-white rounded-xl border border-mest-grey-300/60 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-mest-ink">
                🤖 {model === 'gpt-4o' ? 'GPT-4o' : 'Claude Sonnet'}
              </span>
              {aiResponse && !isResponding && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => speakResponse()}
                  disabled={isSpeaking}
                  className="gap-1.5"
                >
                  <Volume2 size={14} />
                  {isSpeaking ? t('voice.speaking') : t('voice.speak')}
                </Button>
              )}
            </div>
            {isResponding && !aiResponse ? (
              <p className="text-sm text-mest-grey-500 animate-pulse">{t('chat.thinking')}</p>
            ) : (
              <p className="text-sm text-mest-grey-700 whitespace-pre-wrap">{aiResponse}</p>
            )}
          </div>
        )}

        {/* Audio player */}
        {ttsAudioUrl && (
          <div className="flex items-center gap-3">
            <audio controls src={ttsAudioUrl} className="flex-1" />
            <a href={ttsAudioUrl} download={`voice-${Date.now()}.mp3`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download size={14} />
              </Button>
            </a>
          </div>
        )}
      </div>

      <SaveDialog
        open={showSave}
        onClose={() => setShowSave(false)}
        defaultTitle={transcription.slice(0, 60) || 'Voice interaction'}
        onSave={handleSaveToGallery}
      />
    </div>
  );
}
