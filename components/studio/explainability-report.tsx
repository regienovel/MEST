'use client';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n-context';
import { Button } from '@/components/ui/button';
import { Download, X, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import type { ExplainabilityReport } from '@/lib/rag-explain';

interface ExplainabilityReportPanelProps {
  report: ExplainabilityReport;
  onClose: () => void;
  onExport: () => void;
}

const LAYER_ICONS = ['💬', '🔢', '🔍', '📊', '📜', '✨', '🔗'];
const LAYER_NAMES = ['Query', 'Embedding', 'Retrieval', 'Ranking', 'Instruction', 'Generation', 'Evidence'];

export function ExplainabilityReportPanel({ report, onClose, onExport }: ExplainabilityReportPanelProps) {
  const { t } = useI18n();
  const confidenceColor = report.confidence.level === 'HIGH' ? '#0E6B5C' : report.confidence.level === 'MODERATE' ? '#B8860B' : '#922B21';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0F2F44] rounded-2xl overflow-hidden shadow-2xl"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">🔍</span>
          <div>
            <h3 className="text-white font-semibold text-sm">{t('explain.title')}</h3>
            <p className="text-white/40 text-xs">{new Date(report.timestamp).toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: `${confidenceColor}20`, color: confidenceColor }}>
            {report.confidence.level} {t('explain.confidence.label')}
          </span>
          <Button onClick={onExport} variant="outline" size="sm" className="text-white border-white/20 hover:bg-white/10 gap-1">
            <Download size={12} /> {t('explain.export')}
          </Button>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Query */}
      <div className="px-6 py-3 bg-white/5 border-b border-white/5">
        <p className="text-white/50 text-[10px] uppercase tracking-wider">{t('pipeline.queryLabel')}</p>
        <p className="text-white text-sm font-medium mt-1">&ldquo;{report.query}&rdquo;</p>
      </div>

      {/* 6 Layers */}
      <div className="px-6 py-4 space-y-3">
        {/* Layer 1: Query Understanding */}
        <ReportLayer
          icon="💬"
          title={t('explain.queryUnderstanding')}
          status="done"
          time={report.layers.query.elapsedMs}
        >
          <p className="text-white/70 text-xs">
            {t('explain.queryEmbedded')} <span className="text-[#B8860B] font-semibold">{report.layers.query.embeddingDimensions}-dimensional</span> {t('explain.vectorSearch')}
          </p>
        </ReportLayer>

        {/* Layer 2: Retrieval */}
        <ReportLayer
          icon="🔍"
          title={t('explain.retrievalDecisions')}
          status="done"
          time={report.layers.retrieval.elapsedMs}
        >
          <p className="text-white/70 text-xs mb-2">{report.layers.retrieval.explanation}</p>
          {report.layers.retrieval.topMatch && (
            <div className="bg-white/5 rounded-lg px-3 py-2">
              <p className="text-white/50 text-[10px]">{t('explain.topMatch')} ({report.layers.retrieval.topMatch.similarity}% {t('explain.similarity')}):</p>
              <p className="text-white/80 text-xs mt-0.5">&ldquo;{report.layers.retrieval.topMatch.text}&rdquo;</p>
              <p className="text-[#B8860B] text-[10px] mt-0.5">{t('explain.from')} {report.layers.retrieval.topMatch.document}</p>
            </div>
          )}
        </ReportLayer>

        {/* Layer 3: Ranking */}
        <ReportLayer
          icon="📊"
          title={t('explain.rankingDecisions')}
          status={report.layers.ranking.rerankingEnabled ? 'done' : 'skipped'}
          time={report.layers.ranking.elapsedMs}
        >
          <p className="text-white/70 text-xs mb-2">{report.layers.ranking.explanation}</p>
          {report.layers.ranking.changes.length > 0 && (
            <div className="space-y-1">
              {report.layers.ranking.changes.slice(0, 3).map((change, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className={`text-xs ${change.direction === 'up' ? 'text-[#0E6B5C]' : change.direction === 'down' ? 'text-[#922B21]' : 'text-white/40'}`}>
                    {change.direction === 'up' ? '↑' : change.direction === 'down' ? '↓' : '='} #{change.from}→#{change.to}
                  </span>
                  <span className="text-white/60 truncate">{change.text}</span>
                </div>
              ))}
            </div>
          )}
        </ReportLayer>

        {/* Layer 4: Instruction */}
        <ReportLayer
          icon="📜"
          title={t('explain.generationInstructions')}
          status="done"
        >
          <div className="grid grid-cols-2 gap-2 text-xs mb-2">
            <div className="bg-white/5 rounded px-2 py-1">
              <span className="text-white/40">{t('explain.model')}:</span> <span className="text-white/80">{report.layers.instruction.generationModel}</span>
            </div>
            <div className="bg-white/5 rounded px-2 py-1">
              <span className="text-white/40">{t('explain.temp')}:</span> <span className="text-white/80">{report.layers.instruction.temperature}</span>
            </div>
            <div className="bg-white/5 rounded px-2 py-1">
              <span className="text-white/40">{t('explain.threshold')}:</span> <span className="text-white/80">{Math.round(report.layers.instruction.strictThreshold * 100)}%</span>
            </div>
            <div className="bg-white/5 rounded px-2 py-1">
              <span className="text-white/40">{t('explain.topSim')}:</span>
              <span className={`font-semibold ${report.layers.instruction.thresholdPassed ? 'text-[#0E6B5C]' : 'text-[#922B21]'}`}>
                {' '}{report.layers.instruction.topSimilarity}% {report.layers.instruction.thresholdPassed ? `✓ ${t('explain.passed')}` : `✗ ${t('explain.below')}`}
              </span>
            </div>
          </div>
          <div className="bg-white/5 rounded-lg px-3 py-2">
            <p className="text-white/40 text-[10px]">{t('explain.systemPromptLabel')}:</p>
            <p className="text-white/60 text-[11px] mt-0.5 line-clamp-3 font-mono">{report.layers.instruction.systemPrompt}</p>
          </div>
        </ReportLayer>

        {/* Layer 5: Generation */}
        <ReportLayer
          icon="✨"
          title={t('explain.generatedResponse')}
          status="done"
          time={report.layers.generation.elapsedMs}
        >
          <div className="bg-white/5 rounded-lg px-3 py-2">
            <p className="text-white/80 text-xs leading-relaxed whitespace-pre-wrap">
              {report.layers.generation.response.split(/(\[\d+\])/).map((part, i) =>
                /^\[\d+\]$/.test(part) ? (
                  <span key={i} className="inline-flex items-center justify-center bg-[#B8860B] text-white text-[8px] rounded-full w-4 h-4 mx-0.5 font-bold">{part.slice(1, -1)}</span>
                ) : <span key={i}>{part}</span>
              )}
            </p>
          </div>
          <p className="text-white/40 text-[10px] mt-1">{report.layers.generation.citationCount} {t('explain.citationInResponse')}</p>
        </ReportLayer>

        {/* Layer 6: Evidence */}
        <ReportLayer
          icon="🔗"
          title={t('explain.evidenceChain')}
          status={report.layers.evidence.length > 0 ? 'done' : 'none'}
        >
          {report.layers.evidence.length > 0 ? (
            <div className="space-y-2">
              {report.layers.evidence.map((ev, i) => (
                <div key={i} className={`flex items-start gap-2 rounded-lg px-3 py-2 ${ev.verified ? 'bg-[#0E6B5C]/10 border border-[#0E6B5C]/20' : 'bg-[#922B21]/10 border border-[#922B21]/20'}`}>
                  <span className="inline-flex items-center justify-center bg-[#B8860B] text-white text-[8px] rounded-full w-4 h-4 font-bold shrink-0 mt-0.5">{ev.citationNumber}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/60 text-[10px]">{ev.sourceDocument}</p>
                    <p className="text-white/80 text-xs mt-0.5">&ldquo;{ev.sourceChunk}&rdquo;</p>
                  </div>
                  {ev.verified ? (
                    <CheckCircle size={14} className="text-[#0E6B5C] shrink-0 mt-0.5" />
                  ) : (
                    <XCircle size={14} className="text-[#922B21] shrink-0 mt-0.5" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/40 text-xs italic">{t('explain.noCitations')}</p>
          )}
        </ReportLayer>
      </div>

      {/* Confidence Assessment */}
      <div className="px-6 py-4 bg-white/5 border-t border-white/10">
        <h4 className="text-white/50 text-[10px] uppercase tracking-wider mb-2">{t('explain.confidence')}</h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-xs font-bold" style={{ color: confidenceColor }}>{report.confidence.level}</p>
            <p className="text-white/30 text-[9px]">{t('explain.overall')}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-white/70">{report.confidence.citationCoverage}</p>
            <p className="text-white/30 text-[9px]">{t('explain.citations')}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-white/70">{report.confidence.hallucinationRisk}</p>
            <p className="text-white/30 text-[9px]">{t('explain.hallucinationRisk')}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ReportLayer({
  icon, title, status, time, children
}: {
  icon: string;
  title: string;
  status: 'done' | 'skipped' | 'none';
  time?: number;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`rounded-xl border px-4 py-3 ${
        status === 'done' ? 'border-[#0E6B5C]/30 bg-[#0E6B5C]/5' :
        status === 'skipped' ? 'border-white/10 bg-white/[0.02]' :
        'border-[#922B21]/20 bg-[#922B21]/5'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">{icon}</span>
        <span className="text-white text-xs font-semibold">{title}</span>
        {time !== undefined && <span className="text-white/30 text-[10px] font-mono">{time}ms</span>}
        {status === 'done' && <CheckCircle size={12} className="text-[#0E6B5C] ml-auto" />}
        {status === 'skipped' && <span className="text-white/30 text-[10px] ml-auto">{t('explain.skipped')}</span>}
      </div>
      {children}
    </motion.div>
  );
}
