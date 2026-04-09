import { storage } from './storage';
import type { Config, UsageRecord } from './types';

function currentHourKey(teamId: string): string {
  const now = new Date();
  const hour = now.toISOString().slice(0, 13); // "2026-04-09T09"
  return `usage:${teamId}:${hour}`;
}

export async function checkRateLimit(teamId: string): Promise<{ allowed: boolean; remaining: number }> {
  const config = await storage.get<Config>('config');
  const limit = config?.rateLimitPerHour ?? 200;

  const key = currentHourKey(teamId);
  const record = await storage.get<UsageRecord>(key);
  const calls = record?.calls ?? 0;

  return {
    allowed: calls < limit,
    remaining: Math.max(0, limit - calls),
  };
}

export async function incrementUsage(teamId: string, estimatedCostUsd: number = 0): Promise<void> {
  const key = currentHourKey(teamId);
  const record = await storage.get<UsageRecord>(key);

  await storage.set(key, {
    teamId,
    hour: new Date().toISOString().slice(0, 13),
    calls: (record?.calls ?? 0) + 1,
    estimatedCostUsd: (record?.estimatedCostUsd ?? 0) + estimatedCostUsd,
  });
}
