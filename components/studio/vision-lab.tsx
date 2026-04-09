'use client';
import { useState, useRef, useCallback } from 'react';
import { useI18n } from '@/lib/i18n-context';
import { fileToDataUrl, resizeIfLarge } from '@/lib/image-utils';
import { TopBar } from './top-bar';
import { ModelToggle } from './model-toggle';
import { SaveDialog } from './save-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, ImageIcon, X, Camera } from 'lucide-react';
import Link from 'next/link';

interface VisionLabProps {
  teamName: string;
  xp: number;
}

const PRESET_KEYS = [
  'products', 'describe', 'translate', 'document', 'crop',
  'trade', 'people', 'numbers', 'caption', 'custom',
] as const;

export function VisionLab({ teamName, xp }: VisionLabProps) {
  const { t } = useI18n();
  const [model, setModel] = useState<'gpt-4o' | 'claude-sonnet' | 'both'>('gpt-4o');
  const [images, setImages] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [gptResponse, setGptResponse] = useState('');
  const [claudeResponse, setClaudeResponse] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [showSave, setShowSave] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addImages = useCallback(async (files: FileList | File[]) => {
    const newImages: string[] = [];
    for (const file of Array.from(files)) {
      if (file.size > 8 * 1024 * 1024) continue;
      if (!file.type.startsWith('image/')) continue;
      const dataUrl = await fileToDataUrl(file);
      const resized = await resizeIfLarge(dataUrl);
      newImages.push(resized);
    }
    setImages(prev => [...prev, ...newImages].slice(0, 3));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) addImages(e.dataTransfer.files);
  }, [addImages]);

  const handleAnalyze = async () => {
    if (images.length === 0 || !prompt.trim()) return;
    setIsAnalyzing(true);
    setError('');
    setResponse('');
    setGptResponse('');
    setClaudeResponse('');

    try {
      const res = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, images, prompt }),
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let gpt = '', claude = '', single = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value, { stream: true }).split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.done) continue;
            if (data.error) { setError(data.error); continue; }

            if (model === 'both') {
              if (data.source === 'gpt') { gpt += data.chunk; setGptResponse(gpt); }
              else if (data.source === 'claude') { claude += data.chunk; setClaudeResponse(claude); }
            } else if (data.chunk) {
              single += data.chunk;
              setResponse(single);
            }
          } catch {}
        }
      }
    } catch {
      setError('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePreset = (key: string) => {
    if (key === 'custom') return;
    const presetKey = `vision.preset.${key}` as Parameters<typeof t>[0];
    setPrompt(t(presetKey));
  };

  const handleSaveToGallery = async (title: string) => {
    await fetch('/api/gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'vision',
        title,
        data: {
          model,
          prompt,
          response: model === 'both' ? { gpt: gptResponse, claude: claudeResponse } : response,
          imageCount: images.length,
        },
      }),
    });
  };

  const hasResponse = response || gptResponse || claudeResponse;

  return (
    <div className="min-h-screen bg-mest-paper flex flex-col">
      <TopBar teamName={teamName} xp={xp} />

      <div className="bg-white border-b border-mest-grey-300/60 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link href="/studio" className="text-mest-grey-500 hover:text-mest-ink">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="font-serif text-xl text-mest-ink">{t('vision.title')}</h1>
          </div>
          <div className="flex items-center gap-3">
            <ModelToggle value={model} onChange={setModel} disabled={isAnalyzing} />
            {hasResponse && (
              <Button variant="outline" size="sm" onClick={() => setShowSave(true)} className="gap-1.5">
                <Save size={14} />
                {t('chat.save')}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 space-y-6">
        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragging ? 'border-mest-blue bg-mest-blue-light' : 'border-mest-grey-300 hover:border-mest-blue/40'
          }`}
        >
          <input
            type="file"
            ref={fileRef}
            onChange={e => e.target.files && addImages(e.target.files)}
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
          />
          <ImageIcon size={40} className="mx-auto text-mest-grey-300 mb-3" />
          <p className="text-mest-grey-500">{t('vision.dropzone')}</p>
          <p className="text-xs text-mest-grey-300 mt-1 hidden sm:block">{t('vision.dropzone.mobile')}</p>
        </div>

        {/* Mobile camera */}
        <div className="sm:hidden">
          <label className="flex items-center gap-2 justify-center text-sm text-mest-blue cursor-pointer">
            <Camera size={16} />
            <span>{t('vision.dropzone.mobile')}</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={e => e.target.files && addImages(e.target.files)}
              className="hidden"
            />
          </label>
        </div>

        {/* Image previews */}
        {images.length > 0 && (
          <div className="flex gap-3 flex-wrap">
            {images.map((img, i) => (
              <div key={i} className="relative">
                <img src={img} alt={`Upload ${i + 1}`} className="h-24 rounded-lg object-cover" />
                <button
                  onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                  className="absolute -top-2 -right-2 bg-mest-rust text-white rounded-full p-0.5"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {images.length < 3 && (
              <button
                onClick={() => fileRef.current?.click()}
                className="h-24 w-24 rounded-lg border-2 border-dashed border-mest-grey-300 flex items-center justify-center text-mest-grey-300 hover:border-mest-blue/40"
              >
                +
              </button>
            )}
          </div>
        )}

        {/* Preset prompts */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Select onValueChange={(v) => handlePreset(v as string)}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder={t('vision.presets')} />
            </SelectTrigger>
            <SelectContent>
              {PRESET_KEYS.map(key => (
                <SelectItem key={key} value={key}>
                  {t(`vision.preset.${key}` as Parameters<typeof t>[0])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Custom prompt */}
        <div className="space-y-2">
          <Textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder={t('vision.promptPlaceholder')}
            rows={2}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleAnalyze}
              disabled={images.length === 0 || !prompt.trim() || isAnalyzing}
              className="bg-mest-blue hover:bg-mest-blue/90 text-white gap-1.5"
            >
              {isAnalyzing ? t('vision.analyzing') : t('vision.analyze')}
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-mest-rust-light text-mest-rust px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        {/* Response */}
        {model === 'both' && (gptResponse || claudeResponse || isAnalyzing) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-mest-grey-300/60 p-6">
              <h3 className="text-sm font-semibold text-green-700 mb-2">GPT-4o</h3>
              <div className="text-sm text-mest-grey-700 whitespace-pre-wrap">
                {gptResponse || (isAnalyzing ? <span className="animate-pulse">{t('vision.analyzing')}</span> : '')}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-mest-grey-300/60 p-6">
              <h3 className="text-sm font-semibold text-purple-700 mb-2">Claude Sonnet</h3>
              <div className="text-sm text-mest-grey-700 whitespace-pre-wrap">
                {claudeResponse || (isAnalyzing ? <span className="animate-pulse">{t('vision.analyzing')}</span> : '')}
              </div>
            </div>
          </div>
        ) : (response || isAnalyzing) ? (
          <div className="bg-white rounded-xl border border-mest-grey-300/60 p-6">
            <div className="text-sm text-mest-grey-700 whitespace-pre-wrap">
              {response || (isAnalyzing ? <span className="animate-pulse">{t('vision.analyzing')}</span> : '')}
            </div>
          </div>
        ) : null}
      </div>

      <SaveDialog
        open={showSave}
        onClose={() => setShowSave(false)}
        defaultTitle={prompt.slice(0, 60) || 'Vision analysis'}
        onSave={handleSaveToGallery}
      />
    </div>
  );
}
