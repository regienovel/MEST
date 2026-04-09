# 14 — Build Order (The Master Sequence)

**Follow this exactly. Do not skip phases. Do not build in parallel. Each phase is a checkpoint.**

After each phase:
1. Verify the phase's success criteria
2. Update `/BUILD_STATUS.md` with completed items
3. Commit with the specified message
4. Move to the next phase

If a session runs out of context, a new session can resume by reading `CLAUDE.md`, `BUILD_STATUS.md`, and the current phase's spec.

---

## Phase 0 — Foundation

**Spec:** `/specs/01-stack-and-setup.md`

**Goals:** Next.js app scaffolded, dependencies installed, folder structure created, deployable skeleton.

**Tasks:**
1. Read `/specs/00-overview.md` and `/specs/01-stack-and-setup.md`
2. Run `create-next-app` with exact flags from spec
3. Install all dependencies listed in spec
4. Initialize shadcn/ui with `-d` flag
5. Install initial shadcn components
6. Create folder structure (all module routes, API routes, components, lib)
7. Create `.env.example` with placeholders
8. Update `.gitignore` with `/.data/` and env files
9. Verify dev server starts with `npm run dev`
10. Verify TypeScript compilation with `npx tsc --noEmit`
11. Create initial `/BUILD_STATUS.md`
12. Commit: `chore: phase 0 - initial scaffold`

**Success check:** `npm run dev` starts without errors. Default Next.js page loads at http://localhost:3000.

---

## Phase 1 — Design System & Base Layout

**Spec:** `/specs/02-design-system.md` and `/specs/11-i18n-strings.md`

**Goals:** MEST theme applied, base components styled, i18n working, wordmark in place.

**Tasks:**
1. Read the two specs above
2. Add color tokens to `tailwind.config.ts`
3. Add CSS variables to `app/globals.css`
4. Install fonts in `app/layout.tsx` (Inter + Instrument Serif)
5. Add font variables to Tailwind config
6. Update `app/layout.tsx` with base metadata, font classes, and I18nProvider wrapper
7. Create `/lib/i18n.ts` with the full dictionary
8. Create `/lib/i18n-context.tsx` with the provider and hook
9. Create `/components/studio/wordmark.tsx` using the typography-only approach
10. Create `/components/studio/language-toggle.tsx`
11. Create a basic test page at `/app/page.tsx` showing wordmark + language toggle + "Hello" text to verify everything works
12. Commit: `feat: phase 1 - design system and i18n`

**Success check:** Visiting `/` shows the wordmark in MEST colors with Instrument Serif heading and a working EN/FR language toggle.

---

## Phase 2 — Auth & Storage

**Spec:** `/specs/03-data-model.md` and `/specs/04-auth-and-teams.md`

**Goals:** File-based storage working, teams seeded, login/logout functional, middleware protecting routes.

**Tasks:**
1. Read the two specs above
2. Create `/lib/types.ts` with all TypeScript interfaces
3. Create `/lib/storage.ts` with the file-based adapter (exact code from spec)
4. Create `/lib/seed.ts` with `ensureSeeded()` function
5. Create `/lib/auth.ts` with `getCurrentTeam()`, `isAdmin()`, `requireTeam()` helpers
6. Build `/app/page.tsx` as the full landing page (not just the test from Phase 1): hero + login form
7. Build `/app/api/auth/login/route.ts`
8. Build `/app/api/auth/logout/route.ts`
9. Create `/middleware.ts` to protect `/studio/*` and `/admin/*`
10. Build `/app/studio/page.tsx` as a minimal placeholder showing "Welcome {team name}, XP: {xp}" and a logout button
11. Test: log in as one of the seed teams, land on studio page, log out
12. Commit: `feat: phase 2 - auth and storage`

**Success check:** Can log in with a team from seed data, lands on `/studio`, can log out.

---

## Phase 3 — Studio Home Dashboard

**Spec:** `/specs/02-design-system.md` (module cards section) + `/specs/00-overview.md` (module list)

**Goals:** Dashboard with top bar, module cards, activity feed, daily challenge banner.

**Tasks:**
1. Build `/components/studio/top-bar.tsx`: wordmark, team badge, XP counter, language toggle, logout button
2. Build `/components/studio/module-card.tsx`: icon, title, description, colored border, hover lift
3. Build `/components/studio/activity-feed.tsx`: list of recent actions, polls `/api/activity` every 10s
4. Build `/components/studio/daily-challenge.tsx`: banner card reading from config
5. Build `/components/studio/broadcast-banner.tsx`: shows active broadcast message if present
6. Update `/app/studio/page.tsx` to use all of the above components
7. Create `/app/api/activity/route.ts` that returns recent activity events
8. Create `/app/api/config/route.ts` that returns current config (daily challenge, enabled modules, broadcast)
9. Helper: create `/lib/activity.ts` with `logActivity(type, teamId, teamName, data)` that appends to the activity feed
10. Commit: `feat: phase 3 - studio dashboard`

