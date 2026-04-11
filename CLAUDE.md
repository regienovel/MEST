# MEST AI Studio — Project Guide

## What This Is

**MEST AI Studio** is a bilingual (EN/FR) AI experimentation platform for West African entrepreneurs-in-training (EITs). It's deployed on Vercel at `mest-nine.vercel.app`.

## Current State: LIVE & IN USE

All 10 build phases are complete. The platform has been deployed, tested, and iterated on through multiple rounds of live user testing. See `BUILD_STATUS.md` for full details.

## Architecture (Post-Deployment)

### Stack
- **Framework:** Next.js 14.2 (App Router), TypeScript, Tailwind CSS 3
- **AI:** OpenAI SDK (GPT-4o, Whisper, TTS), Anthropic SDK (Claude Sonnet)
- **Storage:** Upstash Redis via `@upstash/redis` (persistent KV)
- **Auth:** Cookie-based (`mest_session`, `mest_team`, `mest_admin`)
- **Hosting:** Vercel Pro

### Key Architecture Decisions
- **UI components:** shadcn/ui v4 components (Select, Dialog) were replaced with native `<select>` and a custom `Modal` component because shadcn v4 uses `@base-ui/react` which is incompatible with Tailwind CSS v3
- **Auth:** Team info stored in `mest_team` cookie (JSON) so server components work across Vercel serverless instances without shared storage
- **Login:** Validates against `seed/teams.json` directly (no Redis dependency for authentication)
- **Static data:** Teams, templates, and default config read from seed JSON files at build time
- **Persistent data:** Gallery items, chains, activity, XP, usage, admin config stored in Upstash Redis
- **SSE streaming:** Chat, vision, and chain execution use Server-Sent Events with chunk buffering (split on `\n\n` boundaries to handle large base64 payloads)
- **Function timeouts:** `maxDuration=60` on chat/vision/chain routes, `maxDuration=30` on transcribe/tts

### File Structure
```
app/
  page.tsx                    ← Landing page with login
  layout.tsx                  ← Root layout with fonts + I18nProvider
  studio/
    page.tsx                  ← Studio home dashboard
    chat/page.tsx             ← Chat Lab
    voice/page.tsx            ← Voice Lab
    vision/page.tsx           ← Vision Lab
    chain/page.tsx            ← Chain Builder
    gallery/page.tsx          ← Gallery
  admin/page.tsx              ← Admin panel
  api/
    auth/login/route.ts       ← Login (validates vs seed file)
    auth/logout/route.ts      ← Logout (clears cookies)
    teams/route.ts            ← Team list (reads seed file)
    chat/route.ts             ← Chat streaming (GPT/Claude/Both)
    transcribe/route.ts       ← Whisper transcription
    tts/route.ts              ← Text-to-Speech
    vision/route.ts           ← Vision analysis (GPT/Claude/Both)
    chain/run/route.ts        ← Chain executor (SSE streaming)
    chain/save/route.ts       ← Save chain + outputs to gallery
    chain/templates/route.ts  ← Templates (reads seed file)
    gallery/route.ts          ← Gallery list + save
    gallery/[id]/route.ts     ← Gallery detail + view count
    gallery/[id]/fork/route.ts ← Fork chain
    gallery/[id]/delete/route.ts ← Delete own items
    config/route.ts           ← Config with defaults
    activity/route.ts         ← Activity feed
    admin/                    ← Admin API routes (usage, broadcast, etc.)
components/
  studio/                     ← All module UI components
  ui/                         ← Base UI (button, input, modal, native-select, etc.)
  admin/                      ← Admin components
lib/
  storage.ts                  ← Upstash Redis adapter
  auth.ts                     ← Cookie-based auth helpers
  seed.ts                     ← Seeds missing teams/config to Redis
  i18n.ts                     ← Full EN/FR dictionary (~160 strings)
  i18n-context.tsx            ← React context + localStorage persistence
  openai.ts                   ← OpenAI client
  anthropic.ts                ← Anthropic client
  chain-executor.ts           ← Sequential block executor
  rate-limit.ts               ← Per-team rate limiting
  activity.ts                 ← Activity feed logger
  usage.ts                    ← XP award helper
  pricing.ts                  ← Cost estimation constants
  languages.ts                ← Language code → name mapping
  image-utils.ts              ← Client-side image resize
  types.ts                    ← TypeScript interfaces
  hooks/
    use-chat-stream.ts        ← Chat streaming hook
    use-audio-recorder.ts     ← MediaRecorder hook
seed/
  teams.json                  ← 11 teams + admin (West African dishes)
  templates.json              ← 6 chain templates with block descriptions
  trust-failures.json         ← AI trust failure case studies
```

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
| `OPENAI_API_KEY` | GPT-4o, Whisper, TTS |
| `ANTHROPIC_API_KEY` | Claude Sonnet |
| `ADMIN_PASSWORD` | Admin panel access |
| `KV_REST_API_URL` | Upstash Redis (auto-set) |
| `KV_REST_API_TOKEN` | Upstash Redis (auto-set) |

## When Making Changes

### Important patterns to follow:
1. **Never use shadcn Select or Dialog** — use `NativeSelect` from `components/ui/native-select.tsx` and `Modal` from `components/ui/modal.tsx`
2. **API routes read team from `mest_team` cookie** — not from storage sessions
3. **Static data (teams, templates) comes from seed files** — not from Redis
4. **Add `export const maxDuration = 60` to any new long-running API routes**
5. **SSE parsers must buffer chunks and split on `\n\n`** — not `\n` — to handle large payloads
6. **Use `!!value &&` instead of `value &&` in JSX** when value is typed as `unknown` to avoid ReactNode type errors
7. **All user-facing strings must be in both EN and FR** — add to `lib/i18n.ts`
8. **Chain block descriptions use `_desc` and `_descFr` fields** in config objects

### Testing changes:
```bash
npx tsc --noEmit          # TypeScript check
npx next build            # Production build
npm run dev               # Dev server
node scripts/test-endpoints.js  # Automated tests (requires running dev server)
```

### Deploying:
```bash
git add -A && git commit -m "description" && git push origin master:main
```
Vercel auto-deploys on push to main.

## Known Limitations

- Chain executor runs blocks sequentially (not parallel)
- Gallery stores metadata only for images (not the actual image data)
- Whisper may misdetect West African languages (Twi → Yoruba/Italian)
- OpenAI TTS doesn't officially support Twi (works with English, French, Spanish, Portuguese)
- Uses polling for real-time features (no WebSockets)
- Cost tracking in admin is approximate (use OpenAI/Anthropic dashboards for exact billing)

## Cost Tracking for Reimbursement

Admin dashboard shows approximate per-team costs. For exact numbers:
- **OpenAI:** platform.openai.com/usage
- **Anthropic:** console.anthropic.com/settings/billing
