import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { ensureSeeded } from '@/lib/seed';
import { submitModel } from '@/lib/rag-config';
import type { RagDocument } from '@/lib/rag';

export async function POST(req: NextRequest) {
  await ensureSeeded();
  const teamCookie = req.cookies.get('mest_team')?.value;
  if (!teamCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let team: { id: string };
  try { team = JSON.parse(decodeURIComponent(teamCookie)); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const { modelId } = await req.json();

  // Get documents with content for the submission
  const docs = (await storage.get<RagDocument[]>(`rag:docs:${team.id}`)) || [];

  try {
    await submitModel(team.id, modelId, docs);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Submit failed' }, { status: 400 });
  }
}
