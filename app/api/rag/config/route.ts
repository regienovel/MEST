import { NextRequest, NextResponse } from 'next/server';
import { ensureSeeded } from '@/lib/seed';
import { getTeamConfig, saveTeamConfig, type RagConfig } from '@/lib/rag-config';

export async function GET(req: NextRequest) {
  await ensureSeeded();
  const teamCookie = req.cookies.get('mest_team')?.value;
  if (!teamCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let team: { id: string };
  try { team = JSON.parse(decodeURIComponent(teamCookie)); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const config = await getTeamConfig(team.id);
  return NextResponse.json({ config });
}

export async function POST(req: NextRequest) {
  await ensureSeeded();
  const teamCookie = req.cookies.get('mest_team')?.value;
  if (!teamCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let team: { id: string };
  try { team = JSON.parse(decodeURIComponent(teamCookie)); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const config = await req.json() as RagConfig;
  await saveTeamConfig(team.id, config);
  return NextResponse.json({ ok: true });
}
