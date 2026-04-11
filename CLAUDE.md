# MEST AI Studio — Project Guide

## What This Is

**MEST AI Studio** is a bilingual (EN/FR) AI experimentation platform for West African entrepreneurs-in-training (EITs). It's deployed on Vercel at `mest-nine.vercel.app`.

## Current State: LIVE & IN USE — Day 2 Modules In Progress

Phases 0-10 are complete and deployed. Day 2 of the training (Monday) requires three new modules — RAG Lab, Health Dashboard, and Versioning & Rollback — defined in specs 15-17. These build ON TOP of the existing platform; do not modify or replace existing modules.

See `BUILD_STATUS.md` for full details.

## Architecture (Post-Deployment)

### Stack
- **Framework:** Next.js 14.2 (App Router), TypeScript, Tailwind CSS 3
- **AI:** OpenAI SDK (GPT-4o, Whisper, TTS, text-embedding-3-small), Anthropic SDK (Claude Sonnet)
- **Storage:** Upstash Redis via `@upstash/redis` (persistent KV)
- **Auth:** Cookie-based (`mest_session`, `mest_team`, `mest_admin`)
- **Hosting:** Vercel Pro

### Key Architecture Decisions
- **UI components:** shadcn/ui v4 components (Select, Dialog) were replaced with native `<select>` and a custom `Modal` component because shadcn v4 uses `@base-ui/react` which is incompatible with Tailwind CSS v3
- **Auth:** Team info stored in `mest_team` cookie (JSON) so server components work across Vercel serverless instances without shared storage
- **Login:** Validates against `seed/teams.json` directly (no Redis dependency for authentication)
- **Static data:** Teams, templates, default config, and trust scenarios read from seed JSON files at build time
- **Persistent data:** Gallery items, chains, activity, XP, usage, admin config, RAG documents, embeddings, version history, health metrics stored in Upstash Redis
- **SSE streaming:** Chat, vision, chain execution, and RAG pipeline use Server-Sent Events with chunk buffering (split on `\n\n` boundaries to handle large base64 payloads)
- **Function timeouts:** `maxDuration=60` on chat/vision/chain/rag routes, `maxDuration=30` on transcribe/tts/embed

### File Structure (Day 2 additions in **bold**)
```
app/
  studio/
    chat/page.tsx
    voice/page.tsx
    vision/page.tsx
    chain/page.tsx
    gallery/page.tsx
    **rag/page.tsx              ← NEW: RAG Lab**
    **health/page.tsx           ← NEW: Health Dashboard**
  api/
    chat/route.ts
    transcribe/route.ts
    vision/route.ts
    chain/run/route.ts
    **rag/upload/route.ts       ← NEW: doc upload + chunking**
    **rag/embed/route.ts        ← NEW: embed chunks**
    **rag/query/route.ts        ← NEW: retrieve + rerank + generate**
    **rag/visualize/route.ts    ← NEW: SSE pipeline visualization**
    **health/metrics/route.ts   ← NEW: health metrics**
    **versions/route.ts         ← NEW: version history + rollback**
lib/
  storage.ts
  **rag.ts                      ← NEW: chunking, embedding, retrieval, reranking**
  **versions.ts                 ← NEW: snapshot + rollback helpers**
  **health-metrics.ts           ← NEW: latency / error tracking**
seed/
  teams.json
  templates.json
  trust-failures.json
  **rag-documents/              ← NEW: 11 folders, one per scenario**
  **scenarios.json              ← NEW: 11 trust failure scenarios + meta**
```

## Day 2 Modules — The Trust Modules

Three new modules built on top of the existing platform for the Day 2 (Trust) training session.

### Phase 11 — RAG Lab
See `specs/15-rag-lab.md`. A retrieval-augmented generation playground showing the full pipeline visually: document ingestion → chunking → embedding → retrieval → reranking → grounded generation with citations. Includes a live "Pipeline Visualizer" mode that animates each stage so the cohort can SEE what RAG actually does.

### Phase 12 — Health Dashboard
See `specs/16-health-dashboard.md`. Per-team health monitoring page showing: total requests today, average latency, error rate, last 20 calls with status, failure rate by input type, and a public scorecard for the five trust properties.

### Phase 13 — Versioning & Rollback
See `specs/17-versioning-rollback.md`. Every save (chain or RAG config) creates a versioned snapshot. One-click rollback to any prior version. Visible version history with timestamps and diff summaries.

### Build Order for Day 2
Build the modules in this order: RAG Lab first (most foundational), then Health Dashboard, then Versioning. The Pipeline Visualizer inside RAG Lab is the highest-priority polish item — without it, the whole module loses its teaching value.

## Teams (11 + Admin)

| Team | Password |
|------|----------|
| Ghana Jollof ⭐ | `jollof2026` |
| Waakye | `waakye2026` |
| Thiéboudienne | `thieb2026` |
| Fufu & Light Soup | `fufu2026` |
| Egusi Soup | `egusi2026` |
| Kelewele | `kelewele2026` |
| Attiéké | `attieke2026` |
| Suya | `suya2026` |
| Banku & Tilapia | `banku2026` |
| Mafé | `mafe2026` |
| Chinchinga | `chinchinga2026` |
| Admin | `mest-operator-2026` |

## Vercel Environment Variables

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | GPT-4o, Whisper, TTS, text-embedding-3-small |
| `ANTHROPIC_API_KEY` | Claude Sonnet (also used as reranker) |
| `ADMIN_PASSWORD` | Admin panel access |
| `KV_REST_API_URL` | Upstash Redis (auto-set) |
| `KV_REST_API_TOKEN` | Upstash Redis (auto-set) |

## When Making Changes

### Important patterns to follow:
1. **Never use shadcn Select or Dialog** — use `NativeSelect` and `Modal`
2. **API routes read team from `mest_team` cookie** — not from storage sessions
3. **Static data (teams, templates, scenarios) comes from seed files** — not from Redis
4. **Add `export const maxDuration = 60` to any new long-running API routes**
5. **SSE parsers must buffer chunks and split on `\n\n`** — to handle large payloads
6. **Use `!!value &&` instead of `value &&` in JSX** when value is typed as `unknown`
7. **All user-facing strings must be in both EN and FR** — add to `lib/i18n.ts`
8. **Day 2 modules must NOT modify existing modules** — they live in their own routes and lib files
9. **Every RAG response MUST include citations** — no exceptions, this is the whole point
10. **Health metrics should be logged from EVERY API route** — wrap calls in `withHealthMetrics()` helper
