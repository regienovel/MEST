# MEST AI Studio — Build Status

## ✅ Phases 0-10 COMPLETE — Deployed on Vercel
## 🚧 Phases 11-13 IN PROGRESS — Day 2 Trust Modules

**Live URL:** mest-nine.vercel.app

---

## Day 2 Modules (Phases 11-13)

Three new modules built on top of the existing platform for the Day 2 (Trust) training session on Monday.

### Phase 11 — RAG Lab (`specs/15-rag-lab.md`)
A retrieval-augmented generation playground with an animated Pipeline Visualizer that shows the cohort what RAG actually does step by step: document ingestion → chunking → embedding → vector search → reranking → grounded generation with citations. Each of the 11 teams gets pre-loaded source documents for their assigned trust failure scenario.

**Status:** Spec written. Awaiting Claude Code build.

### Phase 12 — Health Dashboard (`specs/16-health-dashboard.md`)
Per-team operational health view with four big stat cards (requests, latency, error rate, active modules), a public Trust Scorecard for the five trust properties, and a last-20-calls table with full traceable run details on expand. Demonstrates "safe operation under adversarial prompts" and "traceable runs (inputs, tool calls, outputs, versions)" — the engineering outcomes for Day 2.

**Status:** Spec written. Awaiting Claude Code build.

### Phase 13 — Versioning & Rollback (`specs/17-versioning-rollback.md`)
Every save (chain, RAG config, prompt) creates an immutable versioned snapshot. One-click rollback to any prior version. Rollback NEVER destroys current state — it saves current as a new version first, then restores the older one. Visible version history with timestamps and human-readable diff summaries.

**Status:** Spec written. Awaiting Claude Code build.

### Build Order
1. RAG Lab first (most foundational, biggest visual payoff, the centerpiece of the day)
2. Health Dashboard second (wraps existing routes, doesn't require new UI patterns)
3. Versioning third (cross-cutting, can be added incrementally)

### New Environment Variables
None — uses existing `OPENAI_API_KEY` (for embeddings via `text-embedding-3-small`) and `ANTHROPIC_API_KEY` (for reranking via Claude Sonnet).

### New Seed Data
- `seed/scenarios.json` — 11 trust failure scenarios with metadata
- `seed/rag-documents/<scenario-id>/` — 3-5 source documents per scenario for pre-loading into team RAG Labs

### Critical Visual Requirement
The RAG Lab Pipeline Visualizer is the highest-priority polish item of the entire Day 2 build. Without smooth animations across all 6 pipeline stages, the module loses its teaching value. Use Framer Motion if available; otherwise plain CSS transitions on state changes. Vector space visualization should show chunks as floating dots in 2D space, with the query as a glowing gold dot, and lines animating to the nearest neighbors.

---

## How to Run Locally

```bash
npm install
# Ensure .env.local exists with all keys
npm run dev
# Open http://localhost:3000
```

## Vercel Environment Variables Required

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | GPT-4o, Whisper, TTS, text-embedding-3-small (NEW) |
| `ANTHROPIC_API_KEY` | Claude Sonnet (also reranker for RAG, NEW use) |
| `ADMIN_PASSWORD` | Admin panel access |
| `KV_REST_API_URL` | Upstash Redis (auto-set) |
| `KV_REST_API_TOKEN` | Upstash Redis (auto-set) |

## Team Login Credentials (11 teams + Admin)

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
| **Admin** | `mest-operator-2026` |

## Existing Modules (Phases 0-10) — UNCHANGED

Chat Lab, Voice Lab, Vision Lab, Chain Builder, Gallery, Admin Panel — all live and working. Day 2 modules add to the platform without modifying these.

## Known Limitations (Existing)
- Chain executor runs blocks sequentially (not parallel)
- Gallery doesn't store actual images (only metadata + image count)
- Whisper may misdetect West African languages (Twi → Yoruba, etc.)
- OpenAI TTS doesn't officially support Twi
- No WebSocket support (uses polling for real-time features)
