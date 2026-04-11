import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { isAdmin } from '@/lib/auth';
import { ensureSeeded } from '@/lib/seed';
import teamsSeed from '@/seed/teams.json';

export async function POST(req: NextRequest) {
  await ensureSeeded();

  // Admin only
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  let cleaned = 0;
  for (const team of teamsSeed.teams) {
    const key = `rag:docs:${team.id}`;
    const docs = await storage.get<unknown[]>(key);
    if (docs && docs.length > 0) {
      await storage.delete(key);
      cleaned++;
    }
  }

  return NextResponse.json({ ok: true, teamsCleared: cleaned });
}
