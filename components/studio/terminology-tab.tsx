'use client';
import { useState } from 'react';
import { useI18n } from '@/lib/i18n-context';
import { TERMINOLOGY, type Term } from '@/lib/rag-terminology';
import { Modal } from '@/components/ui/modal';
import { ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';

// Lazy-load visualization components
const visualizations: Record<string, React.ComponentType<{ onReplay?: () => void }>> = {};
const vizModules: Record<string, () => Promise<{ default: React.ComponentType<{ onReplay?: () => void }> }>> = {
  transformer: () => import('./rag/visualizations/transformer-viz').then(m => ({ default: m.TransformerViz })),
  attention: () => import('./rag/visualizations/attention-viz').then(m => ({ default: m.AttentionViz })),
  token: () => import('./rag/visualizations/token-viz').then(m => ({ default: m.TokenViz })),
  hallucination: () => import('./rag/visualizations/hallucination-viz').then(m => ({ default: m.HallucinationViz })),
  chunking: () => import('./rag/visualizations/chunking-viz').then(m => ({ default: m.ChunkingViz })),
  embedding: () => import('./rag/visualizations/embedding-viz').then(m => ({ default: m.EmbeddingViz })),
  'vector-space': () => import('./rag/visualizations/vector-space-viz').then(m => ({ default: m.VectorSpaceViz })),
  'cosine-similarity': () => import('./rag/visualizations/cosine-similarity-viz').then(m => ({ default: m.CosineSimilarityViz })),
  rag: () => import('./rag/visualizations/rag-viz').then(m => ({ default: m.RAGViz })),
  'top-k': () => import('./rag/visualizations/top-k-viz').then(m => ({ default: m.TopKViz })),
  reranking: () => import('./rag/visualizations/reranking-viz').then(m => ({ default: m.RerankingViz })),
  citation: () => import('./rag/visualizations/citation-viz').then(m => ({ default: m.CitationViz })),
  grounding: () => import('./rag/visualizations/grounding-viz').then(m => ({ default: m.GroundingViz })),
  'strict-threshold': () => import('./rag/visualizations/strict-threshold-viz').then(m => ({ default: m.StrictThresholdViz })),
  'refusal-pattern': () => import('./rag/visualizations/refusal-pattern-viz').then(m => ({ default: m.RefusalPatternViz })),
  'adversarial-test': () => import('./rag/visualizations/adversarial-test-viz').then(m => ({ default: m.AdversarialTestViz })),
};

export function TerminologyTab() {
  const { locale } = useI18n();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    Object.fromEntries(TERMINOLOGY.map(s => [s.title, true]))
  );
  const [vizTerm, setVizTerm] = useState<Term | null>(null);
  const [VizComponent, setVizComponent] = useState<React.ComponentType<{ onReplay?: () => void }> | null>(null);
  const [vizKey, setVizKey] = useState(0);

  const toggleSection = (title: string) => {
    setExpandedSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const openViz = async (term: Term) => {
    setVizTerm(term);
    setVizKey(k => k + 1);

    if (vizModules[term.id]) {
      try {
        const mod = await vizModules[term.id]();
        setVizComponent(() => mod.default);
      } catch {
        setVizComponent(null);
      }
    }
  };

  const replay = () => setVizKey(k => k + 1);

  return (
    <div className="space-y-4">
      <div className="bg-mest-gold-light rounded-xl p-4 border border-mest-gold/30">
        <p className="text-sm text-mest-grey-700">
          <strong>16 core concepts</strong> you need to understand to build a trustworthy RAG system.
          Click <strong>Visualise</strong> on any term to see an animated explanation.
        </p>
      </div>

      {TERMINOLOGY.map(section => (
        <div key={section.title} className="bg-white rounded-xl border border-mest-grey-300/60 overflow-hidden">
          {/* Section header */}
          <button
            onClick={() => toggleSection(section.title)}
            className="w-full flex items-center justify-between px-5 py-3 hover:bg-mest-grey-50/50"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{section.emoji}</span>
              <span className="font-serif text-lg text-mest-ink">
                {locale === 'fr' ? section.titleFr : section.title}
              </span>
              <span className="text-xs text-mest-grey-500">{section.terms.length} terms</span>
            </div>
            {expandedSections[section.title] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {/* Terms */}
          {expandedSections[section.title] && (
            <div className="border-t border-mest-grey-300/30 divide-y divide-mest-grey-300/30">
              {section.terms.map(term => (
                <div key={term.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-serif text-[22px] text-[#1B4F72]">
                        {locale === 'fr' ? term.nameFr : term.name}
                      </h3>
                      <p className="text-base text-mest-grey-700 mt-1">
                        {locale === 'fr' ? term.oneLinerFr : term.oneLiner}
                      </p>
                      <div className="mt-3 text-sm text-mest-grey-500 leading-relaxed whitespace-pre-line">
                        {locale === 'fr' ? term.explanationFr : term.explanation}
                      </div>
                    </div>
                    <Button
                      onClick={() => openViz(term)}
                      className="bg-[#B8860B] hover:bg-[#B8860B]/90 text-white gap-1.5 shrink-0"
                      size="sm"
                    >
                      <Eye size={14} />
                      Visualise
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Visualization modal */}
      {vizTerm && (
        <Modal
          open={!!vizTerm}
          onClose={() => { setVizTerm(null); setVizComponent(null); }}
          title={locale === 'fr' ? vizTerm.nameFr : vizTerm.name}
          className="max-w-[90vw] max-h-[85vh]"
        >
          <div className="bg-[#0F2F44] rounded-xl p-6 min-h-[60vh] flex flex-col">
            {VizComponent ? (
              <VizComponent key={vizKey} onReplay={replay} />
            ) : (
              <div className="flex-1 flex items-center justify-center text-white/50 text-sm">
                Visualization loading...
              </div>
            )}
            <div className="flex justify-center mt-4">
              <Button onClick={replay} variant="outline" size="sm" className="text-white border-white/30 hover:bg-white/10">
                ↻ Replay
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
