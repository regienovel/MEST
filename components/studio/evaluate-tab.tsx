'use client';
import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Play, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface TestCase {
  id: string;
  query: string;
  expectedAction: 'answer' | 'refuse';
  label?: string;
}

interface TestResult {
  testCase: TestCase;
  retrievedChunks: Array<{ id: string; text: string; similarity: number; rank: number }>;
  expectedChunkRank: number | null;
  passed: boolean;
  explanation: string;
  generatedResponse: string;
}

interface EvaluationMetrics {
  precisionAtK: number;
  recallAtK: number;
  mrr: number;
  ndcg: number;
  refusalAccuracy: number;
  totalTests: number;
  passedTests: number;
  results: TestResult[];
}

export function EvaluateTab({ teamId }: { teamId: string }) {
  const { t } = useI18n();
  const [suite, setSuite] = useState<TestCase[]>([]);
  const [metrics, setMetrics] = useState<EvaluationMetrics | null>(null);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedResult, setExpandedResult] = useState<string | null>(null);
  const [newQuery, setNewQuery] = useState('');
  const [newAction, setNewAction] = useState<'answer' | 'refuse'>('answer');

  // Load test suite
  const fetchSuite = useCallback(() => {
    fetch('/api/rag/test-suite')
      .then(r => r.json())
      .then(d => { if (d.suite) setSuite(d.suite); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchSuite(); }, [fetchSuite]);

  const saveSuite = async (updated: TestCase[]) => {
    setSuite(updated);
    await fetch('/api/rag/test-suite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suite: updated }),
    });
  };

  const addTestCase = () => {
    if (!newQuery.trim()) return;
    const updated = [...suite, {
      id: `tc-${Date.now()}`,
      query: newQuery.trim(),
      expectedAction: newAction,
      label: newAction === 'refuse' ? 'Should refuse' : 'Should answer',
    }];
    saveSuite(updated);
    setNewQuery('');
  };

  const removeTestCase = (id: string) => {
    saveSuite(suite.filter(tc => tc.id !== id));
  };

  const runEvaluation = async () => {
    setRunning(true);
    setMetrics(null);
    try {
      const res = await fetch('/api/rag/evaluate', { method: 'POST' });
      const data = await res.json();
      if (data.ok) setMetrics(data.metrics);
    } catch {}
    setRunning(false);
  };

  if (loading) return <div className="text-center py-12 text-mest-grey-500 animate-pulse">{t('common.loading')}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-mest-gold-light rounded-xl p-4 border border-mest-gold/30">
        <p className="text-sm text-mest-grey-700">
          {t('eval.description')}
        </p>
      </div>

      {/* Test Suite Builder */}
      <div className="bg-white rounded-xl border border-mest-grey-300/60 p-5">
        <h3 className="font-serif text-lg text-mest-ink mb-4">{t('eval.testSuite')} ({suite.length} {t('eval.cases')})</h3>

        {/* Existing test cases */}
        <div className="space-y-2 mb-4">
          {suite.map((tc, i) => (
            <div key={tc.id} className="flex items-center gap-3 bg-mest-grey-50 rounded-lg px-3 py-2">
              <span className="text-xs font-mono text-mest-grey-500 w-6">#{i + 1}</span>
              <span className="flex-1 text-sm text-mest-ink">{tc.query}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                tc.expectedAction === 'answer' ? 'bg-mest-sage-light text-mest-sage' : 'bg-mest-rust-light text-mest-rust'
              }`}>
                {tc.expectedAction === 'answer' ? `✓ ${t('eval.shouldAnswer')}` : `✗ ${t('eval.shouldRefuse')}`}
              </span>
              <button onClick={() => removeTestCase(tc.id)} className="p-1 hover:bg-mest-rust-light rounded text-mest-grey-300 hover:text-mest-rust">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Add new test case */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              value={newQuery}
              onChange={e => setNewQuery(e.target.value)}
              placeholder={t('eval.addQuery')}
              onKeyDown={e => e.key === 'Enter' && addTestCase()}
            />
          </div>
          <NativeSelect value={newAction} onChange={v => setNewAction(v as 'answer' | 'refuse')} className="w-36">
            <option value="answer">{t('eval.shouldAnswer')}</option>
            <option value="refuse">{t('eval.shouldRefuse')}</option>
          </NativeSelect>
          <Button onClick={addTestCase} disabled={!newQuery.trim()} variant="outline" size="sm" className="gap-1">
            <Plus size={14} /> {t('eval.add')}
          </Button>
        </div>
      </div>

      {/* Run button */}
      <div className="flex justify-center">
        <Button
          onClick={runEvaluation}
          disabled={running || suite.length === 0}
          className="bg-mest-gold hover:bg-mest-gold/90 text-white gap-2 px-8 py-3 text-base"
        >
          {running ? <><Loader2 size={18} className="animate-spin" /> {t('eval.running')} {suite.length} {t('eval.tests')}...</> : <><Play size={18} /> {t('eval.runEval')} ({suite.length} {t('eval.tests')})</>}
        </Button>
      </div>

      {/* Metrics Dashboard */}
      {metrics && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Score summary */}
          <div className="bg-[#0F2F44] rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-sm font-semibold">{t('eval.results')}</h3>
              <span className={`text-lg font-bold ${metrics.passedTests === metrics.totalTests ? 'text-[#0E6B5C]' : 'text-[#B8860B]'}`}>
                {metrics.passedTests}/{metrics.totalTests} {t('eval.passed')}
              </span>
            </div>

            {/* 5 metric cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <MetricCard
                label={t('eval.precisionK')}
                value={`${metrics.precisionAtK}%`}
                desc={t('eval.precisionDesc')}
                color={metrics.precisionAtK > 70 ? '#0E6B5C' : metrics.precisionAtK > 40 ? '#B8860B' : '#922B21'}
              />
              <MetricCard
                label={t('eval.recallK')}
                value={`${metrics.recallAtK}%`}
                desc={t('eval.recallDesc')}
                color={metrics.recallAtK > 70 ? '#0E6B5C' : metrics.recallAtK > 40 ? '#B8860B' : '#922B21'}
              />
              <MetricCard
                label={t('eval.mrr')}
                value={metrics.mrr.toFixed(2)}
                desc={t('eval.mrrDesc')}
                color={metrics.mrr > 0.5 ? '#0E6B5C' : metrics.mrr > 0.25 ? '#B8860B' : '#922B21'}
              />
              <MetricCard
                label={t('eval.ndcg')}
                value={metrics.ndcg.toFixed(2)}
                desc={t('eval.ndcgDesc')}
                color={metrics.ndcg > 0.7 ? '#0E6B5C' : metrics.ndcg > 0.4 ? '#B8860B' : '#922B21'}
              />
              <MetricCard
                label={t('eval.refusalAcc')}
                value={`${metrics.refusalAccuracy}%`}
                desc={t('eval.refusalDesc')}
                color={metrics.refusalAccuracy > 80 ? '#0E6B5C' : metrics.refusalAccuracy > 50 ? '#B8860B' : '#922B21'}
              />
            </div>
          </div>

          {/* Query-by-query breakdown */}
          <div className="bg-white rounded-xl border border-mest-grey-300/60 p-5">
            <h3 className="font-serif text-lg text-mest-ink mb-4">{t('eval.breakdown')}</h3>
            <div className="space-y-2">
              {metrics.results.map((result, i) => (
                <div key={result.testCase.id}>
                  <div
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 cursor-pointer transition-colors ${
                      result.passed ? 'bg-mest-sage-light/50 hover:bg-mest-sage-light' : 'bg-mest-rust-light/50 hover:bg-mest-rust-light'
                    }`}
                    onClick={() => setExpandedResult(expandedResult === result.testCase.id ? null : result.testCase.id)}
                  >
                    <span className="text-xs font-mono text-mest-grey-500 w-6">#{i + 1}</span>
                    {result.passed ? <CheckCircle size={16} className="text-mest-sage shrink-0" /> : <XCircle size={16} className="text-mest-rust shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-mest-ink truncate">{result.testCase.query}</p>
                      <p className="text-xs text-mest-grey-500">{result.explanation}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      result.testCase.expectedAction === 'answer' ? 'bg-mest-sage/20 text-mest-sage' : 'bg-mest-rust/20 text-mest-rust'
                    }`}>
                      {result.testCase.expectedAction}
                    </span>
                  </div>

                  {/* Expanded: show retrieved chunks */}
                  <AnimatePresence>
                    {expandedResult === result.testCase.id && result.retrievedChunks.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-10 mr-4 mb-2 mt-1 space-y-3">
                          {/* Model's actual response */}
                          <div>
                            <p className="text-xs text-mest-grey-500 font-semibold mb-1">{t('eval.modelResponse')}:</p>
                            <div className={`text-sm rounded-lg px-4 py-3 ${
                              result.passed ? 'bg-mest-sage-light/70 border border-mest-sage/20' : 'bg-mest-rust-light/70 border border-mest-rust/20'
                            }`}>
                              <p className="text-mest-grey-700 whitespace-pre-wrap leading-relaxed">
                                {result.generatedResponse ? result.generatedResponse.split(/(\[\d+\])/).map((part, pi) =>
                                  /^\[\d+\]$/.test(part) ? (
                                    <span key={pi} className="inline-flex items-center justify-center bg-mest-gold text-white text-[8px] rounded-full w-4 h-4 mx-0.5 font-bold">{part.slice(1, -1)}</span>
                                  ) : <span key={pi}>{part}</span>
                                ) : <span className="text-mest-grey-500 italic">{t('eval.noResponse')}</span>}
                              </p>
                            </div>
                          </div>

                          {/* Retrieved chunks */}
                          <div>
                            <p className="text-xs text-mest-grey-500 font-semibold mb-1">{t('eval.retrievedChunks')}:</p>
                            {result.retrievedChunks.map(chunk => (
                              <div key={chunk.id} className="flex items-center gap-2 text-xs bg-mest-grey-50 rounded px-3 py-1.5 mb-1">
                                <span className="font-mono text-mest-grey-500 w-4">#{chunk.rank}</span>
                                <span className="flex-1 text-mest-grey-700 truncate">{chunk.text}</span>
                                <span className="text-mest-gold font-semibold">{Math.round(chunk.similarity * 100)}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function MetricCard({ label, value, desc, color }: { label: string; value: string; desc: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/10 rounded-xl p-4 text-center"
    >
      <p className="text-white/50 text-[10px] uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-bold mt-1" style={{ color }}>{value}</p>
      <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${parseFloat(value)}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
      <p className="text-white/30 text-[9px] mt-1.5">{desc}</p>
    </motion.div>
  );
}
