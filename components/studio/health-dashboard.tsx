'use client';
import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n-context';
import { TopBar } from './top-bar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Activity, Clock, AlertTriangle, Zap, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import Link from 'next/link';

interface CallRecord {
  id: string;
  timestamp: string;
  module: string;
  inputSummary: string;
  status: 'success' | 'error';
  latencyMs: number;
  tokensUsed?: number;
  costUsd?: number;
  errorMessage?: string;
}

interface TeamMetrics {
  totalRequestsToday: number;
  avgLatencyMs: number;
  errorRate: number;
  activeModules: string[];
  lastCalls: CallRecord[];
  trustScorecard: Record<string, { status: 'pass' | 'fail' | 'untested'; lastTested?: string }>;
}

interface HealthDashboardProps {
  teamId: string;
  teamName: string;
  xp: number;
}

const TRUST_PROPERTIES = [
  { key: 'honest_uncertainty', label: 'Honest Uncertainty', labelFr: 'Incertitude honnête', icon: '🎯' },
  { key: 'source_citation', label: 'Source Citation', labelFr: 'Citation des sources', icon: '📎' },
  { key: 'context_fit', label: 'Context Fit', labelFr: 'Pertinence contextuelle', icon: '🧩' },
  { key: 'recoverability', label: 'Recoverability', labelFr: 'Récupérabilité', icon: '🔄' },
  { key: 'adversarial_robustness', label: 'Adversarial Robustness', labelFr: 'Robustesse adversariale', icon: '🛡️' },
];

