'use client';
import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n-context';
import { TopBar } from './top-bar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';
import {
  ArrowLeft, Play, Save, Trash2, ChevronUp, ChevronDown, X,
  Type, Image, AudioLines, MessageSquare, Mic, Volume2, Eye,
  Languages, Braces, AlignLeft, Monitor, Headphones, ImageIcon
} from 'lucide-react';
import Link from 'next/link';
import type { ChainBlock, ChainBlockType } from '@/lib/types';

interface ChainBuilderProps {
  teamName: string;
  xp: number;
}

interface BlockStatus {
  status: 'idle' | 'running' | 'done' | 'error';
  output?: unknown;
  error?: string;
}

const BLOCK_PALETTE: Array<{ category: string; categoryKey: string; items: Array<{ type: ChainBlockType; labelKey: string; icon: React.ElementType; defaultConfig: Record<string, unknown> }> }> = [
  {
    category: 'Inputs', categoryKey: 'chain.blocks.inputs',
    items: [
      { type: 'input-text', labelKey: 'chain.block.inputText', icon: Type, defaultConfig: { value: '' } },
      { type: 'input-image', labelKey: 'chain.block.inputImage', icon: Image, defaultConfig: { dataUrl: '' } },
      { type: 'input-audio', labelKey: 'chain.block.inputAudio', icon: AudioLines, defaultConfig: { dataUrl: '' } },
    ],
  },
  {
    category: 'Process', categoryKey: 'chain.blocks.process',
    items: [
      { type: 'process-chat-gpt', labelKey: 'chain.block.chatGpt', icon: MessageSquare, defaultConfig: { prompt: '{{previous}}', temperature: 0.7 } },
      { type: 'process-chat-claude', labelKey: 'chain.block.chatClaude', icon: MessageSquare, defaultConfig: { prompt: '{{previous}}', temperature: 0.7 } },
      { type: 'process-transcribe', labelKey: 'chain.block.transcribe', icon: Mic, defaultConfig: {} },
      { type: 'process-tts', labelKey: 'chain.block.tts', icon: Volume2, defaultConfig: { voice: 'nova' } },
      { type: 'process-vision-gpt', labelKey: 'chain.block.visionGpt', icon: Eye, defaultConfig: { prompt: 'Describe this image in detail.' } },
      { type: 'process-vision-claude', labelKey: 'chain.block.visionClaude', icon: Eye, defaultConfig: { prompt: 'Describe this image in detail.' } },
      { type: 'process-translate', labelKey: 'chain.block.translate', icon: Languages, defaultConfig: { targetLanguage: 'French' } },
      { type: 'process-extract-json', labelKey: 'chain.block.extractJson', icon: Braces, defaultConfig: { schema: '{ key: string }' } },
      { type: 'process-summarize', labelKey: 'chain.block.summarize', icon: AlignLeft, defaultConfig: { maxWords: 50 } },
    ],
  },
  {
    category: 'Outputs', categoryKey: 'chain.blocks.outputs',
    items: [
      { type: 'output-text', labelKey: 'chain.block.outputText', icon: Monitor, defaultConfig: { label: 'Result' } },
      { type: 'output-audio', labelKey: 'chain.block.outputAudio', icon: Headphones, defaultConfig: { label: 'Audio' } },
      { type: 'output-image', labelKey: 'chain.block.outputImage', icon: ImageIcon, defaultConfig: { label: 'Image' } },
    ],
  },
];

interface Template {
  id: string;
  name: string;
  nameFr?: string;
  description: string;
  descriptionFr?: string;
  blocks: ChainBlock[];
}

