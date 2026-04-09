'use client';
import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n-context';
import { TopBar } from './top-bar';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, MessageSquare, Mic, Eye, Workflow, Star, GitFork, Eye as EyeIcon, Copy } from 'lucide-react';
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

export function Gallery({ teamName, xp, teams }: GalleryProps) {
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

  const handleFork = async (id: string) => {
    await fetch(`/api/gallery/${id}/fork`, { method: 'POST' });
    fetchItems();
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
      <Dialog open={!!selectedItem} onOpenChange={() => { setSelectedItem(null); setDetailData(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">{selectedItem?.title}</DialogTitle>
          </DialogHeader>
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

              <div className="bg-mest-grey-50 rounded-lg p-4 text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                {renderDetailContent(detailData)}
              </div>

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
                      const content = renderDetailContent(detailData);
                      navigator.clipboard.writeText(typeof content === 'string' ? content : '');
                    }}
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                  >
                    <Copy size={14} />
                    {t('gallery.detail.copyContent')}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
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

function renderDetailContent(item: GalleryItem): string {
  const data = item.data as Record<string, unknown>;

  if (item.type === 'chat') {
    const messages = (data.messages || data.gptMessages || []) as Array<{ role: string; content: string }>;
    return messages.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n\n');
  }

  if (item.type === 'voice') {
    const parts: string[] = [];
    if (data.transcription) parts.push(`Transcription: ${data.transcription}`);
    if (data.aiResponse) parts.push(`AI Response: ${data.aiResponse}`);
    return parts.join('\n\n') || 'No content available';
  }

  if (item.type === 'vision') {
    const parts: string[] = [];
    if (data.prompt) parts.push(`Prompt: ${data.prompt}`);
    if (typeof data.response === 'string') parts.push(`Response: ${data.response}`);
    else if (data.response && typeof data.response === 'object') {
      const r = data.response as Record<string, string>;
      if (r.gpt) parts.push(`GPT-4o: ${r.gpt}`);
      if (r.claude) parts.push(`Claude: ${r.claude}`);
    }
    return parts.join('\n\n') || 'No content available';
  }

  if (item.type === 'chain') {
    const blocks = (data.blocks || []) as Array<{ type: string; config: Record<string, unknown> }>;
    return blocks.map((b, i) => `${i + 1}. ${b.type}`).join('\n') || 'No blocks';
  }

  return JSON.stringify(data, null, 2);
}
