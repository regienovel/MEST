import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { ensureSeeded } from '@/lib/seed';
import { embedBatch, type RagDocument } from '@/lib/rag';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  await ensureSeeded();

  const teamCookie = req.cookies.get('mest_team')?.value;
  if (!teamCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let team: { id: string };
  try { team = JSON.parse(decodeURIComponent(teamCookie)); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const { documentId } = await req.json();
  const docs = (await storage.get<RagDocument[]>(`rag:docs:${team.id}`)) || [];
  const docIndex = docs.findIndex(d => d.id === documentId);
  if (docIndex === -1) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

  const doc = docs[docIndex];
  const chunkTexts = doc.chunks.map(c => c.text);

  try {
    const embeddings = await embedBatch(chunkTexts);
    doc.embeddings = embeddings;
    doc.embedded = true;
    docs[docIndex] = doc;
    await storage.set(`rag:docs:${team.id}`, docs);

    // Return chunk previews and sample vector values for visualization
    const chunkPreviews = doc.chunks.map((c, i) => ({
      index: i,
      preview: c.text.slice(0, 120),
      charCount: c.text.length,
      sampleVector: embeddings[i].slice(0, 8).map(v => Math.round(v * 1000) / 1000),
    }));

    return NextResponse.json({
      ok: true,
      chunkCount: chunkTexts.length,
      dimensions: embeddings[0]?.length || 0,
      chunkPreviews,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Embedding failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
