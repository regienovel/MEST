# Spec 15 — RAG Lab Module

## Purpose
A retrieval-augmented generation playground that makes the entire RAG pipeline VISIBLE and ANIMATED. The cohort must SEE chunks being created, vectors being compared, top results being selected, and citations being pulled into the final response. RAG without visualization is magic; RAG with visualization is engineering.

## Required Dependencies (install BEFORE writing any code)

```bash
npm install framer-motion pdf-parse
```

- **framer-motion** — REQUIRED for the Pipeline Visualizer animations. Do not attempt this module with plain CSS transitions; the animations are too complex (sequenced stage activations, particle flows between stages, vector dots in 2D space, rerank shuffling, citation highlighting). Use `motion.div`, `AnimatePresence`, `motion.svg`, `layoutId`, and the `useAnimation` hook throughout.
- **pdf-parse** — for extracting text from uploaded PDF documents.

## Route
`app/studio/rag/page.tsx`

## UI — Three Tabs

### Tab 1: Documents
- File uploader (drop zone) accepting `.txt`, `.md`, `.pdf` (extract text via pdf-parse)
- Pre-loaded documents per team based on their assigned scenario from `seed/scenarios.json`
- Document list with filename, character count, chunk count
- Delete button per document
- Chunking strategy selector: paragraph / fixed-size (with size + overlap inputs) / semantic
- "Process documents" button → triggers chunking + embedding pipeline

### Tab 2: Pipeline Visualizer (THE STAR FEATURE)

This is the most important UI element of the entire Day 2 build. A horizontal flow diagram with 6 stages, each animated using Framer Motion as it executes:

```
[1. Query] → [2. Embed Query] → [3. Search Vectors] → [4. Top-K] → [5. Rerank] → [6. Generate]
```

**Visual style:**
- Background: dark blue (`#0F2F44`)
- Stage cards: white with gold (`#B8860B`) accents when active, teal (`#0E6B5C`) when complete, grey when idle
- Connecting arrows between stages: animate from grey to gold as data flows through
- All transitions: 400ms ease-out, staggered by 150ms between stages
- Use Framer Motion `layoutId` for smooth element transitions between stages

**Stage-by-stage animation requirements:**

**Stage 1 — Query.** The query text appears in a card with a gold border that pulses once. Use `motion.div` with `initial={{ opacity: 0, y: 20 }}` and `animate={{ opacity: 1, y: 0 }}`.

**Stage 2 — Embed Query.** Animated particles fly from the query card into a small vector cloud (12-20 `motion.circle` elements following bezier paths). The cloud forms a tight rotating cluster. Show "1536 dimensions" as a label. Total: ~1 second.

**Stage 3 — Search Vectors.** This is the key visualization. A 2D scatter plot (`motion.svg`, ~400x300px) showing all document chunks as floating dots — use the first two dimensions of each embedding, normalized to canvas. Each chunk dot has a hover tooltip showing chunk preview. The query vector appears as a glowing gold dot (drop shadow + pulsing animation `animate={{ scale: [1, 1.2, 1] }}`). Animated SVG lines (`<motion.line>` with `pathLength` from 0 to 1) draw from the query dot to the 5 nearest chunk dots. The 5 nearest dots turn gold.

**Stage 4 — Top-K.** A list of the top 5 chunks appears on the right with similarity percentages. Use `AnimatePresence` so each list item slides in from the right with 80ms stagger. Each item: rank, similarity %, chunk preview (first 100 chars), source document name.

**Stage 5 — Rerank.** Top 5 are passed to Claude Sonnet with a reranking prompt. CRITICAL ANIMATION: when rerank result returns, list items physically reorder themselves using Framer Motion's `layout` prop on each list item. The animation should be obvious — chunks visibly swap positions over ~600ms. Add a small "↑" or "↓" indicator showing how far each item moved.

**Stage 6 — Generate.** Top 3 reranked chunks plus query passed to GPT-4o with strict instructions to cite sources using markdown footnote syntax `[1]`, `[2]`, `[3]`. Response streams in token by token (use existing SSE chat pattern). Each citation marker is rendered as a gold pill that, on hover, highlights the corresponding chunk in the Top-K list AND draws an animated line back to the source dot in the Stage 3 scatter plot.

