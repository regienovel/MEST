'use client';
import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n-context';
import { Button } from '@/components/ui/button';
import { Download, ChevronDown, ChevronUp, FileText } from 'lucide-react';

interface Scenario {
  id: string;
  team: string;
  title: string;
  year: number;
  location: string;
  industry?: string;
  headline: string;
  executive_summary: string;
  the_failure: {
    what_went_wrong: string;
    who_was_harmed: string;
    the_root_cause: string;
  };
  the_lesson: {
    trust_property_violated: string;
    rebuild_techniques: string[];
    why_it_matters_for_african_builders: string;
  };
  discussion_questions: string[];
  rag_documents?: Array<{
    filename: string;
    type: string;
    description: string;
    content: string;
  }>;
}

const TRUST_LABEL_KEYS: Record<string, string> = {
  honest_uncertainty: 'trust.honest_uncertainty',
  source_citation: 'trust.source_citation',
  context_fit: 'trust.context_fit',
  recoverability: 'trust.recoverability',
  adversarial_robustness: 'trust.adversarial_robustness',
};

const TRUST_COLORS: Record<string, string> = {
  honest_uncertainty: 'bg-blue-50 text-blue-700 border-blue-200',
  source_citation: 'bg-purple-50 text-purple-700 border-purple-200',
  context_fit: 'bg-amber-50 text-amber-700 border-amber-200',
  recoverability: 'bg-green-50 text-green-700 border-green-200',
  adversarial_robustness: 'bg-red-50 text-red-700 border-red-200',
};

export function ScenarioTab() {
  const { t } = useI18n();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/rag/scenarios')
      .then(r => r.json())
      .then(d => setScenarios(d.scenarios || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAllFiles = (docs: Scenario['rag_documents']) => {
    if (!docs) return;
    docs.forEach(doc => downloadFile(doc.filename, doc.content));
  };

  if (loading) return <div className="text-center py-12 text-mest-grey-500 animate-pulse">{t('common.loading')}</div>;

  return (
    <div className="space-y-4">
      <div className="bg-mest-gold-light rounded-xl p-4 border border-mest-gold/30">
        <p className="text-sm text-mest-grey-700">
          <strong>{t('scenario.intro.bold')}</strong>{' '}
          <span dangerouslySetInnerHTML={{ __html: t('scenario.intro.text') }} />
        </p>
      </div>

      {scenarios.map(scenario => {
        const isExpanded = expandedId === scenario.id;
        const isAirCanada = scenario.id === 'air-canada-chatbot';
        const trustColor = TRUST_COLORS[scenario.the_lesson.trust_property_violated] || 'bg-gray-50 text-gray-700 border-gray-200';

        return (
          <div
            key={scenario.id}
            className={`bg-white rounded-xl border overflow-hidden transition-all ${
              isAirCanada ? 'border-mest-gold border-2' : 'border-mest-grey-300/60'
            }`}
          >
            {/* Header */}
            <div
              className="px-5 py-4 cursor-pointer hover:bg-mest-grey-50/50"
              onClick={() => setExpandedId(isExpanded ? null : scenario.id)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-serif text-lg text-mest-ink">{scenario.title}</h3>
                    {isAirCanada && (
                      <span className="text-xs bg-mest-gold text-white px-2 py-0.5 rounded-full font-semibold">{t('scenario.ragBuild')}</span>
                    )}
                    <span className="text-xs text-mest-grey-500">{scenario.year} · {scenario.location}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${trustColor}`}>
                      {t(TRUST_LABEL_KEYS[scenario.the_lesson.trust_property_violated] as any)}
                    </span>
                  </div>
                  <p className="text-sm text-mest-grey-500 mt-1 italic">{scenario.headline}</p>
                  <p className="text-sm text-mest-grey-700 mt-2">{scenario.executive_summary}</p>
                </div>
                <div className="shrink-0 mt-1">
                  {isExpanded ? <ChevronUp size={18} className="text-mest-grey-300" /> : <ChevronDown size={18} className="text-mest-grey-300" />}
                </div>
              </div>
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <div className="border-t border-mest-grey-300/30 px-5 py-4 space-y-4">
                {/* The Failure */}
                <div>
                  <h4 className="text-sm font-semibold text-mest-ink mb-2">{t('scenario.whatWentWrong')}</h4>
                  <p className="text-sm text-mest-grey-700 whitespace-pre-line leading-relaxed">{scenario.the_failure.what_went_wrong}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-mest-rust mb-2">{t('scenario.whoHarmed')}</h4>
                  <p className="text-sm text-mest-grey-700 whitespace-pre-line leading-relaxed">{scenario.the_failure.who_was_harmed}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-mest-ink mb-2">{t('scenario.rootCause')}</h4>
                  <p className="text-sm text-mest-grey-700 leading-relaxed">{scenario.the_failure.the_root_cause}</p>
                </div>

                {/* The Lesson */}
                <div className="bg-mest-gold-light rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-mest-gold mb-2">{t('scenario.whyMatters')}</h4>
                  <p className="text-sm text-mest-grey-700 italic">{scenario.the_lesson.why_it_matters_for_african_builders}</p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {scenario.the_lesson.rebuild_techniques.map(tech => (
                      <span key={tech} className="text-xs bg-white/60 text-mest-grey-700 px-2 py-0.5 rounded">{tech}</span>
                    ))}
                  </div>
                </div>

                {/* Discussion Questions */}
                <div>
                  <h4 className="text-sm font-semibold text-mest-ink mb-2">{t('scenario.discussion')}</h4>
                  <ol className="space-y-1.5">
                    {scenario.discussion_questions.map((q, i) => (
                      <li key={i} className="text-sm text-mest-grey-700 flex gap-2">
                        <span className="text-mest-gold font-bold shrink-0">{i + 1}.</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Download files — Air Canada only */}
                {isAirCanada && scenario.rag_documents && scenario.rag_documents.length > 0 && (
                  <div className="bg-mest-blue-light rounded-lg p-4 border border-mest-blue/20">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-mest-blue">{t('scenario.sourceDocuments')}</h4>
                      <Button
                        size="sm"
                        onClick={() => downloadAllFiles(scenario.rag_documents)}
                        className="bg-mest-blue hover:bg-mest-blue/90 text-white gap-1.5"
                      >
                        <Download size={14} />
                        {t('scenario.downloadAll')}
                      </Button>
                    </div>
                    <p className="text-xs text-mest-grey-500 mb-3">
                      {t('scenario.uploadInstructions')}
                    </p>
                    <div className="space-y-2">
                      {scenario.rag_documents.map(doc => (
                        <div key={doc.filename} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2">
                          <FileText size={16} className="text-mest-blue shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-mest-ink">{doc.filename}</span>
                            <p className="text-xs text-mest-grey-500">{doc.description}</p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); downloadFile(doc.filename, doc.content); }}
                            className="text-mest-blue hover:text-mest-blue/80 p-1"
                            title="Download"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
