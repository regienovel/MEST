# Day 2 Build — Claude Code Kickoff Prompt

Copy and paste this entire prompt into Claude Code in your existing MEST AI Studio project folder.

---

You are continuing work on the MEST AI Studio project. The platform is already live and deployed at mest-nine.vercel.app. Phases 0-10 are complete. You are now building Phases 11-13 — the Day 2 Trust Modules — for a training session happening Monday morning.

DO NOT modify existing modules (Chat Lab, Voice Lab, Vision Lab, Chain Builder, Gallery, Admin Panel). These are working in production. Your job is to ADD new modules on top.

## Step 1 — Read the context

Read these files in this exact order:
1. `CLAUDE.md` — the updated project guide with the Day 2 modules section
2. `BUILD_STATUS.md` — current build status with the new modules listed
3. `specs/15-rag-lab.md` — the RAG Lab module spec (READ CAREFULLY — this includes the Pipeline Visualizer which is the highest-priority polish item)
4. `specs/16-health-dashboard.md` — the Health Dashboard spec
5. `specs/17-versioning-rollback.md` — the Versioning & Rollback spec
6. `seed/scenarios.json` — the 11 trust failure scenarios

## Step 2 — Build in this order

**Phase 11: RAG Lab first.** This is the centrepiece of the day. Build it to completion before moving on. Specifically:

1. Add `lib/rag.ts` with chunking strategies, embedding (use OpenAI text-embedding-3-small), cosine similarity, retrieval, reranking via Claude, and grounded generation with citations
2. Add the four API routes: `/api/rag/upload`, `/api/rag/embed`, `/api/rag/query` (SSE streaming), `/api/rag/visualize`
3. Add `app/studio/rag/page.tsx` with the three tabs: Documents, Pipeline Visualizer, Strict Mode Test
4. **The Pipeline Visualizer is the most important UI element of the entire build.** It must animate smoothly through all 6 stages with the visual style described in the spec. Use Framer Motion if available; otherwise CSS transitions. Show the vector space visualization with chunks as floating dots and the query as a glowing gold dot. Show citations clickable in the final response.
5. Pre-load each team's RAG Lab with their assigned scenario's documents from `seed/rag-documents/<scenario-id>/`

**Phase 12: Health Dashboard.** Build the dashboard page, the metrics API, and a `withHealthMetrics()` wrapper that can be retroactively applied to existing API routes WITHOUT modifying them substantively (use middleware-style logging). Wire up the trust scorecard with Test Now buttons.

**Phase 13: Versioning & Rollback.** Add `lib/versions.ts` and the versions API. Wire it into Chain Builder and RAG Lab via the History panel slide-in. Critical: rollback must NEVER destroy current state — it saves the current state as a new version FIRST, then restores the older one.

## Step 3 — Bilingual everything

Every user-facing string must be added to `lib/i18n.ts` in both English and French. No exceptions.

## Step 4 — Test, build, deploy

After each phase:
1. Run `npx tsc --noEmit` to check TypeScript
2. Run `npx next build` to verify production build
3. Test the new module manually in dev mode
4. Commit and push to main: `git add -A && git commit -m "Phase X: <description>" && git push origin master:main`
5. Wait for Vercel deployment and verify on the live URL

## Step 5 — When complete

Update `BUILD_STATUS.md` to mark Phases 11-13 as complete. Write a short summary of what was built and any issues encountered. Make sure all 11 teams can log in and access their pre-loaded RAG documents.

## Critical reminders

- Ghana has intermittent internet. If a `git push` fails, retry every 2 minutes for up to 30 minutes. Log failures and continue working.
- Use the existing patterns in the codebase. Read existing files in `lib/` and `app/api/` before writing new ones.
- Native `<select>` and custom `Modal` ONLY — never shadcn Select or Dialog.
- API routes read team from `mest_team` cookie.
- All long-running routes need `export const maxDuration = 60`.
- SSE parsers must split on `\n\n`.
- The cohort training session starts Monday at 09:00 GMT. Everything must be deployed and tested by Sunday evening.

Begin by reading CLAUDE.md and the three new specs. Then start Phase 11. Make all decisions autonomously. Do not ask me questions. Build.
