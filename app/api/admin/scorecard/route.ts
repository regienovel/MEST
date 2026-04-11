import { NextRequest, NextResponse } from 'next/server';
import { ensureSeeded } from '@/lib/seed';
import { isAdmin } from '@/lib/auth';
import { updateScorecard } from '@/lib/health-metrics';

export async function POST(req: NextRequest) {
  await ensureSeeded();
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { teamId, property, status } = await req.json();
  if (!teamId || !property || !['pass', 'fail', 'untested'].includes(status)) {
    return NextResponse.json({ error: 'Missing teamId, property, or invalid status' }, { status: 400 });
  }

  await updateScorecard(teamId, property, status);
  return NextResponse.json({ ok: true });
}
