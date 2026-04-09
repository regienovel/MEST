# MEST AI Studio — Claude Code Build Guide

You are building the **MEST AI Studio**, a bilingual AI experimentation platform for 29 West African entrepreneurs-in-training (EITs) running their Day 1 programme tomorrow morning at 09:00. This is a real, time-critical deliverable. Your job is to build the entire platform autonomously without human intervention.

## The Operator

The human operator has stepped away. They will not answer questions. You must make every decision yourself, consulting this document and the spec files. When in doubt, choose the option that is:
1. **Simpler** (fewer moving parts, less that can break)
2. **More reliable** (battle-tested libraries over clever ones)
3. **Faster to build** (ship working code, not perfect code)
4. **Easier to debug** (clear error messages, readable code)

Do not stop to ask questions. Do not leave TODO comments asking for input. Make the decision and proceed.

## Context Window Management — READ THIS FIRST

Claude Code sessions have finite context. This project is too large to hold entirely in context. To handle this safely:

1. **This file (CLAUDE.md) is your persistent brain.** Always keep it in context.
2. **Read spec files on-demand per phase.** Do not read all specs at once.
3. **Work in phases.** Complete one phase fully before starting the next.
4. **After each phase, update `/BUILD_STATUS.md`** with what's done, what's next, and any decisions made.
5. **If context feels tight, re-read CLAUDE.md + BUILD_STATUS.md + the current phase spec** to re-establish state.
6. **If a session ends and a new one begins, read CLAUDE.md → BUILD_STATUS.md → the next phase spec.** This is enough to resume.

## Where Everything Lives

```
/CLAUDE.md                    ← This file. Your persistent brain.
/BUILD_STATUS.md              ← You maintain this. Current state of the build.
/specs/
  00-overview.md              ← Project summary and goals
  01-stack-and-setup.md       ← Exact tech stack and initial setup
  02-design-system.md         ← Colors, fonts, components, aesthetic
  03-data-model.md            ← Storage schema
  04-auth-and-teams.md        ← Team login and seed data
  05-module-chat-lab.md       ← Chat Lab feature spec
  06-module-voice-lab.md      ← Voice Lab feature spec
  07-module-vision-lab.md     ← Vision Lab feature spec
  08-module-chain-builder.md  ← Chain Builder feature spec
  09-module-gallery.md        ← Gallery feature spec
  10-module-admin.md          ← Admin panel feature spec
  11-i18n-strings.md          ← All EN/FR UI strings
  12-chain-templates.md       ← 6 seed templates for Chain Builder
  13-testing-plan.md          ← Functional tests to run after build
  14-build-order.md           ← THE ORDER. Follow this exactly.
/seed/
  teams.json                  ← Team names and default passwords
  templates.json              ← Chain templates as JSON
  trust-failures.json         ← The 6 AI trust failure case studies
/.env.example                 ← Required environment variables
```

## The Build Order (Non-Negotiable)

**Follow `/specs/14-build-order.md` exactly.** Do not skip ahead. Do not build in parallel. Each phase produces a deployable state so partial completion is still valuable.

The high-level phases are:
1. **Phase 0:** Foundation — Next.js scaffold, dependencies, env config
2. **Phase 1:** Design System & Layout — MEST theme, base components, i18n
3. **Phase 2:** Auth & Storage — Team login, file-based KV adapter
4. **Phase 3:** Studio Home — Dashboard, module cards, activity feed
5. **Phase 4:** Chat Lab — With Compare Mode (this is the flagship)
6. **Phase 5:** Voice Lab — Record, transcribe, respond, speak
7. **Phase 6:** Vision Lab — Image upload, preset prompts, compare
8. **Phase 7:** Chain Builder — Block-based workflow editor
9. **Phase 8:** Gallery — Cross-team showcase
10. **Phase 9:** Admin Panel — Operator cockpit
11. **Phase 10:** Polish, Testing, Commit, Push

## Core Principles (Apply Throughout)

