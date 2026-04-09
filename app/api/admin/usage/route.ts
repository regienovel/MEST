import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { ensureSeeded } from '@/lib/seed';
import { isAdmin } from '@/lib/auth';
import teamsSeed from '@/seed/teams.json';
import type { UsageRecord } from '@/lib/types';

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await ensureSeeded();

  const currentHour = new Date().toISOString().slice(0, 13);
  const teams: Array<{
    id: string; name: string; xp: number; disabled: boolean;
    callsThisHour: number; costThisHour: number;
  }> = [];

  // Read team list from seed file, usage from storage (ephemeral)
  for (const seedTeam of teamsSeed.teams) {
    if (seedTeam.id === 'admin') continue;

    const usage = await storage.get<UsageRecord>(`usage:${seedTeam.id}:${currentHour}`);
    teams.push({
      id: seedTeam.id,
      name: seedTeam.name,
      xp: 0,
      disabled: false,
      callsThisHour: usage?.calls || 0,
      costThisHour: usage?.estimatedCostUsd || 0,
    });
  }

  // Quick stats
  const usageKeys = await storage.list('usage:');
  const today = new Date().toISOString().slice(0, 10);
  let totalCallsToday = 0;
  let totalCostToday = 0;

  for (const key of usageKeys) {
    if (key.includes(today)) {
      const rec = await storage.get<UsageRecord>(key);
      if (rec) {
        totalCallsToday += rec.calls;
        totalCostToday += rec.estimatedCostUsd;
      }
    }
  }

  const topTeam = teams.sort((a, b) => b.callsThisHour - a.callsThisHour)[0];

  return NextResponse.json({
    teams,
    stats: {
      totalCallsToday,
      totalCostToday: totalCostToday.toFixed(2),
      topTeam: topTeam?.name || '-',
      topModule: 'Chat',
    },
  });
}
