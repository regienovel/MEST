import { NextRequest } from 'next/server';
import { storage } from '@/lib/storage';
import { ensureSeeded } from '@/lib/seed';
import {
  embedText, retrieveTopK, rerankChunks, generateGrounded,
  type RagDocument, type Chunk
} from '@/lib/rag';
import { logApiCall } from '@/lib/health-metrics';
import { getTeamConfig, type RagConfig } from '@/lib/rag-config';

export const maxDuration = 60;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  await ensureSeeded();

  const teamCookie = req.cookies.get('mest_team')?.value;
  if (!teamCookie) return new Response('Unauthorized', { status: 401 });
  let team: { id: string };
  try { team = JSON.parse(decodeURIComponent(teamCookie)); } catch { return new Response('Unauthorized', { status: 401 }); }

  const body = await req.json();
  const { query, strict = false, config: configOverride, teamDocsOverride } = body;
  if (!query) return new Response('Missing query', { status: 400 });
  logApiCall(team.id, 'rag', `${strict ? '[strict] ' : ''}${query.slice(0, 60)}`, startTime, true).catch(() => {});

  // Use config from request body (for admin querying submitted models) or team's saved config
  const config: RagConfig = configOverride || await getTeamConfig(team.id);

  // Get documents — either from override (admin querying) or from team's storage
  let docs: RagDocument[];
  if (teamDocsOverride) {
    docs = teamDocsOverride;
  } else {
    docs = (await storage.get<RagDocument[]>(`rag:docs:${team.id}`)) || [];
  }
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

        // Stage 3: Retrieve with configurable top-K
        const t3 = Date.now();
        emit({ stage: 'retrieve', status: 'running', payload: { totalChunks: allChunks.length } });
        const topK = retrieveTopK(queryVector, allChunks, allEmbeddings, config.topK || 5);
        await delay(1500);
        emit({
          stage: 'retrieve', status: 'done', elapsed_ms: Date.now() - t3,
          payload: {
            results: topK.map(c => ({
              id: c.id, text: c.text.slice(0, 150), documentName: c.documentName,
              similarity: Math.round(c.similarity * 1000) / 1000,
            })),
          },
        });
        await delay(200);

        // Stage 4: Rerank (configurable on/off and model)
        let chunksForGeneration = topK;
        if (config.enableReranking) {
          const t4 = Date.now();
          emit({ stage: 'rerank', status: 'running' });
          try {
            chunksForGeneration = await rerankChunks(query, topK);
          } catch (rerankErr) {
            console.error('[rag-query] Rerank failed, using original order:', rerankErr);
            chunksForGeneration = topK;
          }
          emit({
            stage: 'rerank', status: 'done', elapsed_ms: Date.now() - t4,
            payload: {
              results: chunksForGeneration.map(c => ({
                id: c.id, text: c.text.slice(0, 150), documentName: c.documentName,
                similarity: Math.round(c.similarity * 1000) / 1000,
                originalRank: c.originalRank, newRank: c.newRank,
              })),
            },
          });
        } else {
          emit({ stage: 'rerank', status: 'done', elapsed_ms: 0, payload: { skipped: true, results: topK.map(c => ({
            id: c.id, text: c.text.slice(0, 150), documentName: c.documentName,
            similarity: Math.round(c.similarity * 1000) / 1000,
          })) } });
        }
        await delay(200);

        // Stage 5: Generate with configurable model, system prompt, temperature, threshold
        const t5 = Date.now();
        emit({ stage: 'generate', status: 'running' });
        let fullResponse = '';
        for await (const token of generateGrounded(query, chunksForGeneration, strict, config)) {
          fullResponse += token;
          emit({ stage: 'generate', status: 'streaming', token });
        }
        emit({
          stage: 'generate', status: 'done', elapsed_ms: Date.now() - t5,
          payload: { response: fullResponse, strict, config: { model: config.generationModel, threshold: config.strictThreshold } },
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
