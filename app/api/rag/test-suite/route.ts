import { NextRequest, NextResponse } from 'next/server';
import { ensureSeeded } from '@/lib/seed';
import { getTestSuite, saveTestSuite, type TestCase } from '@/lib/rag-evaluate';

export async function GET(req: NextRequest) {
  await ensureSeeded();

  const teamCookie = req.cookies.get('mest_team')?.value;
  if (!teamCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let team: { id: string };
  try { team = JSON.parse(decodeURIComponent(teamCookie)); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const suite = await getTestSuite(team.id);
  return NextResponse.json({ suite });
}

export async function POST(req: NextRequest) {
  await ensureSeeded();

  const teamCookie = req.cookies.get('mest_team')?.value;
  if (!teamCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let team: { id: string };
  try { team = JSON.parse(decodeURIComponent(teamCookie)); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const { suite } = await req.json() as { suite: TestCase[] };
  await saveTestSuite(team.id, suite);
  return NextResponse.json({ ok: true });
}
