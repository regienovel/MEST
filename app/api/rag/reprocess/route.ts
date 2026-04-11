import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { ensureSeeded } from '@/lib/seed';
import { chunkByParagraph, chunkByFixedSize, chunkBySemantic, type Chunk, type RagDocument } from '@/lib/rag';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  await ensureSeeded();

  const teamCookie = req.cookies.get('mest_team')?.value;
  if (!teamCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let team: { id: string };
  try { team = JSON.parse(decodeURIComponent(teamCookie)); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const { documentId, strategy, chunkSize = 500, overlap = 50 } = await req.json();
  const docs = (await storage.get<RagDocument[]>(`rag:docs:${team.id}`)) || [];
  const docIndex = docs.findIndex(d => d.id === documentId);
  if (docIndex === -1) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

  const doc = docs[docIndex];

  // Re-chunk with new strategy
  let chunkTexts: string[];
  switch (strategy) {
    case 'fixed':
      chunkTexts = chunkByFixedSize(doc.text, chunkSize, overlap);
      break;
    case 'semantic':
      chunkTexts = await chunkBySemantic(doc.text);
      break;
    default:
      chunkTexts = chunkByParagraph(doc.text);
  }

  const chunks: Chunk[] = chunkTexts.map((t, i) => ({
    id: `${doc.id}-chunk-${i}`,
    text: t,
    documentName: doc.name,
    documentId: doc.id,
    index: i,
  }));

  doc.chunks = chunks;
  doc.chunkCount = chunks.length;
  doc.embedded = false;
  doc.embeddings = undefined;

  docs[docIndex] = doc;
  await storage.set(`rag:docs:${team.id}`, docs);

  return NextResponse.json({ ok: true, chunkCount: chunks.length });
}
