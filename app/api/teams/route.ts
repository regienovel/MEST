import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { ensureSeeded } from '@/lib/seed';
import type { Team } from '@/lib/types';

export async function GET() {
  await ensureSeeded();

  const keys = await storage.list('team:');
  const teams: Array<{ id: string; name: string }> = [];

  for (const key of keys) {
    const team = await storage.get<Team>(key);
    if (team && team.id !== 'admin' && !team.disabled) {
      teams.push({ id: team.id, name: team.name });
    }
  }

  return NextResponse.json({ teams });
}
