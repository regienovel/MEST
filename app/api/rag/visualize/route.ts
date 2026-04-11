import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { ensureSeeded } from '@/lib/seed';
import { projectTo2D, type RagDocument } from '@/lib/rag';

export async function POST(req: NextRequest) {
  await ensureSeeded();

  const teamCookie = req.cookies.get('mest_team')?.value;
  if (!teamCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let team: { id: string };
  try { team = JSON.parse(decodeURIComponent(teamCookie)); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const docs = (await storage.get<RagDocument[]>(`rag:docs:${team.id}`)) || [];
  const embeddedDocs = docs.filter(d => d.embedded && d.embeddings);

  const allChunks: Array<{ id: string; text: string; documentName: string }> = [];
  const allEmbeddings: number[][] = [];

  for (const doc of embeddedDocs) {
    for (let i = 0; i < doc.chunks.length; i++) {
      allChunks.push({
        id: doc.chunks[i].id,
        text: doc.chunks[i].text.slice(0, 100),
        documentName: doc.name,
      });
      allEmbeddings.push(doc.embeddings![i]);
    }
  }

  const points = projectTo2D(allEmbeddings);

  return NextResponse.json({
    chunks: allChunks.map((c, i) => ({
      ...c,
      x: points[i]?.x ?? 0,
      y: points[i]?.y ?? 0,
    })),
  });
}
