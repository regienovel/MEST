import { NextRequest } from 'next/server';
import { storage } from '@/lib/storage';
import { ensureSeeded } from '@/lib/seed';
import {
  embedText, retrieveTopK, rerankChunks, generateGrounded,
  type RagDocument, type Chunk
} from '@/lib/rag';

export const maxDuration = 60;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  await ensureSeeded();

  const teamCookie = req.cookies.get('mest_team')?.value;
  if (!teamCookie) return new Response('Unauthorized', { status: 401 });
  let team: { id: string };
  try { team = JSON.parse(decodeURIComponent(teamCookie)); } catch { return new Response('Unauthorized', { status: 401 }); }

  const { query, strict = false } = await req.json();
  if (!query) return new Response('Missing query', { status: 400 });

  const docs = (await storage.get<RagDocument[]>(`rag:docs:${team.id}`)) || [];
  const embeddedDocs = docs.filter(d => d.embedded && d.embeddings);

  if (embeddedDocs.length === 0) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ stage: 'error', error: 'No embedded documents. Upload and embed documents first.' })}\n\n`));
        controller.close();
      },
    });
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
  }

  // Collect all chunks and embeddings
  const allChunks: Chunk[] = [];
  const allEmbeddings: number[][] = [];
  for (const doc of embeddedDocs) {
    for (let i = 0; i < doc.chunks.length; i++) {
      allChunks.push(doc.chunks[i]);
      allEmbeddings.push(doc.embeddings![i]);
    }
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (data: unknown) => {
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)); } catch {}
      };

      try {
        // Stage 1: Query
        const t1 = Date.now();
        emit({ stage: 'query', status: 'running', payload: { query } });
        await delay(200);
        emit({ stage: 'query', status: 'done', elapsed_ms: Date.now() - t1, payload: { query } });

        await delay(200);

        // Stage 2: Embed Query
        const t2 = Date.now();
        emit({ stage: 'embed_query', status: 'running' });
        const queryVector = await embedText(query);
        emit({ stage: 'embed_query', status: 'done', elapsed_ms: Date.now() - t2, payload: { dimensions: queryVector.length } });

        await delay(300);

        // Stage 3: Retrieve — wait 1500ms total so search wave animation completes
        const t3 = Date.now();
        emit({ stage: 'retrieve', status: 'running', payload: { totalChunks: allChunks.length } });
        const topK = retrieveTopK(queryVector, allChunks, allEmbeddings, 5);
        await delay(1500); // Allow search wave animation to complete on client
        emit({
          stage: 'retrieve', status: 'done', elapsed_ms: Date.now() - t3,
          payload: {
            results: topK.map(c => ({
              id: c.id,
              text: c.text.slice(0, 150),
              documentName: c.documentName,
              similarity: Math.round(c.similarity * 1000) / 1000,
            })),
          },
        });

        await delay(200);

        // Stage 4: Rerank
        const t4 = Date.now();
        emit({ stage: 'rerank', status: 'running' });
        const reranked = await rerankChunks(query, topK);
        emit({
          stage: 'rerank', status: 'done', elapsed_ms: Date.now() - t4,
          payload: {
            results: reranked.map(c => ({
              id: c.id,
              text: c.text.slice(0, 150),
              documentName: c.documentName,
              similarity: Math.round(c.similarity * 1000) / 1000,
              originalRank: c.originalRank,
              newRank: c.newRank,
            })),
          },
        });

        await delay(200);

        // Stage 5: Generate
        const t5 = Date.now();
        emit({ stage: 'generate', status: 'running' });
        let fullResponse = '';
        for await (const token of generateGrounded(query, reranked, strict)) {
          fullResponse += token;
          emit({ stage: 'generate', status: 'streaming', token });
        }
        emit({
          stage: 'generate', status: 'done', elapsed_ms: Date.now() - t5,
          payload: { response: fullResponse, strict },
        });

        emit({ done: true });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'RAG pipeline failed';
        emit({ stage: 'error', error: msg });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  });
}
