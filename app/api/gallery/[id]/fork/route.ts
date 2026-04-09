import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { ensureSeeded } from '@/lib/seed';
import { awardXp } from '@/lib/usage';
import { logActivity } from '@/lib/activity';
import type { GalleryItem } from '@/lib/types';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeeded();
  const { id } = await params;

  const teamCookie = req.cookies.get('mest_team')?.value;
  if (!teamCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let team: { id: string; name: string };
  try { team = JSON.parse(decodeURIComponent(teamCookie)); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  if (!team.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const original = await storage.get<GalleryItem>(`gallery:${id}`);
  if (!original || original.type !== 'chain') {
    return NextResponse.json({ error: 'Can only fork chains' }, { status: 400 });
  }

  // Increment fork count on original
  original.forks = (original.forks || 0) + 1;
  await storage.set(`gallery:${id}`, original);

  // Award XP to original team
  if (original.teamId !== team.id) {
    await awardXp(original.teamId, 5);
  }

  // Create new chain for current team
  const newId = crypto.randomUUID();
  const data = original.data as { blocks?: unknown[] };

  await storage.set(`chain:${newId}`, {
    id: newId,
    teamId: team.id,
    teamName: team.name,
    name: `${original.title} (forked)`,
    blocks: data.blocks || [],
    createdAt: new Date().toISOString(),
    forkedFrom: id,
    runs: 0,
  });

  await logActivity(
    'chain-forked',
    team.id,
    team.name,
    `forked "${original.title}" from ${original.teamName}`,
    `a forké "${original.title}" de ${original.teamName}`
  );

  return NextResponse.json({ ok: true, newChainId: newId });
}
