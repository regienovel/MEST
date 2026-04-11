'use client';
import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n-context';
import { TopBar } from './top-bar';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { Modal } from '@/components/ui/modal';
import { ArrowLeft, MessageSquare, Mic, Eye, Workflow, Star, GitFork, Eye as EyeIcon, Copy, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface GalleryItem {
  id: string;
  teamId: string;
  teamName: string;
  type: 'chat' | 'voice' | 'vision' | 'chain';
  title: string;
  description?: string;
  data: unknown;
  createdAt: string;
  views: number;
  forks: number;
  featured: boolean;
}

interface GalleryProps {
  teamId: string;
  teamName: string;
  xp: number;
  teams: Array<{ id: string; name: string }>;
}

const TYPE_ICONS = {
  chat: MessageSquare,
  voice: Mic,
  vision: Eye,
  chain: Workflow,
};

function timeAgo(date: string, locale: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return locale === 'fr' ? "à l'instant" : 'just now';
  if (mins < 60) return locale === 'fr' ? `il y a ${mins} min` : `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return locale === 'fr' ? `il y a ${hours}h` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return locale === 'fr' ? `il y a ${days}j` : `${days}d ago`;
}

export function Gallery({ teamId, teamName, xp, teams }: GalleryProps) {
  const { t, locale } = useI18n();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [type, setType] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [detailData, setDetailData] = useState<GalleryItem | null>(null);

  const fetchItems = useCallback(() => {
    const params = new URLSearchParams({ sort });
    if (type !== 'all') params.set('type', type);
    if (teamFilter !== 'all') params.set('teamId', teamFilter);

    fetch(`/api/gallery?${params}`)
      .then(r => r.json())
      .then(d => setItems(d.items || []))
      .catch(() => {});
  }, [type, teamFilter, sort]);

  useEffect(() => {
    fetchItems();
    const interval = setInterval(fetchItems, 10000);
    return () => clearInterval(interval);
  }, [fetchItems]);

  const openDetail = async (item: GalleryItem) => {
    setSelectedItem(item);
    const res = await fetch(`/api/gallery/${item.id}`);
    const data = await res.json();
    setDetailData(data.item);
  };

  const [actionMessage, setActionMessage] = useState('');

  const handleFork = async (id: string) => {
    const res = await fetch(`/api/gallery/${id}/fork`, { method: 'POST' });
    const data = await res.json();
    if (data.ok) {
      setActionMessage('Chain forked to your workspace! Go to Chain Builder to find it.');
      setTimeout(() => setActionMessage(''), 4000);
    } else {
      setActionMessage(data.error || 'Fork failed');
      setTimeout(() => setActionMessage(''), 3000);
    }
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item? This cannot be undone.')) return;
    const res = await fetch(`/api/gallery/${id}/delete`, { method: 'POST' });
    const data = await res.json();
    if (data.ok) {
      setSelectedItem(null);
      setDetailData(null);
      fetchItems();
    } else {
      setActionMessage(data.error || 'Delete failed');
      setTimeout(() => setActionMessage(''), 3000);
    }
  };

  const featured = items.filter(i => i.featured);
  const typeFilters = [
    { key: 'all', label: t('gallery.filter.all') },
    { key: 'chat', label: t('gallery.filter.chat') },
    { key: 'voice', label: t('gallery.filter.voice') },
    { key: 'vision', label: t('gallery.filter.vision') },
    { key: 'chain', label: t('gallery.filter.chain') },
  ];

  return (
    <div className="min-h-screen bg-mest-paper flex flex-col">
      <TopBar teamName={teamName} xp={xp} />

      <div className="bg-white border-b border-mest-grey-300/60 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Link href="/studio" className="text-mest-grey-500 hover:text-mest-ink">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-serif text-xl text-mest-ink">{t('gallery.title')}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 py-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex bg-mest-grey-100 rounded-lg p-1 gap-1">
            {typeFilters.map(f => (
              <button
                key={f.key}
                onClick={() => setType(f.key)}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  type === f.key ? 'bg-white text-mest-ink shadow-sm font-medium' : 'text-mest-grey-500 hover:text-mest-ink'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <NativeSelect value={teamFilter} onChange={setTeamFilter} className="w-40">
            <option value="all">{t('gallery.filter.team')}</option>
            {teams.map(team => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </NativeSelect>

          <NativeSelect value={sort} onChange={setSort} className="w-36">
            <option value="newest">{t('gallery.sort.newest')}</option>
            <option value="views">{t('gallery.sort.views')}</option>
            <option value="forks">{t('gallery.sort.forks')}</option>
            <option value="featured">{t('gallery.sort.featured')}</option>
          </NativeSelect>
        </div>

        {/* Featured */}
        {featured.length > 0 && (
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-mest-gold mb-3">
              <Star size={16} /> {t('gallery.featured')}
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {featured.map(item => (
                <GalleryCard key={item.id} item={item} locale={locale} onClick={() => openDetail(item)} featured />
              ))}
            </div>
          </div>
        )}

        {/* Grid */}
        {items.length === 0 ? (
          <div className="bg-mest-paper border-2 border-dashed border-mest-grey-300 rounded-xl p-12 text-center">
            <h3 className="font-serif text-2xl text-mest-grey-500">{t('gallery.empty.title')}</h3>
            <p className="text-sm text-mest-grey-300 mt-2">{t('gallery.empty.subtitle')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(item => (
              <GalleryCard key={item.id} item={item} locale={locale} onClick={() => openDetail(item)} />
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      <Modal
        open={!!selectedItem}
        onClose={() => { setSelectedItem(null); setDetailData(null); }}
        title={selectedItem?.title}
        className="max-w-2xl"
      >
        {detailData && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-mest-grey-500">
              <span className="px-2 py-0.5 bg-mest-blue-light text-mest-blue rounded-full text-xs font-medium">
                {detailData.teamName}
              </span>
              <span>{detailData.type}</span>
              <span>{timeAgo(detailData.createdAt, locale)}</span>
              <span className="flex items-center gap-1"><EyeIcon size={12} /> {detailData.views}</span>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              <DetailContent item={detailData} />
            </div>

            {actionMessage && (
              <p className="text-sm text-mest-blue font-medium bg-mest-blue-light px-3 py-2 rounded-lg">
                {actionMessage}
              </p>
            )}

            <div className="flex gap-2 justify-end">
              {detailData.type === 'chain' && (
                <Button
                  onClick={() => handleFork(detailData.id)}
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                >
                  <GitFork size={14} />
                  {t('gallery.fork')}
                </Button>
              )}
              {detailData.type === 'chat' && (
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(getPlainTextContent(detailData));
                    setActionMessage('Copied!');
                    setTimeout(() => setActionMessage(''), 2000);
                  }}
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                >
                  <Copy size={14} />
                  {t('gallery.detail.copyContent')}
                </Button>
              )}
              {detailData.teamId === teamId && (
                <Button
                  onClick={() => handleDelete(detailData.id)}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-mest-rust hover:bg-mest-rust-light"
                >
                  <Trash2 size={14} />
                  {t('common.delete')}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function GalleryCard({ item, locale, onClick, featured }: {
  item: GalleryItem;
  locale: string;
  onClick: () => void;
  featured?: boolean;
}) {
  const Icon = TYPE_ICONS[item.type] || MessageSquare;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-mest-grey-300/60 shadow-sm p-5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all ${
        featured ? 'min-w-[250px]' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <Icon size={20} className="text-mest-grey-500" />
        {item.featured && <Star size={14} className="text-mest-gold fill-mest-gold" />}
      </div>
      <h3 className="font-serif text-lg text-mest-ink line-clamp-2">{item.title}</h3>
      <div className="flex items-center gap-2 mt-3 text-xs text-mest-grey-500">
        <span className="px-2 py-0.5 bg-mest-blue-light text-mest-blue rounded-full font-medium">
          {item.teamName}
        </span>
        <span>{timeAgo(item.createdAt, locale)}</span>
      </div>
      <div className="flex items-center gap-3 mt-2 text-xs text-mest-grey-300">
        <span className="flex items-center gap-1"><EyeIcon size={10} /> {item.views}</span>
        {item.forks > 0 && <span className="flex items-center gap-1"><GitFork size={10} /> {item.forks}</span>}
      </div>
    </div>
  );
}

const BLOCK_TYPE_INFO: Record<string, { label: string; color: string; emoji: string }> = {
  'input-text': { label: 'Text Input', color: 'bg-blue-50 border-blue-200 text-blue-800', emoji: '📝' },
  'input-image': { label: 'Image Upload', color: 'bg-amber-50 border-amber-200 text-amber-800', emoji: '📸' },
  'input-audio': { label: 'Audio Input', color: 'bg-violet-50 border-violet-200 text-violet-800', emoji: '🎤' },
  'process-chat-gpt': { label: 'Ask GPT-4o', color: 'bg-green-50 border-green-200 text-green-800', emoji: '🤖' },
  'process-chat-claude': { label: 'Ask Claude', color: 'bg-purple-50 border-purple-200 text-purple-800', emoji: '🧠' },
  'process-transcribe': { label: 'Transcribe Audio', color: 'bg-sky-50 border-sky-200 text-sky-800', emoji: '🎧' },
  'process-tts': { label: 'Generate Speech', color: 'bg-pink-50 border-pink-200 text-pink-800', emoji: '🔊' },
  'process-vision-gpt': { label: 'Vision (GPT)', color: 'bg-emerald-50 border-emerald-200 text-emerald-800', emoji: '👁️' },
  'process-vision-claude': { label: 'Vision (Claude)', color: 'bg-indigo-50 border-indigo-200 text-indigo-800', emoji: '👁️' },
  'process-translate': { label: 'Translate', color: 'bg-cyan-50 border-cyan-200 text-cyan-800', emoji: '🌍' },
  'process-extract-json': { label: 'Extract as JSON', color: 'bg-orange-50 border-orange-200 text-orange-800', emoji: '{ }' },
  'process-summarize': { label: 'Summarize', color: 'bg-teal-50 border-teal-200 text-teal-800', emoji: '✂️' },
  'output-text': { label: 'Display Text', color: 'bg-slate-50 border-slate-200 text-slate-800', emoji: '📄' },
  'output-audio': { label: 'Play Audio', color: 'bg-rose-50 border-rose-200 text-rose-800', emoji: '🎵' },
  'output-image': { label: 'Display Image', color: 'bg-lime-50 border-lime-200 text-lime-800', emoji: '🖼️' },
};

function DetailContent({ item }: { item: GalleryItem }) {
  const data = item.data as Record<string, unknown>;

  if (item.type === 'chain') {
    return <ChainDetailView data={data} />;
  }

  if (item.type === 'chat') {
    return <ChatDetailView data={data} />;
  }

  if (item.type === 'voice') {
    return <VoiceDetailView data={data} />;
  }

  if (item.type === 'vision') {
    return <VisionDetailView data={data} />;
  }

  return <pre className="text-xs text-mest-grey-500">{JSON.stringify(data, null, 2)}</pre>;
}

function ChainDetailView({ data }: { data: Record<string, unknown> }) {
  const blocks = (data.blocks || []) as Array<{ id: string; type: string; config: Record<string, unknown> }>;
  const blockOutputs = (data.blockOutputs || {}) as Record<string, { status?: string; output?: unknown; error?: string }>;

  return (
    <div className="space-y-3">
      {/* Pipeline visualization */}
      <div className="bg-gradient-to-br from-mest-blue-light to-mest-teal-light rounded-xl p-5">
        <h4 className="text-xs uppercase tracking-wider text-mest-blue font-semibold mb-4">Pipeline Flow</h4>
        <div className="space-y-2">
          {blocks.map((block, i) => {
            const info = BLOCK_TYPE_INFO[block.type] || { label: block.type, color: 'bg-gray-50 border-gray-200 text-gray-800', emoji: '⚙️' };
            const desc = block.config._desc as string || '';
            const prompt = (block.config.prompt || block.config.value || '') as string;
            const hasPrompt = prompt && prompt.length > 0;
            const blockResult = blockOutputs[block.id];
            const output = blockResult?.output;
            const hasOutput = output !== undefined && output !== null && output !== '';

            return (
              <div key={block.id || i}>
                <div className={`border rounded-lg p-3 ${info.color}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{info.emoji}</span>
                    <span className="font-semibold text-sm">Step {i + 1}: {info.label}</span>
                    {!!block.config.targetLanguage && (
                      <span className="text-xs bg-white/60 px-2 py-0.5 rounded-full">→ {String(block.config.targetLanguage)}</span>
                    )}
                    {!!block.config.voice && (
                      <span className="text-xs bg-white/60 px-2 py-0.5 rounded-full">voice: {String(block.config.voice)}</span>
                    )}
                    {!!block.config.maxWords && (
                      <span className="text-xs bg-white/60 px-2 py-0.5 rounded-full">{String(block.config.maxWords)} words</span>
                    )}
                    {blockResult?.status && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${blockResult.status === 'done' ? 'bg-green-200 text-green-800' : blockResult.status === 'error' ? 'bg-red-200 text-red-800' : 'bg-gray-200'}`}>
                        {blockResult.status === 'done' ? '✓' : blockResult.status === 'error' ? '✗' : blockResult.status}
                      </span>
                    )}
                  </div>
                  {desc && (
                    <p className="text-xs mt-1 opacity-75 italic">{desc}</p>
                  )}
                  {hasPrompt && (
                    <div className="mt-2 bg-white/50 rounded p-2 text-xs font-mono whitespace-pre-wrap max-h-24 overflow-y-auto">
                      {prompt.length > 200 ? prompt.slice(0, 200) + '...' : prompt}
                    </div>
                  )}
                  {/* Block output */}
                  {hasOutput && (
                    <div className="mt-2 bg-white rounded-lg p-3 border border-white/80">
                      <span className="text-xs font-semibold text-mest-ink opacity-60 block mb-1">Output:</span>
                      {typeof output === 'string' && output.startsWith('data:audio/') ? (
                        <audio controls src={output} className="w-full h-8" />
                      ) : typeof output === 'string' && output.startsWith('data:image/') ? (
                        <img src={output} alt="Output" className="max-h-32 rounded" />
                      ) : typeof output === 'string' ? (
                        <p className="text-xs text-mest-grey-700 whitespace-pre-wrap max-h-32 overflow-y-auto">{output}</p>
                      ) : (
                        <pre className="text-xs text-mest-grey-500 max-h-32 overflow-y-auto">{JSON.stringify(output, null, 2)}</pre>
                      )}
                    </div>
                  )}
                  {blockResult?.error && (
                    <div className="mt-2 bg-red-50 rounded p-2 text-xs text-red-700">{blockResult.error}</div>
                  )}
                </div>
                {i < blocks.length - 1 && (
                  <div className="flex justify-center py-1">
                    <div className="w-0.5 h-4 bg-mest-blue/30 rounded-full" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary stats */}
      <div className="flex gap-3 text-xs text-mest-grey-500">
        <span className="bg-mest-grey-100 px-2 py-1 rounded">{blocks.length} blocks</span>
        <span className="bg-mest-grey-100 px-2 py-1 rounded">
          {blocks.filter(b => b.type.startsWith('process-')).length} AI steps
        </span>
        {blocks.some(b => b.type.includes('gpt')) && <span className="bg-green-50 text-green-700 px-2 py-1 rounded">GPT-4o</span>}
        {blocks.some(b => b.type.includes('claude')) && <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded">Claude</span>}
        {blocks.some(b => b.type === 'process-tts') && <span className="bg-pink-50 text-pink-700 px-2 py-1 rounded">TTS</span>}
        {blocks.some(b => b.type === 'process-transcribe') && <span className="bg-sky-50 text-sky-700 px-2 py-1 rounded">Whisper</span>}
      </div>
    </div>
  );
}

function ChatDetailView({ data }: { data: Record<string, unknown> }) {
  const messages = (data.messages || data.gptMessages || []) as Array<{ role: string; content: string }>;
  const model = data.model as string || 'gpt-4o';
  const systemPrompt = data.systemPrompt as string;

  return (
    <div className="space-y-3">
      {systemPrompt && (
        <div className="bg-mest-gold-light border border-mest-gold/30 rounded-lg p-3">
          <span className="text-xs font-semibold text-mest-gold">System Prompt</span>
          <p className="text-sm text-mest-grey-700 mt-1">{systemPrompt}</p>
        </div>
      )}
      <div className="text-xs text-mest-grey-500 mb-2">Model: {model === 'both' ? 'Compare Mode (GPT-4o + Claude)' : model === 'gpt-4o' ? 'GPT-4o' : 'Claude Sonnet'}</div>
      {messages.map((msg, i) => (
        <div key={i} className={`rounded-lg p-3 ${msg.role === 'user' ? 'bg-mest-blue text-white ml-8' : 'bg-white border border-mest-grey-300/60 mr-8'}`}>
          <span className="text-xs font-semibold opacity-70">{msg.role === 'user' ? 'You' : '🤖 AI'}</span>
          <p className="text-sm mt-1 whitespace-pre-wrap">{msg.content}</p>
        </div>
      ))}
    </div>
  );
}

function VoiceDetailView({ data }: { data: Record<string, unknown> }) {
  const transcription = data.transcription as string;
  const detectedLang = data.detectedLang as string;
  const aiResponse = data.aiResponse;
  const model = data.model as string || 'gpt-4o';

  return (
    <div className="space-y-3">
      <div className="bg-mest-teal-light border border-mest-teal/30 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🎤</span>
          <span className="text-xs font-semibold text-mest-teal">Transcription</span>
          {detectedLang && <span className="text-xs bg-white/60 px-2 py-0.5 rounded-full">{detectedLang}</span>}
        </div>
        <p className="text-sm text-mest-grey-700">{transcription || 'No transcription'}</p>
      </div>
      <div className="bg-white border border-mest-grey-300/60 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🤖</span>
          <span className="text-xs font-semibold text-mest-ink">{model === 'gpt-4o' ? 'GPT-4o' : model === 'claude-sonnet' ? 'Claude' : 'AI'} Response</span>
        </div>
        {typeof aiResponse === 'string' ? (
          <p className="text-sm text-mest-grey-700 whitespace-pre-wrap">{aiResponse}</p>
        ) : aiResponse && typeof aiResponse === 'object' ? (
          <div className="space-y-2">
            {(aiResponse as Record<string, string>).gpt && (
              <div className="bg-green-50 rounded p-2">
                <span className="text-xs font-semibold text-green-700">GPT-4o</span>
                <p className="text-sm mt-1">{(aiResponse as Record<string, string>).gpt}</p>
              </div>
            )}
            {(aiResponse as Record<string, string>).claude && (
              <div className="bg-purple-50 rounded p-2">
                <span className="text-xs font-semibold text-purple-700">Claude</span>
                <p className="text-sm mt-1">{(aiResponse as Record<string, string>).claude}</p>
              </div>
            )}
          </div>
        ) : <p className="text-sm text-mest-grey-500">No response</p>}
      </div>
    </div>
  );
}

function VisionDetailView({ data }: { data: Record<string, unknown> }) {
  const prompt = data.prompt as string;
  const response = data.response;
  const imageCount = data.imageCount as number;

  return (
    <div className="space-y-3">
      {imageCount && (
        <div className="text-xs text-mest-grey-500">{imageCount} image{imageCount > 1 ? 's' : ''} analyzed</div>
      )}
      <div className="bg-mest-gold-light border border-mest-gold/30 rounded-lg p-3">
        <span className="text-xs font-semibold text-mest-gold">Prompt</span>
        <p className="text-sm text-mest-grey-700 mt-1">{prompt}</p>
      </div>
      {typeof response === 'string' ? (
        <div className="bg-white border border-mest-grey-300/60 rounded-lg p-4">
          <p className="text-sm text-mest-grey-700 whitespace-pre-wrap">{response}</p>
        </div>
      ) : response && typeof response === 'object' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(response as Record<string, string>).gpt && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <span className="text-xs font-semibold text-green-700">GPT-4o Vision</span>
              <p className="text-sm mt-2 whitespace-pre-wrap">{(response as Record<string, string>).gpt}</p>
            </div>
          )}
          {(response as Record<string, string>).claude && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <span className="text-xs font-semibold text-purple-700">Claude Vision</span>
              <p className="text-sm mt-2 whitespace-pre-wrap">{(response as Record<string, string>).claude}</p>
            </div>
          )}
        </div>
      ) : <p className="text-sm text-mest-grey-500">No response</p>}
    </div>
  );
}

function getPlainTextContent(item: GalleryItem): string {
  const data = item.data as Record<string, unknown>;

  if (item.type === 'chat') {
    const messages = (data.messages || data.gptMessages || []) as Array<{ role: string; content: string }>;
    return messages.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n\n');
  }
  if (item.type === 'voice') {
    return `Transcription: ${data.transcription || ''}\n\nAI Response: ${typeof data.aiResponse === 'string' ? data.aiResponse : JSON.stringify(data.aiResponse)}`;
  }
  if (item.type === 'vision') {
    return `Prompt: ${data.prompt || ''}\n\nResponse: ${typeof data.response === 'string' ? data.response : JSON.stringify(data.response)}`;
  }
  if (item.type === 'chain') {
    const blocks = (data.blocks || []) as Array<{ type: string; config: Record<string, unknown> }>;
    return blocks.map((b, i) => {
      const info = BLOCK_TYPE_INFO[b.type];
      const label = info?.label || b.type;
      const desc = b.config._desc || '';
      return `Step ${i + 1}: ${label}${desc ? ` — ${desc}` : ''}`;
    }).join('\n');
  }
  return JSON.stringify(data, null, 2);
}
