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
  const docToDelete = docs.find(d => d.id === documentId);

  if (!docToDelete) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  // Remove document from list (this removes text, chunks, and embeddings since they're all stored in the doc object)
  const filtered = docs.filter(d => d.id !== documentId);
  await storage.set(`rag:docs:${team.id}`, filtered);

  // Also clean up any standalone keys that might reference this document
  await storage.delete(`rag:chunks:${team.id}:${documentId}`);
  await storage.delete(`rag:embeddings:${team.id}:${documentId}`);
  await storage.delete(`rag:doc:${team.id}:${documentId}`);

  console.log(`[rag-delete] Deleted document ${documentId} (${docToDelete.name}) for team ${team.id}. ${docToDelete.chunkCount} chunks removed. Was embedded: ${docToDelete.embedded}`);

  return NextResponse.json({ ok: true, deleted: { name: docToDelete.name, chunks: docToDelete.chunkCount, wasEmbedded: docToDelete.embedded } });
}
