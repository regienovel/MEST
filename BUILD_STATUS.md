# MEST AI Studio — Build Status

## ✅ BUILD COMPLETE — Deployed on Vercel

**Live URL:** mest-nine.vercel.app

## How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Ensure .env.local exists with:
#    OPENAI_API_KEY=sk-...
#    ANTHROPIC_API_KEY=sk-ant-...
#    ADMIN_PASSWORD=your-admin-password
#    KV_REST_API_URL=...       (from Upstash Redis)
#    KV_REST_API_TOKEN=...     (from Upstash Redis)

# 3. Start dev server
npm run dev

# 4. Open http://localhost:3000
```

## Vercel Environment Variables Required

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | GPT-4o, Whisper, TTS |
| `ANTHROPIC_API_KEY` | Claude Sonnet |
| `ADMIN_PASSWORD` | Admin panel access |
| `KV_REST_API_URL` | Upstash Redis (auto-set by Vercel integration) |
| `KV_REST_API_TOKEN` | Upstash Redis (auto-set by Vercel integration) |

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

**Admin access:** Select Admin team → enter password → automatically redirected to `/admin`.

## Architecture

### Storage
- **Upstash Redis** (persistent KV store via Vercel integration)
- All saved work persists permanently: gallery items, chains, activity, XP, config
- Team definitions read from `seed/teams.json` at build time (no Redis dependency for login)

### Auth
- Cookie-based: `mest_session`, `mest_team` (JSON), `mest_admin`
- Team info stored in cookie for cross-instance compatibility on Vercel serverless
- Login validates against seed file directly (no storage lookup)

### API Routes
- `maxDuration=60` on chat, vision, chain/run routes (Vercel Pro supports up to 800s)
- `maxDuration=30` on transcribe, tts routes
- SSE streaming for chat, vision, and chain execution

### UI Components
- Replaced shadcn v4 Select/Dialog (incompatible with Tailwind v3) with native `<select>` and custom Modal
- All UI strings bilingual (EN/FR) via i18n context with localStorage persistence

## Modules

### Chat Lab
- GPT-4o, Claude Sonnet, Compare Both modes
- Streaming SSE responses
- System prompt presets (West African market trader, Twi health worker, etc.)
- Image upload for vision questions
- Save to Gallery with feedback
- Export to markdown

### Voice Lab
- Record audio with live level meter
- Transcribe with OpenAI Whisper (auto-detects language)
- AI response via GPT-4o or Claude (or Compare Both — side by side)
- Text-to-Speech with 6 voice options (alloy, echo, fable, onyx, nova, shimmer)
- Continuous conversation mode
- Upload audio file fallback
- Save to Gallery

### Vision Lab
- Drag-drop image upload, multi-image (up to 3)
- 9 bilingual preset prompts
- GPT-4o Vision, Claude Vision, Compare Both
- Client-side image resize before upload
- Save to Gallery

### Chain Builder
- 15 block types: 3 inputs, 9 process, 3 outputs
- 6 seed templates with bilingual descriptions on every block
- All palette blocks have helpful descriptions and examples
- File upload UI for Image Upload and Audio Input blocks
- Up/down arrow reorder, inline config editing
- Streaming execution with per-block status (running/done/error)
- SSE parser handles large payloads (base64 audio) split across chunks
- Save includes block execution outputs for presentation in Gallery
- Save button with loading state and success/error feedback

### Gallery
- Grid view with type/team filters, sort options
- Rich detail views per module type:
  - **Chains**: Pipeline flow visualization with color-coded blocks, emojis, config badges, prompt previews, execution outputs, status badges, audio players
  - **Chats**: Conversation bubbles (blue user, white AI), system prompt display
  - **Voice**: Transcription card with language badge, AI response
  - **Vision**: Prompt + response cards, compare mode support
- Featured section, fork with feedback, copy content
- Teams can delete their own items
- Auto-refresh every 10 seconds

### Admin Panel
- Quick stats: total calls, cost, top team, top module
- Live usage table per team (calls/hr, cost/hr, status)
- **Team Work section**: all saved items grouped by team with expandable detail cards showing full content (chain pipelines with outputs, chat conversations, voice transcriptions, vision analyses)
- Broadcast messaging (EN/FR with duration)
- Daily challenge control
- Module kill switches
- Rate limit control
- Team management (add, disable, reset XP, delete)
- Gallery moderation (feature/delete)

## 6 Chain Templates

| Template | Flow | Teaching Point |
|----------|------|---------------|
| **Market Whisperer** | Image → Vision (GPT) → Summarize → Translate (French) → TTS → Audio | AI can see and describe market scenes |
| **The Duel** | Text → GPT answers → Claude critiques | AI models disagree with each other |
| **Voice of the Street** | Audio → Transcribe → Translate (French) → TTS → Audio | AI can hear, translate, and speak |
| **Receipt Whisperer** | Image → Vision (GPT) → Extract JSON → Display | AI reads handwritten receipts |
| **Two Minds** | Text → GPT proposes → Claude attacks → GPT defends → Display | AI can debate itself |
| **Multilingual Broadcaster** | Text → GPT translates 5 languages → Extract JSON → Display | AI translation quality varies by language |

## Post-Build Fixes (Vercel Deployment)

1. **Native selects** — replaced shadcn Select with native `<select>` for Tailwind v3 compatibility
2. **Custom Modal** — replaced shadcn Dialog with custom Modal component
3. **In-memory storage fallback** — added for Vercel read-only filesystem
4. **Cookie-based auth** — team info in cookie for cross-instance serverless compatibility
5. **Seed from JSON files** — teams, templates, config read from seed files (no Redis dependency for static data)
6. **Upstash Redis** — persistent storage for all saved work (gallery, chains, activity, XP)
7. **Transcription file handling** — Buffer + toFile() for Vercel serverless compatibility
8. **Function timeouts** — maxDuration=60s on AI routes
9. **SSE chunk buffering** — split on \n\n boundaries to handle large base64 payloads
10. **Voice Lab Compare Both** — full side-by-side GPT + Claude responses
11. **Chain Builder file uploads** — Image Upload and Audio Input blocks have proper file pickers
12. **Block descriptions** — all 15 block types have bilingual help text
13. **Template descriptions** — all 6 templates have bilingual descriptions on every block
14. **Save with outputs** — chain saves include block execution results for Gallery presentation
15. **Gallery delete** — teams can delete their own items
16. **Admin Team Work** — grouped view of all teams' saved work with expandable detail cards
17. **Error surfacing** — detailed API error messages shown in UI instead of generic failures

## Known Limitations

- Chain executor runs blocks sequentially (not parallel)
- Gallery doesn't store actual images (only metadata + image count)
- Whisper may misdetect West African languages (Twi → Yoruba, etc.)
- OpenAI TTS doesn't officially support Twi (works with English, French, Spanish, Portuguese)
- No WebSocket support (uses polling for real-time features)
- XP tracking resets if Redis is flushed

## Cost Tracking

The admin dashboard shows approximate per-team costs. For exact reimbursement numbers, use:
- **OpenAI:** platform.openai.com/usage
- **Anthropic:** console.anthropic.com/settings/billing
