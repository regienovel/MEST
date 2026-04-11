import { NextRequest, NextResponse } from 'next/server';
import { ensureSeeded } from '@/lib/seed';
import { getVersions, createSnapshot, restoreVersion } from '@/lib/versions';

export async function GET(req: NextRequest) {
  await ensureSeeded();

  const teamCookie = req.cookies.get('mest_team')?.value;
  if (!teamCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let team: { id: string };
  try { team = JSON.parse(decodeURIComponent(teamCookie)); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const { searchParams } = new URL(req.url);
  const resourceType = searchParams.get('type') || '';
  const resourceId = searchParams.get('id') || '';

  if (!resourceType || !resourceId) {
    return NextResponse.json({ error: 'Missing type or id' }, { status: 400 });
  }

  const versions = await getVersions(team.id, resourceType, resourceId);
  return NextResponse.json({ versions });
}

export async function POST(req: NextRequest) {
  await ensureSeeded();

  const teamCookie = req.cookies.get('mest_team')?.value;
  if (!teamCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let team: { id: string };
  try { team = JSON.parse(decodeURIComponent(teamCookie)); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const { action, resourceType, resourceId, state, diffSummary, versionNumber, currentState } = await req.json();

  if (action === 'snapshot') {
    const version = await createSnapshot(team.id, resourceType, resourceId, state, diffSummary);
    return NextResponse.json({ ok: true, version });
  }

  if (action === 'restore') {
    try {
      const result = await restoreVersion(team.id, resourceType, resourceId, versionNumber, currentState);
      return NextResponse.json({ ok: true, ...result });
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Restore failed' }, { status: 400 });
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
