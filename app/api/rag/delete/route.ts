import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { ensureSeeded } from '@/lib/seed';
import type { RagDocument } from '@/lib/rag';

export async function POST(req: NextRequest) {
  await ensureSeeded();

  const teamCookie = req.cookies.get('mest_team')?.value;
  if (!teamCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let team: { id: string };
  try { team = JSON.parse(decodeURIComponent(teamCookie)); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const { documentId } = await req.json();
  const docs = (await storage.get<RagDocument[]>(`rag:docs:${team.id}`)) || [];
  const filtered = docs.filter(d => d.id !== documentId);

  if (filtered.length === docs.length) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  await storage.set(`rag:docs:${team.id}`, filtered);
  return NextResponse.json({ ok: true });
}