export function ChainBuilder({ teamName, xp }: ChainBuilderProps) {
  const { t, locale } = useI18n();
  const [blocks, setBlocks] = useState<ChainBlock[]>([]);
  const [chainName, setChainName] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [blockStatuses, setBlockStatuses] = useState<Record<string, BlockStatus>>({});
  const [templates, setTemplates] = useState<Template[]>([]);
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(() => {
        // Load templates from seed
        fetch('/api/chain/templates')
          .then(r => r.json())
          .then(d => setTemplates(d.templates || []))
          .catch(() => {});
      })
      .catch(() => {});
  }, []);

  const addBlock = (type: ChainBlockType, defaultConfig: Record<string, unknown>) => {
    const newBlock: ChainBlock = {
      id: crypto.randomUUID(),
      type,
      config: { ...defaultConfig },
    };
    setBlocks(prev => [...prev, newBlock]);
    setExpandedBlock(newBlock.id);
  };

  const removeBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    setBlocks(newBlocks);
  };

  const updateConfig = (id: string, key: string, value: unknown) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, config: { ...b.config, [key]: value } } : b));
  };

  const loadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setBlocks(template.blocks.map(b => ({ ...b, id: crypto.randomUUID() })));
      setChainName(locale === 'fr' && template.nameFr ? template.nameFr : template.name);
    }
  };

  const runChain = async () => {
    setIsRunning(true);
    setBlockStatuses({});

    try {
      const res = await fetch('/api/chain/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks }),
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value, { stream: true }).split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.done) continue;
            if (data.blockId) {
              setBlockStatuses(prev => ({
                ...prev,
                [data.blockId]: {
                  status: data.status,
                  output: data.output,
                  error: data.error,
                },
              }));
            }
          } catch {}
        }
      }
    } catch {
      // Connection lost or timeout
    } finally {
      // Mark any blocks still showing "running" as errored (stream ended unexpectedly)
      setBlockStatuses(prev => {
        const updated = { ...prev };
        for (const block of blocks) {
          if (updated[block.id]?.status === 'running') {
            updated[block.id] = { status: 'error', error: 'Timed out or connection lost. Try running again.' };
          }
        }
        return updated;
      });
      setIsRunning(false);
    }
  };

  const saveChain = async () => {
    if (!chainName.trim()) return;
    await fetch('/api/chain/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: chainName, blocks }),
    });
  };

  const clearChain = () => {
    setBlocks([]);
    setChainName('');
    setBlockStatuses({});
  };

  return (
    <div className="min-h-screen bg-mest-paper flex flex-col">
      <TopBar teamName={teamName} xp={xp} />

      <div className="bg-white border-b border-mest-grey-300/60 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link href="/studio" className="text-mest-grey-500 hover:text-mest-ink">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="font-serif text-xl text-mest-ink">{t('chain.title')}</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Input
              value={chainName}
              onChange={e => setChainName(e.target.value)}
              placeholder={t('chain.namePlaceholder')}
              className="w-48"
            />
            <NativeSelect value="" onChange={loadTemplate} placeholder={t('chain.templates')} className="w-36">
              {templates.map(tpl => (
                <option key={tpl.id} value={tpl.id}>
                  {locale === 'fr' && tpl.nameFr ? tpl.nameFr : tpl.name}
                </option>
              ))}
            </NativeSelect>
            <Button variant="outline" size="sm" onClick={clearChain} className="gap-1.5">
              <Trash2 size={14} />
              {t('chain.clear')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={saveChain}
              disabled={!chainName.trim() || blocks.length === 0}
              className="gap-1.5"
            >
              <Save size={14} />
              {t('chain.save')}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Block palette */}
          <div className="lg:w-56 shrink-0">
            <div className="bg-white rounded-xl border border-mest-grey-300/60 p-4 space-y-4 sticky top-20">
              {BLOCK_PALETTE.map(cat => (
                <div key={cat.category}>
                  <h3 className="text-xs font-semibold text-mest-grey-500 uppercase mb-2">
                    {t(cat.categoryKey as Parameters<typeof t>[0])}
                  </h3>
                  <div className="space-y-1">
                    {cat.items.map(item => (
                      <button
                        key={item.type}
                        onClick={() => addBlock(item.type, item.defaultConfig)}
                        disabled={isRunning}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-mest-grey-700 hover:bg-mest-grey-100 rounded-lg transition-colors text-left"
                      >
                        <item.icon size={14} />
                        {t(item.labelKey as Parameters<typeof t>[0])}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 space-y-3">
            {blocks.length === 0 ? (
              <div className="bg-mest-paper border-2 border-dashed border-mest-grey-300 rounded-xl p-12 text-center">
                <p className="text-mest-grey-500 font-serif text-lg italic">{t('chain.empty')}</p>
              </div>
            ) : (
              blocks.map((block, i) => {
                const status = blockStatuses[block.id];
                const paletteItem = BLOCK_PALETTE.flatMap(c => c.items).find(it => it.type === block.type);
                const Icon = paletteItem?.icon || Type;
                const borderColor = status?.status === 'running' ? 'border-mest-blue' :
                  status?.status === 'done' ? 'border-mest-sage' :
                  status?.status === 'error' ? 'border-mest-rust' : 'border-mest-grey-300/60';

                return (
                  <div key={block.id} className={`bg-white rounded-xl border-2 ${borderColor} transition-colors`}>
                    <div className="flex items-center gap-2 px-4 py-3">
                      <span className="text-xs text-mest-grey-300 font-mono w-6">{i + 1}.</span>
                      <Icon size={16} className="text-mest-grey-500" />
                      <span className="text-sm font-medium text-mest-ink flex-1">
                        {t(paletteItem?.labelKey as Parameters<typeof t>[0] || block.type)}
                      </span>
                      {status?.status && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          status.status === 'running' ? 'bg-mest-blue-light text-mest-blue animate-pulse' :
                          status.status === 'done' ? 'bg-mest-sage-light text-mest-sage' :
                          'bg-mest-rust-light text-mest-rust'
                        }`}>
                          {t(`chain.status.${status.status}` as Parameters<typeof t>[0])}
                        </span>
                      )}
                      <div className="flex items-center gap-1">
                        <button onClick={() => moveBlock(i, -1)} disabled={i === 0 || isRunning} className="p-1 hover:bg-mest-grey-100 rounded disabled:opacity-30">
                          <ChevronUp size={14} />
                        </button>
                        <button onClick={() => moveBlock(i, 1)} disabled={i === blocks.length - 1 || isRunning} className="p-1 hover:bg-mest-grey-100 rounded disabled:opacity-30">
                          <ChevronDown size={14} />
                        </button>
                        <button
                          onClick={() => setExpandedBlock(expandedBlock === block.id ? null : block.id)}
                          className="p-1 hover:bg-mest-grey-100 rounded text-xs text-mest-grey-500"
                        >
                          ⚙
                        </button>
                        <button onClick={() => removeBlock(block.id)} disabled={isRunning} className="p-1 hover:bg-mest-rust-light rounded text-mest-grey-300 hover:text-mest-rust disabled:opacity-30">
                          <X size={14} />
                        </button>
                      </div>
                    </div>

                    {expandedBlock === block.id && (
                      <div className="border-t border-mest-grey-300/60 px-4 py-3 space-y-2">
                        <BlockConfig block={block} onUpdate={(key, val) => updateConfig(block.id, key, val)} />
                      </div>
                    )}

                    {status?.output !== undefined && status?.output !== null && (
                      <div className="border-t border-mest-grey-300/60 px-4 py-3 bg-mest-grey-50">
                        <BlockOutput output={status.output} type={block.type} />
                      </div>
                    )}

                    {status?.error && (
                      <div className="border-t border-mest-rust/20 px-4 py-2 bg-mest-rust-light text-mest-rust text-sm">
                        {status.error}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {blocks.length > 0 && (
              <div className="flex justify-center pt-4">
                <Button
                  onClick={runChain}
                  disabled={isRunning || blocks.length === 0}
                  className="bg-mest-gold hover:bg-mest-gold/90 text-white gap-2 px-8 py-3 text-base"
                >
                  <Play size={18} />
                  {isRunning ? t('chain.running') : t('chain.run')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BlockConfig({ block, onUpdate }: { block: ChainBlock; onUpdate: (key: string, value: unknown) => void }) {
  switch (block.type) {
    case 'input-text':
      return (
        <Textarea
          value={(block.config.value as string) || ''}
          onChange={e => onUpdate('value', e.target.value)}
          placeholder="Enter text..."
          rows={3}
        />
      );
    case 'input-image':
      return <FileUploadConfig accept="image/jpeg,image/png,image/webp,image/gif" label="Upload image" currentValue={block.config.dataUrl as string} onUpdate={(v) => onUpdate('dataUrl', v)} />;
    case 'input-audio':
      return <FileUploadConfig accept="audio/mp3,audio/wav,audio/webm,audio/m4a,audio/mpeg" label="Upload audio" currentValue={block.config.dataUrl as string} onUpdate={(v) => onUpdate('dataUrl', v)} />;
    case 'process-chat-gpt':
    case 'process-chat-claude':
      return (
        <div className="space-y-2">
          <Textarea
            value={(block.config.prompt as string) || ''}
            onChange={e => onUpdate('prompt', e.target.value)}
            placeholder="Prompt (use {{previous}} for previous output)"
            rows={3}
          />
          <Input
            value={(block.config.systemPrompt as string) || ''}
            onChange={e => onUpdate('systemPrompt', e.target.value)}
            placeholder="System prompt (optional)"
          />
        </div>
      );
    case 'process-vision-gpt':
    case 'process-vision-claude':
      return (
        <Textarea
          value={(block.config.prompt as string) || ''}
          onChange={e => onUpdate('prompt', e.target.value)}
          placeholder="Vision prompt"
          rows={2}
        />
      );
    case 'process-tts':
      return (
        <NativeSelect value={(block.config.voice as string) || 'nova'} onChange={(v) => onUpdate('voice', v)}>
          {['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'].map(v => (
            <option key={v} value={v}>{v}</option>
          ))}
        </NativeSelect>
      );
    case 'process-translate':
      return (
        <Input
          value={(block.config.targetLanguage as string) || ''}
          onChange={e => onUpdate('targetLanguage', e.target.value)}
          placeholder="Target language (e.g., French, Twi, Yoruba)"
        />
      );
    case 'process-extract-json':
      return (
        <Input
          value={(block.config.schema as string) || ''}
          onChange={e => onUpdate('schema', e.target.value)}
          placeholder="JSON schema"
        />
      );
    case 'process-summarize':
      return (
        <Input
          type="number"
          value={(block.config.maxWords as number) || 50}
          onChange={e => onUpdate('maxWords', parseInt(e.target.value) || 50)}
          placeholder="Max words"
        />
      );
    case 'output-text':
    case 'output-audio':
    case 'output-image':
      return (
        <Input
          value={(block.config.label as string) || ''}
          onChange={e => onUpdate('label', e.target.value)}
          placeholder="Output label"
        />
      );
    default:
      return <p className="text-xs text-mest-grey-500">No configuration needed.</p>;
  }
}

function FileUploadConfig({ accept, label, currentValue, onUpdate }: { accept: string; label: string; currentValue: string; onUpdate: (v: string) => void }) {
  const isImage = accept.startsWith('image');
  const hasFile = !!currentValue;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onUpdate(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-2">
      {hasFile && isImage && (
        <img src={currentValue} alt="Uploaded" className="max-h-32 rounded-lg" />
      )}
      {hasFile && !isImage && (
        <div className="flex items-center gap-2">
          <audio controls src={currentValue} className="flex-1" />
        </div>
      )}
      <div className="flex items-center gap-2">
        <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 text-sm bg-mest-grey-100 hover:bg-mest-grey-300/50 rounded-lg transition-colors">
          {hasFile ? `Change ${label.toLowerCase()}` : label}
          <input type="file" accept={accept} onChange={handleFile} className="hidden" />
        </label>
        {hasFile && (
          <button onClick={() => onUpdate('')} className="text-xs text-mest-rust hover:underline">Remove</button>
        )}
      </div>
    </div>
  );
}

function BlockOutput({ output, type }: { output: unknown; type: ChainBlockType }) {
  if (typeof output === 'string') {
    if (output.startsWith('data:audio/')) {
      return <audio controls src={output} className="w-full" />;
    }
    if (output.startsWith('data:image/')) {
      return <img src={output} alt="Output" className="max-h-48 rounded-lg" />;
    }
    return (
      <div className="text-sm text-mest-grey-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
        {output}
      </div>
    );
  }
  return (
    <pre className="text-xs text-mest-grey-500 overflow-x-auto">
      {JSON.stringify(output, null, 2)}
    </pre>
  );
}
