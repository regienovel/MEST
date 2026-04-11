import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { ensureSeeded } from '@/lib/seed';
import type { RagDocument } from '@/lib/rag';

export async function GET(req: NextRequest) {
  await ensureSeeded();

  const teamCookie = req.cookies.get('mest_team')?.value;
  if (!teamCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let team: { id: string };
  try { team = JSON.parse(decodeURIComponent(teamCookie)); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const docs = (await storage.get<RagDocument[]>(`rag:docs:${team.id}`)) || [];

  // Return metadata only (not full text or embeddings — too large)
  const documents = docs.map(d => ({
    id: d.id,
    name: d.name,
    charCount: d.charCount,
    chunkCount: d.chunkCount,
    embedded: d.embedded,
  }));

  return NextResponse.json({ documents });
}
