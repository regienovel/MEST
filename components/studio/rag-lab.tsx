'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useI18n } from '@/lib/i18n-context';
import { TopBar } from './top-bar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';
import { ArrowLeft, Upload, Trash2, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface RagLabProps {
  teamId: string;
  teamName: string;
  xp: number;
}

interface DocInfo {
  id: string;
  name: string;
  charCount: number;
  chunkCount: number;
  embedded: boolean;
}

interface StageData {
  stage: string;
  status: string;
  elapsed_ms?: number;
  payload?: Record<string, unknown>;
  token?: string;
  error?: string;
}

interface ChunkPoint {
  id: string;
  text: string;
  documentName: string;
  x: number;
  y: number;
}

interface RetrievedChunk {
  id: string;
  text: string;
  documentName: string;
  similarity: number;
  originalRank?: number;
  newRank?: number;
}

type TabId = 'documents' | 'pipeline' | 'strict';

export function RagLab({ teamId, teamName, xp }: RagLabProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabId>('documents');

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: 'documents', label: t('rag.tab.documents') },
    { id: 'pipeline', label: t('rag.tab.pipeline') },
    { id: 'strict', label: t('rag.tab.strict') },
  ];

  return (
    <div className="min-h-screen bg-mest-paper flex flex-col">
      <TopBar teamName={teamName} xp={xp} />

      <div className="bg-white border-b border-mest-grey-300/60 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link href="/studio" className="text-mest-grey-500 hover:text-mest-ink">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="font-serif text-xl text-mest-ink">{t('rag.title')}</h1>
          </div>
          <div className="flex bg-mest-grey-100 rounded-lg p-1 gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id ? 'bg-white text-mest-ink shadow-sm' : 'text-mest-grey-500 hover:text-mest-ink'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {activeTab === 'documents' && <DocumentsTab teamId={teamId} />}
        {activeTab === 'pipeline' && <PipelineTab teamId={teamId} />}
        {activeTab === 'strict' && <StrictModeTab teamId={teamId} />}
      </div>
    </div>
  );
}

// ============ DOCUMENTS TAB ============

