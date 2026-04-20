import { NextRequest, NextResponse } from 'next/server';
import { ensureSeeded } from '@/lib/seed';
import { getDraft, getSubmitted, saveDraft, submitCard, type ModelCard } from '@/lib/model-card';

function readTeam(req: NextRequest): { id: string; name: string } | null {
  const cookie = req.cookies.get('mest_team')?.value;
  if (!cookie) return null;
  try { return JSON.parse(decodeURIComponent(cookie)); } catch { return null; }
}

export async function GET(req: NextRequest) {
  await ensureSeeded();
  const team = readTeam(req);
  if (!team) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const draft = await getDraft(team.id);
  const submitted = await getSubmitted(team.id);
  return NextResponse.json({ draft, submitted });
}

export async function POST(req: NextRequest) {
  await ensureSeeded();
  const team = readTeam(req);
  if (!team) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { action: 'save' | 'submit'; card: Partial<ModelCard> };

  if (body.action === 'save') {
    const card = await saveDraft(team.id, team.name, body.card);
    return NextResponse.json({ ok: true, card });
  }

  if (body.action === 'submit') {
    const card = await submitCard(team.id, team.name, body.card);
    return NextResponse.json({ ok: true, card });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
