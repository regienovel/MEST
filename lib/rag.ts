import { openai } from './openai';
import { anthropic } from './anthropic';

export interface Chunk {
  id: string;
  text: string;
  documentName: string;
  documentId: string;
  index: number;
}

export interface RankedChunk extends Chunk {
  similarity: number;
  rerankScore?: number;
  originalRank?: number;
  newRank?: number;
}

export interface RagDocument {
  id: string;
  name: string;
  text: string;
  charCount: number;
  chunkCount: number;
  chunks: Chunk[];
  embedded: boolean;
  embeddings?: number[][];
}

// --- Chunking strategies ---

export function chunkByParagraph(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 20);
}

export function chunkByFixedSize(text: string, size: number = 500, overlap: number = 50): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    chunks.push(text.slice(start, end).trim());
    start += size - overlap;
  }
  const filtered = chunks.filter(c => c.length > 20);
  console.log(`[rag-chunk] Fixed-size: ${filtered.length} chunks from ${text.length} chars (size=${size}, overlap=${overlap})`);
  filtered.forEach((c, i) => console.log(`[rag-chunk] Chunk ${i}: "${c.slice(0, 50)}..."`));
  return filtered;
}

export async function chunkBySemantic(text: string): Promise<string[]> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `Split the following document into 4-8 semantically coherent chunks based on natural topic boundaries (e.g. sections, subject changes). Return ONLY a JSON array of chunk strings. Preserve the original text exactly — do not paraphrase, summarize, or modify any text. Each chunk should be a meaningful section.

Document:
${text.slice(0, 8000)}`,
      }],
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';

    // Extract JSON array from response
    const match = responseText.match(/\[[\s\S]*\]/);
    if (match) {
      const parsed = JSON.parse(match[0]) as string[];
      if (Array.isArray(parsed) && parsed.length >= 2 && parsed.every(c => typeof c === 'string')) {
        return parsed.filter(c => c.trim().length > 20);
      }
    }

    console.warn('[rag] Semantic chunking LLM response did not parse as array, falling back to fixed-size');
  } catch (err) {
    console.warn('[rag] Semantic chunking LLM call failed, falling back to fixed-size:', err);
  }

  // Fallback: fixed-size chunking
  return chunkByFixedSize(text, 400, 40);
}

// --- Embedding ---

export async function embedText(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000),
  });
  return response.data[0].embedding;
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];
  // Batch up to 100 at a time
  for (let i = 0; i < texts.length; i += 100) {
    const batch = texts.slice(i, i + 100).map(t => t.slice(0, 8000));
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: batch,
    });
    results.push(...response.data.map(d => d.embedding));
  }
  return results;
}

// --- Similarity & Retrieval ---

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

export function retrieveTopK(queryVector: number[], chunks: Chunk[], embeddings: number[][], k: number = 5): RankedChunk[] {
  const scored = chunks.map((chunk, i) => ({
    ...chunk,
    similarity: cosineSimilarity(queryVector, embeddings[i]),
  }));
  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, k);
}

// --- Reranking via Claude ---

export async function rerankChunks(query: string, chunks: RankedChunk[]): Promise<RankedChunk[]> {
  const prompt = `You are a document relevance judge. Given a user query and a list of text chunks, rerank them from most to least relevant.

Query: "${query}"

Chunks:
${chunks.map((c, i) => `[${i + 1}] ${c.text.slice(0, 300)}`).join('\n\n')}

Return ONLY a JSON array of the chunk numbers in order of relevance, most relevant first. Example: [3, 1, 2, 5, 4]`;

  try {
    // Add timeout: if rerank takes more than 15s, skip it
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    });

    clearTimeout(timeout);

    const text = response.content[0].type === 'text' ? response.content[0].text : '[]';
    const match = text.match(/\[[\d,\s]+\]/);
    if (!match) {
      console.warn('[rag-rerank] Could not parse rerank response, returning original order');
      return chunks;
    }
    const order: number[] = JSON.parse(match[0]);

    return order.map((num, newIdx) => {
      const original = chunks[num - 1];
      if (!original) return null;
      return {
        ...original,
        rerankScore: 1 - newIdx * 0.1,
        originalRank: num - 1,
        newRank: newIdx,
      };
    }).filter(Boolean) as RankedChunk[];
  } catch (err) {
    console.error('[rag-rerank] Reranking failed, returning original order:', err);
    return chunks;
  }
}

