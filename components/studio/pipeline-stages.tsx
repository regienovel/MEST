'use client';
import { motion } from 'framer-motion';

interface StageData {
  stage: string;
  status: string;
  elapsed_ms?: number;
  payload?: Record<string, unknown>;
}

interface PipelineStagesProps {
  stageStatuses: Record<string, StageData>;
  query: string;
  locale: string;
}

const STAGES = ['query', 'embed_query', 'retrieve', 'rerank', 'generate'] as const;

const STAGE_INFO: Record<string, {
  emoji: string;
  title: string;
  titleFr: string;
  subtitle: string;
  subtitleFr: string;
  activeDetail: string;
  doneDetail: (data?: StageData) => string;
}> = {
  query: {
    emoji: '💬',
    title: 'Query',
    titleFr: 'Requête',
    subtitle: 'Your question enters the pipeline',
    subtitleFr: 'Votre question entre dans le pipeline',
    activeDetail: 'Preparing your question...',
    doneDetail: () => 'Question received and ready',
  },
  embed_query: {
    emoji: '🔢',
    title: 'Embed Query',
    titleFr: 'Vectoriser',
    subtitle: 'Convert question to a 1536-number vector',
    subtitleFr: 'Convertir la question en vecteur de 1536 nombres',
    activeDetail: 'Calling OpenAI text-embedding-3-small...',
    doneDetail: (d) => `Converted to ${d?.payload?.dimensions || 1536}-dimensional vector`,
  },
  retrieve: {
    emoji: '🔍',
    title: 'Search Vectors',
    titleFr: 'Recherche vectorielle',
    subtitle: 'Find the closest chunks by cosine similarity',
    subtitleFr: 'Trouver les fragments les plus proches par similarité cosinus',
    activeDetail: 'Computing cosine similarity against all chunks...',
    doneDetail: (d) => {
      const results = d?.payload?.results as Array<{ similarity: number }> | undefined;
      if (!results) return 'Top chunks found';
      const top = Math.round((results[0]?.similarity || 0) * 100);
      return `Top match: ${top}% similarity (${results.length} chunks retrieved)`;
    },
  },
  rerank: {
    emoji: '📊',
    title: 'Rerank',
    titleFr: 'Reclasser',
    subtitle: 'Claude re-evaluates chunk relevance',
    subtitleFr: 'Claude réévalue la pertinence des fragments',
    activeDetail: 'Claude Sonnet is reading and reordering chunks...',
    doneDetail: (d) => {
      if (d?.payload?.skipped) return 'Reranking skipped (disabled in config)';
      return 'Chunks reordered by relevance';
    },
  },
  generate: {
    emoji: '✨',
    title: 'Generate',
    titleFr: 'Générer',
    subtitle: 'GPT-4o answers using only the retrieved chunks',
    subtitleFr: 'GPT-4o répond en utilisant uniquement les fragments récupérés',
    activeDetail: 'Generating grounded response with citations...',
    doneDetail: () => 'Response generated with source citations',
  },
};

export function PipelineStages({ stageStatuses, query, locale }: PipelineStagesProps) {
  return (
    <div className="bg-gradient-to-br from-[#0F2F44] to-[#0a1f2e] rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-semibold">RAG Pipeline</span>
          <span className="text-white/40 text-xs">5 stages</span>
        </div>
        {query && (
          <span className="text-white/50 text-xs max-w-[300px] truncate">
            Query: &ldquo;{query}&rdquo;
          </span>
        )}
      </div>

      {/* Stages */}
      <div className="p-4 space-y-1">
        {STAGES.map((stage, i) => {
          const data = stageStatuses[stage];
          const status = data?.status || 'idle';
          const info = STAGE_INFO[stage];
          const isActive = status === 'running' || status === 'streaming';
          const isDone = status === 'done';
          const isIdle = !isActive && !isDone;

          return (
            <div key={stage}>
              <motion.div
                initial={{ opacity: 0.5 }}
                animate={{ opacity: isDone || isActive ? 1 : 0.4 }}
                className={`rounded-xl px-5 py-3.5 border transition-all duration-500 ${
                  isActive ? 'bg-mest-gold/10 border-mest-gold/50 shadow-lg shadow-mest-gold/10' :
                  isDone ? 'bg-white/5 border-mest-sage/30' :
                  'bg-white/[0.02] border-white/5'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Step number + emoji */}
                  <div className="flex items-center gap-2 shrink-0">
                    <motion.span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        isActive ? 'bg-mest-gold text-white' :
                        isDone ? 'bg-mest-sage text-white' :
                        'bg-white/10 text-white/30'
                      }`}
                      animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 0.8 }}
                    >
                      {isDone ? '✓' : i + 1}
                    </motion.span>
                    <span className="text-xl">{info.emoji}</span>
                  </div>

                  {/* Title + subtitle */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${isIdle ? 'text-white/30' : 'text-white'}`}>
                        {locale === 'fr' ? info.titleFr : info.title}
                      </span>
                      {isDone && data?.elapsed_ms !== undefined && (
                        <span className="text-mest-sage text-xs font-mono">{data.elapsed_ms}ms</span>
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 ${isIdle ? 'text-white/15' : 'text-white/50'}`}>
                      {locale === 'fr' ? info.subtitleFr : info.subtitle}
                    </p>
                  </div>

                  {/* Status detail */}
                  <div className="shrink-0 text-right">
                    {isActive && (
                      <motion.div className="flex items-center gap-2">
                        <motion.div
                          className="w-2 h-2 bg-mest-gold rounded-full"
                          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
                          transition={{ repeat: Infinity, duration: 0.6 }}
                        />
                        <span className="text-mest-gold text-xs">{info.activeDetail}</span>
                      </motion.div>
                    )}
                    {isDone && (
                      <motion.span
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-mest-sage text-xs"
                      >
                        {info.doneDetail(data)}
                      </motion.span>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Connector line */}
              {i < STAGES.length - 1 && (
                <div className="flex justify-start ml-8 py-0.5">
                  <motion.div
                    className={`w-0.5 h-4 rounded-full ${isDone ? 'bg-mest-sage/40' : 'bg-white/5'}`}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: isDone ? 1 : 0.3 }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
