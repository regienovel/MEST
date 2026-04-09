# 00 — Project Overview

## What

**MEST AI Studio** is a bilingual (English/French) web platform where teams of West African entrepreneurs-in-training experiment with AI through five modules: Chat Lab, Voice Lab, Vision Lab, Chain Builder, and Gallery. It uses OpenAI and Anthropic models on the backend.

## Who

- **29 EITs** (entrepreneurs-in-training) from West Africa
- **~45% Anglophone, ~55% Francophone** (bilingual UI is non-negotiable)
- **7 women out of 29** (inclusive design matters)
- **Mixed technical backgrounds** (interface must be accessible to non-developers)
- **Organized into 6 teams** of ~5 people each

## When

- **Day 1 session: 09:00-15:00 tomorrow** (6 hours)
- **Day 2 session: next Monday** (5 days to add code playground features)
- Platform must be **ready by 09:00 tomorrow**

## Goals

1. **Break passivity.** The cohort is too cautious with AI. The platform must make experimentation feel easy, fast, and bold.
2. **Showcase possibility.** In 90 minutes a team should be able to build something they previously thought impossible.
3. **Seed trust awareness.** Without lecturing, the platform surfaces AI's limitations (model disagreement, language quality gaps, compound errors) so learners feel them viscerally.
4. **Be a persistent programme asset.** Used across Days 1-4 of April, potentially beyond.

## Core Modules (Day 1)

| # | Module | One-Line Purpose |
|---|---|---|
| 1 | **Landing + Auth** | Team login with bilingual hero |
| 2 | **Studio Home** | Dashboard with activity feed and module cards |
| 3 | **Chat Lab** | Chat with GPT-4o, Claude, or both simultaneously (Compare Mode) |
| 4 | **Voice Lab** | Record → transcribe → respond → speak, with language detection |
| 5 | **Vision Lab** | Upload images, preset prompts, compare model outputs |
| 6 | **Chain Builder** | Visual block-based workflow editor |
| 7 | **Gallery** | Cross-team showcase with fork-and-modify |
| 8 | **Admin Panel** | Operator cockpit (protected by admin password) |

## Core Modules (Day 2 — add next week)

Deferred to Day 2 work:
- **Code Playground** (Monaco editor + pre-built helper functions)
- **Usage dashboard for teams**
- **Advanced rate limiting**

For now, build Day 1 scope only. Day 2 features are not part of this build.

## Success Criteria for This Build

- [ ] A team can log in with their team name + password
- [ ] A team can chat with GPT-4o and Claude in Compare Mode and see both streaming responses side-by-side
- [ ] A team can record voice, see it transcribed, get an AI response, hear it spoken back
- [ ] A team can upload an image, pick a preset prompt, see both models analyze it
- [ ] A team can build a chain from blocks, run it, and save it
- [ ] A team can see other teams' saved work in the Gallery and fork it
- [ ] The operator can log into Admin and see per-team usage
- [ ] All UI is bilingual (EN/FR toggle)
- [ ] The platform runs locally with `npm run dev` without errors
- [ ] The codebase is committed and pushed to the GitHub repo
- [ ] A BUILD_STATUS.md exists with final notes
