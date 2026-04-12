'use client';
import { useI18n } from '@/lib/i18n-context';
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
  locale?: string;
}

const STAGES = ['query', 'embed_query', 'retrieve', 'rerank', 'generate'] as const;

const STAGE_META: Record<string, { emoji: string }> = {
  query: { emoji: '💬' },
  embed_query: { emoji: '🔢' },
  retrieve: { emoji: '🔍' },
  rerank: { emoji: '📊' },
  generate: { emoji: '✨' },
};

export function PipelineStages({ stageStatuses, query }: PipelineStagesProps) {
  const { t } = useI18n();

  const STAGE_TITLES: Record<string, string> = {
    query: t('rag.stage.query'),
    embed_query: t('rag.stage.embed'),
    retrieve: t('rag.stage.retrieve'),
    rerank: t('rag.stage.rerank'),
    generate: t('rag.stage.generate'),
  };

  const STAGE_SUBTITLES: Record<string, string> = {
    query: t('pipeline.query.active'),
    embed_query: t('pipeline.embed.active'),
    retrieve: t('pipeline.retrieve.active'),
    rerank: t('pipeline.rerank.active'),
    generate: t('pipeline.generate.active'),
  };

  const getActiveDetail = (stage: string) => {
    const map: Record<string, string> = {
      query: t('pipeline.query.active'),
      embed_query: t('pipeline.embed.active'),
      retrieve: t('pipeline.retrieve.active'),
      rerank: t('pipeline.rerank.active'),
      generate: t('pipeline.generate.active'),
    };
    return map[stage] || '';
  };

  const getDoneDetail = (stage: string, data?: StageData) => {
    if (stage === 'query') return t('pipeline.query.done');
    if (stage === 'embed_query') return t('pipeline.embed.done').replace('{n}', String(data?.payload?.dimensions || 1536));
    if (stage === 'retrieve') {
      const results = data?.payload?.results as Array<{ similarity: number }> | undefined;
      if (!results) return t('pipeline.retrieve.done');
      const top = Math.round((results[0]?.similarity || 0) * 100);
      return t('pipeline.retrieve.doneDetail').replace('{pct}', String(top)).replace('{n}', String(results.length));
    }
    if (stage === 'rerank') {
      if (data?.payload?.skipped) return t('pipeline.rerank.skipped');
      return t('pipeline.rerank.done');
    }
    if (stage === 'generate') return t('pipeline.generate.done');
    return '';
  };

  return (
    <div className="bg-gradient-to-br from-[#0F2F44] to-[#0a1f2e] rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-semibold">{t('pipeline.title')}</span>
          <span className="text-white/40 text-xs">5 {t('pipeline.stages')}</span>
        </div>
        {query && (
          <span className="text-white/50 text-xs max-w-[300px] truncate">
            {t('pipeline.queryLabel')}: &ldquo;{query}&rdquo;
          </span>
        )}
      </div>

      {/* Stages */}
      <div className="p-4 space-y-1">
        {STAGES.map((stage, i) => {
          const data = stageStatuses[stage];
          const status = data?.status || 'idle';
          const meta = STAGE_META[stage];
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
                    <span className="text-xl">{meta.emoji}</span>
                  </div>

                  {/* Title + subtitle */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${isIdle ? 'text-white/30' : 'text-white'}`}>
                        {STAGE_TITLES[stage]}
                      </span>
                      {isDone && data?.elapsed_ms !== undefined && (
                        <span className="text-mest-sage text-xs font-mono">{data.elapsed_ms}ms</span>
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 ${isIdle ? 'text-white/15' : 'text-white/50'}`}>
                      {STAGE_SUBTITLES[stage]}
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
                        <span className="text-mest-gold text-xs">{getActiveDetail(stage)}</span>
                      </motion.div>
                    )}
                    {isDone && (
                      <motion.span
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-mest-sage text-xs"
                      >
                        {getDoneDetail(stage, data)}
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
