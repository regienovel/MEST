import { NextRequest, NextResponse } from 'next/server';
import { ensureSeeded } from '@/lib/seed';
import { updateScorecard } from '@/lib/health-metrics';

export async function POST(req: NextRequest) {
  await ensureSeeded();

  const teamCookie = req.cookies.get('mest_team')?.value;
  if (!teamCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let team: { id: string };
  try { team = JSON.parse(decodeURIComponent(teamCookie)); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const { property, status } = await req.json();
  if (!property || !['pass', 'fail', 'untested'].includes(status)) {
    return NextResponse.json({ error: 'Invalid property or status' }, { status: 400 });
  }

  await updateScorecard(team.id, property, status);
  return NextResponse.json({ ok: true });
}