function DocumentsTab({ teamId }: { teamId: string }) {
  const { t } = useI18n();
  const [docs, setDocs] = useState<DocInfo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [strategy, setStrategy] = useState('paragraph');
  const [chunkSize, setChunkSize] = useState('500');
  const [overlap, setOverlap] = useState('50');
  const [embeddingDocId, setEmbeddingDocId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchDocs = useCallback(() => {
    fetch('/api/rag/visualize', { method: 'POST' }).catch(() => {});
    // Get docs from a simple list endpoint — we'll derive from the visualize data
    // Actually, let's add a docs list. For now, track locally after upload
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('strategy', strategy);
    formData.append('chunkSize', chunkSize);
    formData.append('overlap', overlap);

    try {
      const res = await fetch('/api/rag/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.ok) {
        setDocs(prev => [...prev, { ...data.document, embedded: false }]);
      }
    } catch {}
    setUploading(false);
  };

  const handleEmbed = async (docId: string) => {
    setEmbeddingDocId(docId);
    try {
      const res = await fetch('/api/rag/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: docId }),
      });
      const data = await res.json();
      if (data.ok) {
        setDocs(prev => prev.map(d => d.id === docId ? { ...d, embedded: true } : d));
      }
    } catch {}
    setEmbeddingDocId(null);
  };

  return (
    <div className="space-y-6">
      {/* Upload area */}
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-mest-grey-300 rounded-xl p-8 text-center cursor-pointer hover:border-mest-blue/40 transition-colors"
      >
        <input
          type="file"
          ref={fileRef}
          onChange={handleUpload}
          accept=".txt,.md,.pdf"
          className="hidden"
        />
        <Upload size={32} className="mx-auto text-mest-grey-300 mb-3" />
        <p className="text-mest-grey-500">{t('rag.upload.drop')}</p>
        {uploading && <p className="text-sm text-mest-blue mt-2 animate-pulse">{t('rag.processing')}</p>}
      </div>

      {/* Chunking strategy */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-sm font-medium text-mest-ink block mb-1">{t('rag.strategy')}</label>
          <NativeSelect value={strategy} onChange={setStrategy} className="w-40">
            <option value="paragraph">{t('rag.strategy.paragraph')}</option>
            <option value="fixed">{t('rag.strategy.fixed')}</option>
            <option value="semantic">{t('rag.strategy.semantic')}</option>
          </NativeSelect>
        </div>
        {strategy === 'fixed' && (
          <>
            <div>
              <label className="text-sm font-medium text-mest-ink block mb-1">Chunk size</label>
              <Input value={chunkSize} onChange={e => setChunkSize(e.target.value)} className="w-24" type="number" />
            </div>
            <div>
              <label className="text-sm font-medium text-mest-ink block mb-1">Overlap</label>
              <Input value={overlap} onChange={e => setOverlap(e.target.value)} className="w-24" type="number" />
            </div>
          </>
        )}
      </div>

      {/* Document list */}
      {docs.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-mest-ink">{t('rag.tab.documents')}</h3>
          {docs.map(doc => (
            <div key={doc.id} className="flex items-center gap-3 bg-white rounded-lg border border-mest-grey-300/60 px-4 py-3">
              <FileText size={18} className="text-mest-grey-500" />
              <div className="flex-1">
                <span className="text-sm font-medium text-mest-ink">{doc.name}</span>
                <span className="text-xs text-mest-grey-500 ml-2">{doc.charCount} {t('rag.chars')} · {doc.chunkCount} {t('rag.chunks')}</span>
              </div>
              {doc.embedded ? (
                <span className="text-xs bg-mest-sage-light text-mest-sage px-2 py-0.5 rounded-full">{t('rag.embedded')}</span>
              ) : (
                <Button
                  size="sm"
                  onClick={() => handleEmbed(doc.id)}
                  disabled={embeddingDocId === doc.id}
                  className="bg-mest-blue hover:bg-mest-blue/90 text-white gap-1.5"
                >
                  {embeddingDocId === doc.id ? <><Loader2 size={12} className="animate-spin" /> {t('rag.embedding')}</> : t('rag.embed')}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {docs.length === 0 && !uploading && (
        <div className="text-center text-mest-grey-500 py-12 font-serif italic text-lg">
          {t('rag.noDocuments')}
        </div>
      )}
    </div>
  );
}

// ============ PIPELINE VISUALIZER TAB ============

const STAGES = ['query', 'embed_query', 'retrieve', 'rerank', 'generate'] as const;

const STAGE_LABELS: Record<string, { en: string; fr: string; emoji: string }> = {
  query: { en: 'Query', fr: 'Requête', emoji: '💬' },
  embed_query: { en: 'Embed Query', fr: 'Vectoriser', emoji: '🔢' },
  retrieve: { en: 'Search Vectors', fr: 'Recherche', emoji: '🔍' },
  rerank: { en: 'Rerank', fr: 'Reclasser', emoji: '📊' },
  generate: { en: 'Generate', fr: 'Générer', emoji: '✨' },
};

function PipelineTab({ teamId }: { teamId: string }) {
  const { t, locale } = useI18n();
  const [query, setQuery] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [stageStatuses, setStageStatuses] = useState<Record<string, StageData>>({});
  const [retrievedChunks, setRetrievedChunks] = useState<RetrievedChunk[]>([]);
  const [rerankedChunks, setRerankedChunks] = useState<RetrievedChunk[]>([]);
  const [generatedText, setGeneratedText] = useState('');
  const [chunkPoints, setChunkPoints] = useState<ChunkPoint[]>([]);
  const [queryPoint, setQueryPoint] = useState<{ x: number; y: number } | null>(null);

  const runPipeline = async () => {
    if (!query.trim()) return;
    setIsRunning(true);
    setStageStatuses({});
    setRetrievedChunks([]);
    setRerankedChunks([]);
    setGeneratedText('');
    setQueryPoint(null);

    // Load chunk positions for visualization
    fetch('/api/rag/visualize', { method: 'POST' })
      .then(r => r.json())
      .then(d => setChunkPoints(d.chunks || []))
      .catch(() => {});

    try {
      const res = await fetch('/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, strict: false }),
      });

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = '';
      let generated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6)) as StageData & { done?: boolean };

            if (data.done) continue;
            if (data.error) continue;

            if (data.stage === 'generate' && data.token) {
              generated += data.token;
              setGeneratedText(generated);
              continue;
            }

            setStageStatuses(prev => ({ ...prev, [data.stage]: data }));

            if (data.stage === 'retrieve' && data.status === 'done' && data.payload?.results) {
              setRetrievedChunks(data.payload.results as RetrievedChunk[]);
            }
            if (data.stage === 'rerank' && data.status === 'done' && data.payload?.results) {
              setRerankedChunks(data.payload.results as RetrievedChunk[]);
            }
          } catch {}
        }
      }
    } catch {}
    setIsRunning(false);
  };

  return (
    <div className="space-y-6">
      {/* Query input */}
      <div className="flex gap-3">
        <Textarea
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('rag.query.placeholder')}
          rows={2}
          className="flex-1 resize-none"
        />
        <Button
          onClick={runPipeline}
          disabled={isRunning || !query.trim()}
          className="bg-mest-gold hover:bg-mest-gold/90 text-white gap-1.5 px-6 self-end"
        >
          {isRunning ? t('rag.query.running') : t('rag.query.run')}
        </Button>
      </div>

      {/* Pipeline stages */}
      <div className="bg-[#0F2F44] rounded-2xl p-6 overflow-x-auto">
        <div className="flex items-center gap-3 min-w-[700px]">
          {STAGES.map((stage, i) => {
            const stageData = stageStatuses[stage];
            const status = stageData?.status || 'idle';
            const label = STAGE_LABELS[stage];
            const isActive = status === 'running' || status === 'streaming';
            const isDone = status === 'done';

            return (
              <div key={stage} className="flex items-center gap-3 flex-1">
                <motion.div
                  className={`flex-1 rounded-xl p-4 border-2 transition-colors ${
                    isActive ? 'bg-white border-[#B8860B] shadow-lg shadow-[#B8860B]/20' :
                    isDone ? 'bg-white border-[#0E6B5C]' :
                    'bg-white/10 border-white/20'
                  }`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="text-center">
                    <span className="text-xl">{label.emoji}</span>
                    <p className={`text-xs font-semibold mt-1 ${isDone || isActive ? 'text-mest-ink' : 'text-white/60'}`}>
                      {locale === 'fr' ? label.fr : label.en}
                    </p>
                    {isActive && (
                      <motion.div
                        className="w-2 h-2 bg-[#B8860B] rounded-full mx-auto mt-2"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                      />
                    )}
                    {isDone && stageData?.elapsed_ms !== undefined && (
                      <p className="text-xs text-[#0E6B5C] mt-1">{stageData.elapsed_ms}ms</p>
                    )}
                    {isDone && <span className="text-xs text-[#0E6B5C]">✓</span>}
                  </div>
                </motion.div>
                {i < STAGES.length - 1 && (
                  <motion.div
                    className={`w-6 h-0.5 rounded ${isDone ? 'bg-[#B8860B]' : 'bg-white/20'}`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: isDone ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Vector space visualization */}
      {chunkPoints.length > 0 && (
        <div className="bg-[#0F2F44] rounded-2xl p-6">
          <h3 className="text-white/80 text-sm font-semibold mb-4">Vector Space</h3>
          <svg viewBox="0 0 400 300" className="w-full max-w-lg mx-auto">
            {/* Chunk dots */}
            {chunkPoints.map((chunk, i) => {
              const cx = 20 + chunk.x * 360;
              const cy = 20 + chunk.y * 260;
              const isRetrieved = retrievedChunks.some(r => r.id === chunk.id);

              return (
                <motion.circle
                  key={chunk.id}
                  cx={cx}
                  cy={cy}
                  r={isRetrieved ? 6 : 3}
                  fill={isRetrieved ? '#B8860B' : '#ffffff40'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, r: isRetrieved ? 6 : 3 }}
                  transition={{ delay: i * 0.02 }}
                >
                  <title>{chunk.documentName}: {chunk.text}</title>
                </motion.circle>
              );
            })}
            {/* Query dot */}
            {stageStatuses['embed_query']?.status === 'done' && (
              <motion.circle
                cx={200}
                cy={150}
                r={8}
                fill="#B8860B"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                filter="url(#glow)"
              />
            )}
            {/* Lines to retrieved chunks */}
            {retrievedChunks.map(rc => {
              const chunk = chunkPoints.find(c => c.id === rc.id);
              if (!chunk) return null;
              const cx = 20 + chunk.x * 360;
              const cy = 20 + chunk.y * 260;
              return (
                <motion.line
                  key={rc.id}
                  x1={200} y1={150}
                  x2={cx} y2={cy}
                  stroke="#B8860B"
                  strokeWidth={1.5}
                  strokeOpacity={0.6}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5 }}
                />
              );
            })}
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
          </svg>
        </div>
      )}

      {/* Retrieved / Reranked chunks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top-K Results */}
        {retrievedChunks.length > 0 && (
          <div className="bg-white rounded-xl border border-mest-grey-300/60 p-4">
            <h3 className="text-sm font-semibold text-mest-ink mb-3">Top-K Retrieved</h3>
            <AnimatePresence>
              {retrievedChunks.map((chunk, i) => (
                <motion.div
                  key={chunk.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-2 mb-2 p-2 rounded-lg bg-mest-grey-50"
                >
                  <span className="text-xs font-bold text-mest-blue w-5 shrink-0">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-mest-grey-700 line-clamp-2">{chunk.text}</p>
                    <div className="flex gap-2 mt-1 text-xs text-mest-grey-500">
                      <span>{chunk.documentName}</span>
                      <span className="text-mest-gold font-semibold">{Math.round(chunk.similarity * 100)}%</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Reranked Results */}
        {rerankedChunks.length > 0 && (
          <div className="bg-white rounded-xl border border-mest-grey-300/60 p-4">
            <h3 className="text-sm font-semibold text-mest-ink mb-3">After Reranking (Claude)</h3>
            <AnimatePresence>
              {rerankedChunks.map((chunk, i) => {
                const moved = chunk.originalRank !== undefined && chunk.newRank !== undefined
                  ? chunk.originalRank - chunk.newRank : 0;
                return (
                  <motion.div
                    key={chunk.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08, layout: { duration: 0.6 } }}
                    className="flex items-start gap-2 mb-2 p-2 rounded-lg bg-mest-grey-50"
                  >
                    <span className="text-xs font-bold text-purple-700 w-5 shrink-0">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-mest-grey-700 line-clamp-2">{chunk.text}</p>
                      <div className="flex gap-2 mt-1 text-xs text-mest-grey-500">
                        <span>{chunk.documentName}</span>
                        {moved > 0 && <span className="text-green-600">↑{moved}</span>}
                        {moved < 0 && <span className="text-red-500">↓{Math.abs(moved)}</span>}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Generated response */}
      {generatedText && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border-2 border-mest-gold/30 p-6"
        >
          <h3 className="text-sm font-semibold text-mest-ink mb-3">✨ Generated Response (with citations)</h3>
          <div className="text-sm text-mest-grey-700 whitespace-pre-wrap leading-relaxed">
            {generatedText.split(/(\[\d+\])/).map((part, i) => {
              if (/^\[\d+\]$/.test(part)) {
                return (
                  <span key={i} className="inline-flex items-center justify-center bg-mest-gold text-white text-xs rounded-full w-5 h-5 mx-0.5 font-bold cursor-pointer hover:bg-mest-gold/80">
                    {part.slice(1, -1)}
                  </span>
                );
              }
              return <span key={i}>{part}</span>;
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ============ STRICT MODE TAB ============

function StrictModeTab({ teamId }: { teamId: string }) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [strictResult, setStrictResult] = useState('');
  const [normalResult, setNormalResult] = useState('');

  const runComparison = async () => {
    if (!query.trim()) return;
    setIsRunning(true);
    setStrictResult('');
    setNormalResult('');

    // Run both in parallel
    const [strictRes, normalRes] = await Promise.all([
      runQuery(query, true),
      runQuery(query, false),
    ]);

    setStrictResult(strictRes);
    setNormalResult(normalRes);
    setIsRunning(false);
  };

  async function runQuery(q: string, strict: boolean): Promise<string> {
    try {
      const res = await fetch('/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, strict }),
      });

      const reader = res.body?.getReader();
      if (!reader) return 'Error';

      const decoder = new TextDecoder();
      let buffer = '';
      let result = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.token) result += data.token;
            if (data.stage === 'generate' && data.status === 'done' && data.payload?.response) {
              result = data.payload.response as string;
            }
          } catch {}
        }
      }
      return result || 'No response';
    } catch {
      return 'Error running query';
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-mest-grey-300/60 p-6">
        <h3 className="font-serif text-lg text-mest-ink mb-4">{t('rag.tab.strict')}</h3>
        <p className="text-sm text-mest-grey-500 mb-4">
          Compare how RAG responds with strict mode ON vs OFF. With strict mode, the system refuses to answer if no source documents are relevant enough (similarity &lt; 70%).
        </p>
        <div className="flex gap-3">
          <Textarea
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('rag.query.placeholder')}
            rows={2}
            className="flex-1 resize-none"
          />
          <Button
            onClick={runComparison}
            disabled={isRunning || !query.trim()}
            className="bg-mest-blue hover:bg-mest-blue/90 text-white gap-1.5 px-6 self-end"
          >
            {isRunning ? t('rag.query.running') : t('rag.strict.compare')}
          </Button>
        </div>
      </div>

      {(strictResult || normalResult || isRunning) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl border-2 border-mest-sage p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">✓</span>
              <h4 className="text-sm font-semibold text-mest-sage">{t('rag.strict.on')}</h4>
            </div>
            {isRunning && !strictResult ? (
              <p className="text-sm text-mest-grey-500 animate-pulse">{t('rag.query.running')}</p>
            ) : (
              <p className="text-sm text-mest-grey-700 whitespace-pre-wrap">{strictResult}</p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl border-2 border-mest-rust p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">✗</span>
              <h4 className="text-sm font-semibold text-mest-rust">{t('rag.strict.off')}</h4>
            </div>
            {isRunning && !normalResult ? (
              <p className="text-sm text-mest-grey-500 animate-pulse">{t('rag.query.running')}</p>
            ) : (
              <p className="text-sm text-mest-grey-700 whitespace-pre-wrap">{normalResult}</p>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
