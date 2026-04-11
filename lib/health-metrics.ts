import { storage } from './storage';

export interface CallRecord {
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

export interface TeamMetrics {
  totalRequestsToday: number;
  avgLatencyMs: number;
  errorRate: number;
  activeModules: string[];
  lastCalls: CallRecord[];
  trustScorecard: Record<string, { status: 'pass' | 'fail' | 'untested'; lastTested?: string }>;
}

export async function logCall(teamId: string, call: CallRecord): Promise<void> {
  const key = `health:calls:${teamId}`;
  const existing = (await storage.get<CallRecord[]>(key)) || [];
  existing.unshift(call);
  if (existing.length > 100) existing.length = 100;
  await storage.set(key, existing);

  // Update daily counter
  const today = new Date().toISOString().slice(0, 10);
  const dailyKey = `health:daily:${teamId}:${today}`;
  await storage.increment(dailyKey);
}

export async function getTeamMetrics(teamId: string): Promise<TeamMetrics> {
  const calls = (await storage.get<CallRecord[]>(`health:calls:${teamId}`)) || [];
  const today = new Date().toISOString().slice(0, 10);
  const todayCalls = calls.filter(c => c.timestamp.startsWith(today));

  const totalRequestsToday = todayCalls.length;
  const avgLatencyMs = todayCalls.length > 0
    ? Math.round(todayCalls.reduce((sum, c) => sum + c.latencyMs, 0) / todayCalls.length)
    : 0;
  const errorCount = todayCalls.filter(c => c.status === 'error').length;
  const errorRate = todayCalls.length > 0 ? Math.round((errorCount / todayCalls.length) * 100) : 0;

  const activeModules = Array.from(new Set(todayCalls.map(c => c.module)));

  const scorecard = (await storage.get<Record<string, { status: string; lastTested?: string }>>(
    `health:scorecard:${teamId}`
  )) || {
    honest_uncertainty: { status: 'untested' },
    source_citation: { status: 'untested' },
    context_fit: { status: 'untested' },
    recoverability: { status: 'untested' },
    adversarial_robustness: { status: 'untested' },
  };

  return {
    totalRequestsToday,
    avgLatencyMs,
    errorRate,
    activeModules,
    lastCalls: calls.slice(0, 20),
    trustScorecard: scorecard as TeamMetrics['trustScorecard'],
  };
}

export async function updateScorecard(
  teamId: string,
  property: string,
  status: 'pass' | 'fail' | 'untested'
): Promise<void> {
  const scorecard = (await storage.get<Record<string, unknown>>(`health:scorecard:${teamId}`)) || {};
  scorecard[property] = { status, lastTested: new Date().toISOString() };
  await storage.set(`health:scorecard:${teamId}`, scorecard);
}
