import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { ensureSeeded } from '@/lib/seed';
import { isAdmin } from '@/lib/auth';
import type { Team, UsageRecord } from '@/lib/types';

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await ensureSeeded();

  const teamKeys = await storage.list('team:');
  const currentHour = new Date().toISOString().slice(0, 13);
  const teams: Array<{
    id: string; name: string; xp: number; disabled: boolean;
    callsThisHour: number; costThisHour: number;
  }> = [];

  for (const key of teamKeys) {
    const team = await storage.get<Team>(key);
    if (!team || team.id === 'admin') continue;

    const usage = await storage.get<UsageRecord>(`usage:${team.id}:${currentHour}`);
    teams.push({
      id: team.id,
      name: team.name,
      xp: team.xp || 0,
      disabled: !!team.disabled,
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
      topModule: 'Chat', // Simplified
    },
  });
}