**Success check:** After login, studio home shows a polished dashboard with 5 module cards (all leading to placeholder pages for now), a daily challenge banner, and an empty activity feed.

---

## Phase 4 — Chat Lab (THE FLAGSHIP)

**Spec:** `/specs/05-module-chat-lab.md`

**Goals:** Working chat with GPT-4o, Claude, and Compare Mode. Image upload. Save to Gallery. Export.

**Tasks:**
1. Read the chat lab spec carefully
2. Create `/lib/openai.ts` with a configured OpenAI client (reads from env)
3. Create `/lib/anthropic.ts` with a configured Anthropic client
4. Create `/lib/rate-limit.ts` with `checkRateLimit(teamId)` returning `{ allowed: boolean, remaining: number }`
5. Create `/lib/pricing.ts` with cost constants
6. Create `/lib/usage.ts` with `recordUsage(teamId, tokens, model)` function
7. Build `/app/api/chat/route.ts` with streaming support for gpt-4o, claude-sonnet, and both
8. Build `/components/studio/chat-lab.tsx` as the main client component
9. Build supporting components: `chat-message.tsx`, `chat-input.tsx`, `model-toggle.tsx`, `system-prompt-panel.tsx`
10. Build `/lib/hooks/use-chat-stream.ts` for client-side streaming
11. Build `/app/studio/chat/page.tsx` server component wrapper
12. Build save-to-gallery modal
13. Build export-to-markdown function
14. Handle errors gracefully (rate limits, model failures, etc.)
15. Test all three modes end-to-end
16. Commit: `feat: phase 4 - chat lab with compare mode`

**Success check:** Can send messages in single or compare mode, upload images, save to gallery, export as markdown.

---

## Phase 5 — Voice Lab

**Spec:** `/specs/06-module-voice-lab.md`

**Goals:** Record audio, transcribe with Whisper, get AI response, speak it back with TTS.

**Tasks:**
1. Read the voice lab spec
2. Build `/app/api/transcribe/route.ts` using OpenAI Whisper
3. Build `/app/api/tts/route.ts` using OpenAI TTS (streams audio back)
4. Create `/lib/languages.ts` with ISO code to display name mapping
5. Build `/lib/hooks/use-audio-recorder.ts` with MediaRecorder
6. Build `/components/studio/voice-lab.tsx` main component
7. Build `/app/studio/voice/page.tsx` server wrapper
8. Handle mic permission errors gracefully
9. Implement continuous conversation mode
10. Implement upload audio file fallback
11. Test on desktop Chrome/Safari/Firefox
12. Commit: `feat: phase 5 - voice lab`

**Success check:** Can record voice, see transcription, hear AI response spoken back.

---

## Phase 6 — Vision Lab

**Spec:** `/specs/07-module-vision-lab.md`

**Goals:** Upload images, analyze with GPT-4o/Claude vision, preset prompts, compare mode.

**Tasks:**
1. Read the vision lab spec
2. Build `/app/api/vision/route.ts` with streaming support
3. Build `/lib/image-utils.ts` with `fileToDataUrl` and `resizeIfLarge`
4. Build `/components/studio/vision-lab.tsx` main component
5. Implement drag-drop zone
6. Implement mobile camera capture
7. Build preset dropdown with all preset prompts
8. Implement compare mode
9. Build `/app/studio/vision/page.tsx`
10. Commit: `feat: phase 6 - vision lab`

**Success check:** Can upload an image, pick a preset or write custom prompt, get streaming response.

---

## Phase 7 — Chain Builder

**Spec:** `/specs/08-module-chain-builder.md` and `/specs/12-chain-templates.md`

**Goals:** Visual block-based chain editor with execution and templates.

**Tasks:**
1. Read the chain builder spec and templates spec
2. Create `/seed/templates.json` with the full template definitions
3. Create `/lib/chain-executor.ts` with the full executor (exact code in spec)
4. Build `/app/api/chain/run/route.ts` that streams execution progress
5. Build `/app/api/chain/save/route.ts`
6. Build `/components/studio/chain-builder.tsx` main component
7. Build `/components/studio/chain-block-palette.tsx` (left sidebar)
8. Build `/components/studio/chain-canvas.tsx` (right canvas)
9. Build `/components/studio/chain-block.tsx` (individual block component)
10. Build `/components/studio/block-config-panel.tsx` (config fields per block type)
11. Implement drag-to-reorder (use simple up/down arrows if drag-drop feels complex)
12. Implement template loading from seed data
13. Implement fork from gallery (stub for now, Gallery is Phase 8)
14. Build `/app/studio/chain/page.tsx`
15. Test each of the 6 templates end-to-end
16. Commit: `feat: phase 7 - chain builder with templates`

**Success check:** Can load a template, run it successfully, see each block execute, save the chain.

---

## Phase 8 — Gallery

**Spec:** `/specs/09-module-gallery.md`