### 1. Trust is the invisible theme
Every feature must work well enough to be bold, AND have moments where AI limitations become visible. Compare Modes, language detection displays, and real-time error surfacing are essential. Do not hide AI failures — expose them clearly so learners can see them.

### 2. Bilingual from pixel one
Every string the user sees must exist in English AND French. Use the `/specs/11-i18n-strings.md` dictionary. Never hardcode user-facing text in components. If you need a new string, add it to the dictionary in both languages.

### 3. Mobile-responsive, laptop-first
Primary experience is on 13-15" laptops. Voice Lab must also work on mobile (some learners may use phones). Use Tailwind responsive classes throughout.

### 4. Errors must be human-readable
Never show raw API errors to users. Catch everything, return friendly messages in EN/FR. Loading states should have playful messages.

### 5. Rate limiting is mandatory
Every AI API route must check a per-team rate limit before calling. Default: 200 calls per team per hour. This prevents runaway costs.

### 6. No user data leaves the server except intentionally
API keys live in environment variables only. Never expose them to the client. All AI calls go through `/api/*` server routes.

### 7. Build it so it can be demoed at 9am tomorrow
This is not a toy. 29 people will use it live. Prioritize reliability over features. Test every happy path.

## Design North Star

The platform must look and feel like a **real, polished product** — not a hackathon prototype. The MEST cohort's first impression of the platform sets their expectations for what they can build. See `/specs/02-design-system.md` for the full aesthetic direction.

Key choices already made:
- **Colors:** MEST blue (#1B4F72), teal (#0E6B5C), gold accent (#B8860B), warm off-white backgrounds
- **Typography:** Inter for UI, optional serif display for hero moments
- **Feel:** Editorial-tech. Confident. African-contemporary, not stereotypical.
- **Animations:** Subtle, purposeful. Never gratuitous.

## What You Will NOT Do

- **Do not ask the operator for clarification.** They are not available.
- **Do not leave `// TODO: decide...` comments.** Decide and move on.
- **Do not skip testing.** Phase 10 runs functional tests and is mandatory.
- **Do not commit secrets.** `.env.local` is gitignored. Never write real API keys to any file except `.env.local` which you will not create (the operator creates it).
- **Do not use tools the operator doesn't have.** Stick to: Next.js, React, TypeScript, Tailwind, shadcn/ui, OpenAI SDK, Anthropic SDK, and Node's built-in modules. No Supabase, no Firebase, no Postgres, no Redis.
- **Do not deploy.** The operator deploys manually. Your job ends at commit + push to git.
- **Do not over-engineer.** A JSON file for storage is fine. A simple cookie for auth is fine. Ship working code.

## What You MUST Do

- **Follow the build order exactly.**
- **Update `/BUILD_STATUS.md` after each phase.**
- **Run functional tests in Phase 10 and document results.**
- **Commit after each phase with a clear message.**
- **Push to `https://github.com/regienovel/MEST.git` at the end.** The remote is named `origin`. Branch is `main`.
- **Leave a final status in `/BUILD_STATUS.md`** explaining what works, what to test manually, and how to run the dev server.

## When You Start

1. Read `/specs/00-overview.md` (one page — always read this first)
2. Read `/specs/14-build-order.md` (the sequence)
3. Begin Phase 0 by reading `/specs/01-stack-and-setup.md`
4. Work through phases sequentially, reading the relevant spec file at the start of each phase
5. After each phase, update `/BUILD_STATUS.md` and commit

## Final Check Before You Start

Before writing any code, verify:
- [ ] `/specs/` folder exists with all 15 files
- [ ] `/seed/` folder exists with teams.json, templates.json, trust-failures.json
- [ ] `.env.example` exists at the project root
- [ ] `.env.local` exists (created by operator) with OPENAI_API_KEY and ANTHROPIC_API_KEY

If any of the above are missing, check the current directory carefully. Do not proceed until all spec files are present.

---

**You have everything you need. Start with Phase 0. Build carefully. Test thoroughly. Ship on time.**
