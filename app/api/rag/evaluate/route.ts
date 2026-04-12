import { NextRequest, NextResponse } from 'next/server';
import { ensureSeeded } from '@/lib/seed';
import { runEvaluation } from '@/lib/rag-evaluate';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  await ensureSeeded();

  const teamCookie = req.cookies.get('mest_team')?.value;
  if (!teamCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let team: { id: string };
  try { team = JSON.parse(decodeURIComponent(teamCookie)); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  try {
    const metrics = await runEvaluation(team.id);
    return NextResponse.json({ ok: true, metrics });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Evaluation failed' }, { status: 500 });
  }
}