**Goals:** Cross-team showcase with filters, detail views, and fork functionality.

**Tasks:**
1. Read the gallery spec
2. Build `/app/api/gallery/route.ts` (list) with filters and sorting
3. Build `/app/api/gallery/[id]/route.ts` (detail)
4. Build `/app/api/gallery/[id]/fork/route.ts` (fork chain)
5. Build `/components/studio/gallery-grid.tsx`
6. Build `/components/studio/gallery-card.tsx`
7. Build `/components/studio/gallery-detail-modal.tsx`
8. Build `/app/studio/gallery/page.tsx`
9. Implement auto-refresh via polling
10. Wire up "Fork" button in Chain Builder to actually fetch from gallery
11. Commit: `feat: phase 8 - gallery`

**Success check:** Saved items from Chat/Voice/Vision/Chain modules all appear in the gallery. Can filter, sort, view details, and fork chains.

---

## Phase 9 — Admin Panel

**Spec:** `/specs/10-module-admin.md`

**Goals:** Operator control panel with live usage, broadcast, team management.

**Tasks:**
1. Read the admin spec
2. Build all `/app/api/admin/*` routes with `isAdmin()` check
3. Build `/components/admin/*` components
4. Build `/app/admin/page.tsx`
5. Implement broadcast message (writes to config, studio pages read via polling)
6. Implement module kill switches
7. Implement team CRUD
8. Implement gallery moderation
9. Implement rate limit control
10. Commit: `feat: phase 9 - admin panel`

**Success check:** Admin can log in, see live usage, broadcast a message (which appears on studio pages within 10s), and toggle modules on/off.

---

## Phase 10 — Polish, Testing, Commit, Push

**Spec:** `/specs/13-testing-plan.md`

**Goals:** Final polish, automated tests passing, code committed and pushed to remote.

**Tasks:**
1. Read the testing plan spec
2. Create `/scripts/test-endpoints.js` (exact code from spec)
3. Final polish pass across all modules:
   - Ensure all strings use the i18n dictionary
   - Ensure all buttons have loading states
   - Ensure all errors show friendly bilingual messages
   - Ensure mobile responsive works for Voice Lab
   - Check all module kill switches work
4. Start dev server
5. Run `node scripts/test-endpoints.js`
6. If any tests fail, debug and fix
7. Once all tests pass, capture results
8. Write final `BUILD_STATUS.md` with:
   - What's complete
   - Test results
   - Manual verification checklist
   - How to run dev server
   - How to deploy to Vercel
   - Known limitations
9. Ensure `.env.example` is committed but `.env.local` is NOT
10. Ensure `/.data/` is gitignored and no data files are committed
11. Commit: `feat: phase 10 - polish and testing complete`
12. Add git remote if not already set: `git remote add origin https://github.com/regienovel/MEST.git`
13. Push to main: `git push -u origin main`
14. Final commit message on status file if needed

**Success check:** All automated tests pass. Code is on GitHub. BUILD_STATUS.md has complete handoff notes.

---

## Phase Dependencies

```
Phase 0 (Foundation)
  └─> Phase 1 (Design System)
        └─> Phase 2 (Auth & Storage)
              └─> Phase 3 (Studio Home)
                    ├─> Phase 4 (Chat Lab)       ─┐
                    ├─> Phase 5 (Voice Lab)       │
                    ├─> Phase 6 (Vision Lab)      ├─> Phase 8 (Gallery)
                    └─> Phase 7 (Chain Builder)  ─┘       │
                                                            └─> Phase 9 (Admin)
                                                                  └─> Phase 10 (Test & Ship)
```

**Build them in the listed order.** Do not start Phase 4 until Phase 3 is committed. Do not start Phase 8 until all 4 builder modules are committed.

## If Context Runs Out Mid-Phase

1. Don't panic. Commit what's working even if the phase isn't complete.
2. Update BUILD_STATUS.md with exactly what's done and what's not.
3. When a new session starts:
   - Read CLAUDE.md
   - Read BUILD_STATUS.md
   - Read the current phase's spec
   - Continue from where BUILD_STATUS.md says you stopped

## If Something Breaks

If a package version conflict, build error, or type error appears:
1. Try the simplest fix first
2. If still broken, simplify the feature (remove the offending part, mark it in BUILD_STATUS as "reduced scope")
3. Never skip a phase entirely
4. The operator would rather have 80% working than 100% broken

## Absolute Priorities If Time Is Short

If you run out of time and cannot complete all phases, prioritize in this order:

1. **Must have:** Phases 0, 1, 2, 3, 4 (Landing + Auth + Studio Home + Chat Lab)
2. **Should have:** Phase 5 (Voice Lab), Phase 7 (Chain Builder)
3. **Nice to have:** Phase 6 (Vision Lab), Phase 8 (Gallery), Phase 9 (Admin)

Chat Lab with Compare Mode is the single most important feature. If you can only ship ONE thing, ship that.