export function HealthDashboard({ teamId, teamName, xp }: HealthDashboardProps) {
  const { t, locale } = useI18n();
  const [metrics, setMetrics] = useState<TeamMetrics | null>(null);
  const [expandedCall, setExpandedCall] = useState<string | null>(null);

  const fetchMetrics = useCallback(() => {
    fetch('/api/health/metrics')
      .then(r => r.json())
      .then(d => setMetrics(d.metrics))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  const updateScorecard = async (property: string, status: 'pass' | 'fail') => {
    await fetch('/api/health/scorecard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ property, status }),
    });
    fetchMetrics();
  };

  const latencyColor = (ms: number) => ms < 1500 ? 'text-mest-sage' : ms < 3000 ? 'text-mest-gold' : 'text-mest-rust';
  const errorColor = (rate: number) => rate < 1 ? 'text-mest-sage' : rate < 5 ? 'text-mest-gold' : 'text-mest-rust';

  return (
    <div className="min-h-screen bg-mest-paper flex flex-col">
      <TopBar teamName={teamName} xp={xp} />

      <div className="bg-white border-b border-mest-grey-300/60 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Link href="/studio" className="text-mest-grey-500 hover:text-mest-ink"><ArrowLeft size={20} /></Link>
          <h1 className="font-serif text-xl text-mest-ink">{t('health.title')}</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full px-4 py-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-mest-grey-300/60 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={16} className="text-mest-blue" />
              <span className="text-xs text-mest-grey-500">{t('health.requests')}</span>
            </div>
            <p className="text-3xl font-semibold text-mest-ink">{metrics?.totalRequestsToday ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-mest-grey-300/60 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={16} className="text-mest-blue" />
              <span className="text-xs text-mest-grey-500">{t('health.latency')}</span>
            </div>
            <p className={`text-3xl font-semibold ${latencyColor(metrics?.avgLatencyMs ?? 0)}`}>
              {metrics?.avgLatencyMs ?? 0}ms
            </p>
          </div>
          <div className="bg-white rounded-xl border border-mest-grey-300/60 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-mest-blue" />
              <span className="text-xs text-mest-grey-500">{t('health.errorRate')}</span>
            </div>
            <p className={`text-3xl font-semibold ${errorColor(metrics?.errorRate ?? 0)}`}>
              {metrics?.errorRate ?? 0}%
            </p>
          </div>
          <div className="bg-white rounded-xl border border-mest-grey-300/60 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="text-mest-blue" />
              <span className="text-xs text-mest-grey-500">{t('health.activeModules')}</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {(metrics?.activeModules || []).map(mod => (
                <span key={mod} className="text-xs bg-mest-sage-light text-mest-sage px-2 py-0.5 rounded-full capitalize">{mod}</span>
              ))}
              {(metrics?.activeModules?.length ?? 0) === 0 && <span className="text-xs text-mest-grey-300">None yet</span>}
            </div>
          </div>
        </div>

        {/* Trust Scorecard */}
        <div className="bg-white rounded-xl border border-mest-grey-300/60 p-6">
          <h2 className="font-serif text-lg text-mest-ink mb-4">{t('health.trustScore')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {TRUST_PROPERTIES.map(prop => {
              const score = metrics?.trustScorecard?.[prop.key];
              const status = score?.status || 'untested';
              return (
                <div key={prop.key} className={`rounded-xl border-2 p-4 text-center ${
                  status === 'pass' ? 'border-mest-sage bg-mest-sage-light' :
                  status === 'fail' ? 'border-mest-rust bg-mest-rust-light' :
                  'border-mest-grey-300 bg-mest-grey-50'
                }`}>
                  <span className="text-2xl">{prop.icon}</span>
                  <p className="text-xs font-semibold text-mest-ink mt-2">
                    {locale === 'fr' ? prop.labelFr : prop.label}
                  </p>
                  <div className="mt-2">
                    {status === 'pass' && <CheckCircle size={20} className="text-mest-sage mx-auto" />}
                    {status === 'fail' && <XCircle size={20} className="text-mest-rust mx-auto" />}
                    {status === 'untested' && <MinusCircle size={20} className="text-mest-grey-300 mx-auto" />}
                  </div>
                  {score?.lastTested && (
                    <p className="text-xs text-mest-grey-500 mt-1">
                      {new Date(score.lastTested).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                  <div className="flex gap-1 mt-2 justify-center">
                    <button onClick={() => updateScorecard(prop.key, 'pass')} className="text-xs px-2 py-0.5 rounded bg-mest-sage/20 text-mest-sage hover:bg-mest-sage/30">✓</button>
                    <button onClick={() => updateScorecard(prop.key, 'fail')} className="text-xs px-2 py-0.5 rounded bg-mest-rust/20 text-mest-rust hover:bg-mest-rust/30">✗</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Last 20 calls */}
        <div className="bg-white rounded-xl border border-mest-grey-300/60 p-6">
          <h2 className="font-serif text-lg text-mest-ink mb-4">{t('health.lastCalls')}</h2>
          {(metrics?.lastCalls?.length ?? 0) === 0 ? (
            <p className="text-sm text-mest-grey-500 italic">No calls recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-mest-grey-50">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Time</th>
                    <th className="text-left px-3 py-2 font-medium">Module</th>
                    <th className="text-left px-3 py-2 font-medium">Input</th>
                    <th className="text-center px-3 py-2 font-medium">Status</th>
                    <th className="text-right px-3 py-2 font-medium">Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics?.lastCalls?.map(call => (
                    <tr
                      key={call.id}
                      className="border-t border-mest-grey-300/30 cursor-pointer hover:bg-mest-grey-50"
                      onClick={() => setExpandedCall(expandedCall === call.id ? null : call.id)}
                    >
                      <td className="px-3 py-2 text-xs text-mest-grey-500">
                        {new Date(call.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="px-3 py-2 capitalize">{call.module}</td>
                      <td className="px-3 py-2 text-mest-grey-700 truncate max-w-[200px]">{call.inputSummary}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${call.status === 'success' ? 'bg-mest-sage-light text-mest-sage' : 'bg-mest-rust-light text-mest-rust'}`}>
                          {call.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right text-xs">{call.latencyMs}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