// --- Grounded generation with citations ---

export const STRICT_THRESHOLD = 0.15;

interface GenerationConfig {
  strictThreshold?: number;
  generationModel?: 'gpt-4o' | 'claude-sonnet';
  systemPrompt?: string;
  refusalMessage?: string;
  temperature?: number;
  citationStyle?: 'inline' | 'footnote' | 'none';
}

export async function* generateGrounded(
  query: string,
  chunks: RankedChunk[],
  strict: boolean,
  config?: GenerationConfig
): AsyncGenerator<string> {
  const threshold = config?.strictThreshold ?? STRICT_THRESHOLD;
  const refusal = config?.refusalMessage ?? "I don't know — this answer is not in the source documents.";
  const model = config?.generationModel ?? 'gpt-4o';
  const temp = config?.temperature ?? 0.2;
  const customSystemPrompt = config?.systemPrompt;
  const citationStyle = config?.citationStyle ?? 'inline';

  // Check strict mode threshold
  if (strict) {
    const maxSimilarity = Math.max(...chunks.map(c => c.similarity));
    if (maxSimilarity < threshold) {
      yield refusal;
      return;
    }
  }

  // Use all chunks passed in (already filtered to top-K by retrieval)
  const topChunks = chunks;

  // Citation format
  const citationMarker = citationStyle === 'footnote' ? 'superscript numbers ¹ ² ³' : citationStyle === 'none' ? 'no citation markers' : 'inline brackets [1], [2], [3]';

  const contextBlock = topChunks
    .map((c, i) => `[Source ${i + 1}: ${c.documentName}]\n${c.text}`)
    .join('\n\n---\n\n');

  const systemPrompt = customSystemPrompt
    ? strict
      ? `${customSystemPrompt}\n\nCite sources using ${citationMarker}. If you cannot answer from the sources, respond with: "${refusal}". Do NOT make up information.`
      : `${customSystemPrompt}\n\nCite sources using ${citationMarker}. Answer the question using the sources provided. Extract the best answer you can, even from indirect or partial information.`
    : strict
      ? `You are a helpful assistant that ONLY answers based on the provided source documents. Cite sources using ${citationMarker}. If the sources do not contain relevant information, say: "${refusal}". Do NOT make up information.`
      : `You are a helpful assistant. Answer based on the provided source documents. Cite sources using ${citationMarker}. Extract the best answer you can even from indirect sources. If you must infer, say so.`;

  if (model === 'claude-sonnet') {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: `Sources:\n\n${contextBlock}\n\n---\n\nQuestion: ${query}` }],
      temperature: temp,
    });
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    yield text;
  } else {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Sources:\n\n${contextBlock}\n\n---\n\nQuestion: ${query}` },
      ],
      temperature: temp,
      max_tokens: 1024,
    });

    for await (const chunk of response) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) yield text;
    }
  }
}

// --- 2D projection for visualization ---

export function projectTo2D(embeddings: number[][]): Array<{ x: number; y: number }> {
  if (embeddings.length === 0) return [];

  // Use first 2 dimensions, normalized to 0-1
  const xs = embeddings.map(e => e[0] || 0);
  const ys = embeddings.map(e => e[1] || 0);

  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  return embeddings.map(e => ({
    x: ((e[0] || 0) - minX) / rangeX,
    y: ((e[1] || 0) - minY) / rangeY,
  }));
}
