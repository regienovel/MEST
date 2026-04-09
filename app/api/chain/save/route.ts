import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { ensureSeeded } from '@/lib/seed';
import { awardXp } from '@/lib/usage';
import { logActivity } from '@/lib/activity';
import type { Chain } from '@/lib/types';

export async function POST(req: NextRequest) {
  await ensureSeeded();

  const teamCookie = req.cookies.get('mest_team')?.value;
  if (!teamCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let team: { id: string; name: string };
  try { team = JSON.parse(decodeURIComponent(teamCookie)); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  if (!team.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, description, blocks, forkedFrom } = await req.json();
  const id = crypto.randomUUID();

  const chain: Chain = {
    id,
    teamId: team.id,
    teamName: team.name,
    name: name || 'Untitled Chain',
    description,
    blocks,
    createdAt: new Date().toISOString(),
    forkedFrom,
    runs: 0,
  };

  await storage.set(`chain:${id}`, chain);
  await awardXp(team.id, 25);

  // Also save to gallery
  await storage.set(`gallery:${id}`, {
    id,
    teamId: team.id,
    teamName: team.name,
    type: 'chain',
    title: name,
    description,
    data: { blocks, forkedFrom },
    createdAt: chain.createdAt,
    views: 0,
    forks: 0,
    featured: false,
  });

  await logActivity(
    'chain-saved',
    team.id,
    team.name,
    `saved a chain: "${name}"`,
    `a sauvegardé une chaîne: "${name}"`
  );

  return NextResponse.json({ ok: true, chainId: id });
}
