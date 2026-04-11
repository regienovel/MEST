import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { isAdmin } from '@/lib/auth';
import { ensureSeeded } from '@/lib/seed';
import teamsSeed from '@/seed/teams.json';

export async function POST(req: NextRequest) {
  await ensureSeeded();
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { teamId } = await req.json();

  if (teamId) {
    // Purge specific team
    await storage.delete(`rag:docs:${teamId}`);
    // Also scan for any standalone keys
    const keys = await storage.list(`rag:`);
    for (const key of keys) {
      if (key.includes(teamId)) {
        await storage.delete(key);
      }
    }
    console.log(`[admin-rag] Purged all RAG data for team ${teamId}`);
    return NextResponse.json({ ok: true, team: teamId });
  }

  // Purge ALL teams
  for (const team of teamsSeed.teams) {
    await storage.delete(`rag:docs:${team.id}`);
  }
  const allRagKeys = await storage.list('rag:');
  for (const key of allRagKeys) {
    await storage.delete(key);
  }
  console.log(`[admin-rag] Purged all RAG data for all teams`);
  return NextResponse.json({ ok: true, all: true });
}
