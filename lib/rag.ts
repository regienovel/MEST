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
  return chunks.filter(c => c.length > 20);
}

export async function chunkBySemantic(text: string): Promise<string[]> {
  // Simplified semantic chunking: split on paragraph boundaries,
  // then merge small paragraphs into larger chunks
  const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    if (current.length + para.length > 800 && current.length > 100) {
      chunks.push(current.trim());
      current = para;
    } else {
      current += (current ? '\n\n' : '') + para;
    }
  }
  if (current.trim().length > 20) chunks.push(current.trim());

  return chunks;
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

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '[]';
  try {
    const match = text.match(/\[[\d,\s]+\]/);
    if (!match) return chunks;
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
  } catch {
    return chunks;
  }
}

// --- Grounded generation with citations ---

export async function* generateGrounded(
  query: string,
  chunks: RankedChunk[],
  strict: boolean
): AsyncGenerator<string> {
  // Check strict mode threshold
  if (strict) {
    const maxSimilarity = Math.max(...chunks.map(c => c.similarity));
    if (maxSimilarity < 0.7) {
      yield "I don't know — this answer is not in the source documents.";
      return;
    }
  }

  const topChunks = chunks.slice(0, 3);
  const contextBlock = topChunks
    .map((c, i) => `[Source ${i + 1}: ${c.documentName}]\n${c.text}`)
    .join('\n\n---\n\n');

  const systemPrompt = `You are a helpful assistant that ONLY answers based on the provided source documents. You MUST cite your sources using footnote markers [1], [2], [3] corresponding to the source numbers. If the sources do not contain enough information to answer, say "I don't know — this answer is not in the source documents." Do NOT make up information.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    stream: true,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Sources:\n\n${contextBlock}\n\n---\n\nQuestion: ${query}` },
    ],
    temperature: 0.3,
    max_tokens: 1024,
  });

  for await (const chunk of response) {
    const text = chunk.choices[0]?.delta?.content;
    if (text) yield text;
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
