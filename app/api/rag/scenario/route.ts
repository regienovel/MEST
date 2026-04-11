import { NextRequest, NextResponse } from 'next/server';
import { ensureSeeded } from '@/lib/seed';
import { getTeamScenario } from '@/lib/scenario-seed';

export async function GET(req: NextRequest) {
  await ensureSeeded();

  const teamCookie = req.cookies.get('mest_team')?.value;
  if (!teamCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let team: { id: string };
  try { team = JSON.parse(decodeURIComponent(teamCookie)); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const scenario = await getTeamScenario(team.id);
  return NextResponse.json({ scenario });
}