**Each stage card displays:**
- Stage number and name
- Status indicator with icon (idle / running / done / error) — swap with `AnimatePresence`
- Time elapsed (ms) — counts up live during execution
- Token count where applicable
- "Expand" button to see raw data at that stage in a slide-out drawer

### Tab 3: Strict Mode Test
- Toggle: "Strict mode ON / OFF"
- When ON, the system MUST refuse to answer if no chunks have similarity > 0.7. Returns: *"I don't know — this answer is not in the source documents."*
- When OFF, the system answers anyway (and probably hallucinates)
- Side-by-side comparison view: same query run with strict ON vs OFF, showing the difference. THIS IS THE TEACHING MOMENT — trainer toggles this in the live demo
- Both columns animate in simultaneously when "Compare" is clicked, with ✓ or ✗ markers

## API Routes

### `POST /api/rag/upload`
Body: `FormData` with file. Extracts text (pdf-parse for PDFs), creates chunks using selected strategy, stores under team key in Redis.

### `POST /api/rag/embed`
Body: `{ documentId }`. Embeds chunks using OpenAI `text-embedding-3-small` (1536 dimensions). Stores vectors in Redis as JSON arrays. Batch up to 100 chunks per API call.

### `POST /api/rag/query` (SSE streaming)
Body: `{ query, strict, chunkStrategy }`. Streams Server-Sent Events for each pipeline stage:
```
event: stage
data: { stage: 1, status: "running", payload: {...} }

event: stage
data: { stage: 1, status: "done", elapsed_ms: 12, payload: {...} }
```
Stages: `query`, `embed_query`, `retrieve`, `rerank`, `generate`. The `generate` stage streams tokens. **Critical:** emit each stage event with at least 200ms delay between them so animations have time to play out — even if computation is faster.

### `POST /api/rag/visualize`
Returns 2D projection of all chunk embeddings for the current team. Use first 2 dimensions of each embedding (proper PCA is overkill — visualization is illustrative). Normalize to 0-1 range.

## Library Code: `lib/rag.ts`

```typescript
export function chunkByParagraph(text: string): string[]
export function chunkByFixedSize(text: string, size: number, overlap: number): string[]
export async function chunkBySemantic(text: string): Promise<string[]>

export async function embedText(text: string): Promise<number[]>
export async function embedBatch(texts: string[]): Promise<number[][]>

export function cosineSimilarity(a: number[], b: number[]): number
export function retrieveTopK(queryVector: number[], chunks: Chunk[], k: number): RankedChunk[]

export async function rerankChunks(query: string, chunks: RankedChunk[]): Promise<RankedChunk[]>

export async function* generateGrounded(
  query: string,
  chunks: RankedChunk[],
  strict: boolean
): AsyncIterable<string>
```

## Pre-loaded Documents per Team

For each of the 11 scenarios in `seed/scenarios.json`, include 3-5 source documents in `seed/rag-documents/<scenario-id>/`. If you cannot find authentic source material, generate plausible documents (clearly marked as illustrative) of similar length and style. The teaching value is in the RAG technique, not absolute authenticity.

Each team's RAG Lab is pre-loaded with their assigned scenario's documents on first login. Their afternoon sprint is to make their RAG system answer questions about their scenario WITHOUT hallucinating.

## Success Criteria
1. Framer Motion is installed and used throughout the Pipeline Visualizer
2. All 6 stages animate smoothly with the timing described above
3. The vector space visualization shows real chunks as floating dots, the query as a glowing pulsing gold dot, with animated lines to nearest neighbors
4. Citations in the generated response are clickable and highlight the source chunk in BOTH the Top-K list AND the Stage 3 scatter plot
5. Strict mode demonstrably refuses to answer out-of-scope questions with: *"I don't know — this answer is not in the source documents."*
6. Reranking visibly reorders the result list with smooth Framer Motion `layout` animation
7. The whole thing works on a projector at 1920×1080 — test at that resolution
