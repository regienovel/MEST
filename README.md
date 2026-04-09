# MEST AI Studio — Autonomous Build Package

This folder contains everything Claude Code needs to build the MEST AI Studio platform without any human input during the build.

## What's Inside

```
CLAUDE.md                ← The persistent brain Claude Code reads at every session
README.md                ← This file. Read it first.
.env.example             ← Template for your API keys
specs/                   ← 15 detailed spec files, one per module/concern
  00-overview.md
  01-stack-and-setup.md
  02-design-system.md
  03-data-model.md
  04-auth-and-teams.md
  05-module-chat-lab.md
  06-module-voice-lab.md
  07-module-vision-lab.md
  08-module-chain-builder.md
  09-module-gallery.md
  10-module-admin.md
  11-i18n-strings.md
  12-chain-templates.md
  13-testing-plan.md
  14-build-order.md
seed/                    ← Seed data loaded on first boot
  teams.json             ← 6 team accounts + admin
  templates.json         ← 6 chain builder templates
  trust-failures.json    ← 6 case studies for reference
```

## How to Use This Package

### Step 1 — Rotate your API keys (DO THIS FIRST)

If you have been pasting your API keys into chat windows, they are compromised. Go revoke them and generate fresh ones:

- Anthropic: https://console.anthropic.com/settings/keys
- OpenAI: https://platform.openai.com/api-keys

### Step 2 — Prepare the project folder

Create a new empty folder anywhere on your machine. This will be your project root.

```bash
mkdir mest-studio
cd mest-studio
```

### Step 3 — Copy this entire package into the project folder

Copy `CLAUDE.md`, `.env.example`, the `specs/` folder, and the `seed/` folder into your project folder. After copying, your project should look like:

```
mest-studio/
├── CLAUDE.md
├── .env.example
├── specs/
└── seed/
```

### Step 4 — Create .env.local with your fresh API keys

```bash
cp .env.example .env.local
```

Open `.env.local` in a text editor and fill in:

- `OPENAI_API_KEY` — your fresh OpenAI key
- `ANTHROPIC_API_KEY` — your fresh Anthropic key
- `ADMIN_PASSWORD` — a strong password only you know (you'll use this during the workshop to access the admin panel)

Save the file. **Do not commit it to git.** Claude Code will not commit it — it's already in the gitignore rules.

### Step 5 — Initialize git and set the remote

```bash
git init
git remote add origin https://github.com/regienovel/MEST.git
```

Claude Code will commit and push at the end of the build.

### Step 6 — Start Claude Code and walk away

```bash
claude
```

When Claude Code starts, give it this single instruction:

> Read CLAUDE.md and begin the build. Follow the build order in /specs/14-build-order.md exactly. Do not ask me questions — make all decisions yourself using the specs. I will not be available during the build.

Then close your laptop and get some sleep. The build will run for several hours.

## What to Expect When You Come Back

When you return, the project folder will contain a fully built Next.js app:

- `app/` — Next.js pages and API routes
- `components/` — React components
- `lib/` — utilities, storage, auth, AI clients
- `BUILD_STATUS.md` — Claude Code's final report on what was built and tested
- `test-results.json` — automated test results from Phase 10

To verify the build:

```bash
npm run dev
```

Then visit http://localhost:3000 and log in with one of the seed teams:

| Team | Password |
|---|---|
| Sankofa | sankofa2026 |
| Asase | asase2026 |
| Baobab | baobab2026 |
| Kora | kora2026 |
| Harmattan | harmattan2026 |
| Zawadi | zawadi2026 |

For admin access: log in as any team AND provide your admin password (from .env.local).

## What the Platform Includes

- **Landing page** with team login, bilingual EN/FR
- **Studio Home** dashboard with 5 module cards and live activity feed
- **Chat Lab** — single model or Compare Mode (GPT-4o vs Claude side-by-side), image upload, save to gallery, export as markdown
- **Voice Lab** — record audio, Whisper transcription with language detection, AI response, text-to-speech with 6 voices, continuous conversation mode
- **Vision Lab** — drag-drop image upload, 10 preset prompts in EN/FR, multi-image, compare mode
- **Chain Builder** — visual block-based workflow editor with 14 block types and 6 pre-built templates (Market Whisperer, The Duel, Voice of the Street, Receipt Whisperer, Two Minds, Multilingual Broadcaster)
- **Gallery** — cross-team showcase with filters, detail views, fork functionality
- **Admin Panel** — operator cockpit with live usage tracking, broadcast messages, daily challenges, module kill switches, team CRUD, gallery moderation, rate limit control

All bilingual (English + French). All polished with MEST theme colors. All built to impress 29 EITs tomorrow at 09:00.

## Deploying to Vercel

Claude Code does NOT deploy. When the build is complete, you deploy manually:

1. Verify the build works locally (`npm run dev`)
2. Push is already done by Claude Code to `https://github.com/regienovel/MEST.git`
3. Go to Vercel dashboard → import from GitHub → pick the MEST repo
4. Add environment variables in Vercel: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `ADMIN_PASSWORD`
5. Deploy

**Important:** The file-based storage (`/.data/storage.json`) works on Vercel because the filesystem IS writable in serverless functions at `/tmp`, BUT the file won't persist between deployments and may reset between cold starts. For a single-day workshop, this is fine — teams can re-save if needed. If you want proper persistence across deployments, add Vercel KV or Upstash Redis later. Claude Code's storage adapter is designed to be swappable.

## Troubleshooting

**If Claude Code runs out of context mid-build:**
Claude Code's sessions have limits. If it stops mid-build, just run `claude` again in the same folder. It will read `CLAUDE.md` and `BUILD_STATUS.md` to understand where it left off, then continue.

**If something fails during the build:**
Claude Code is instructed to commit after every phase. Even if later phases fail, earlier phases will be committed. You'll have a partial but working build.

**If the automated tests fail:**
The `BUILD_STATUS.md` will document which tests failed. Common causes: API keys wrong, dev server not running during tests, network issues. Fix the cause and re-run tests manually: `node scripts/test-endpoints.js`.

**If you need to change team names or passwords:**
Edit `seed/teams.json` before the first build. After the build, you can also edit teams through the Admin Panel at `/admin`.

## Priority If Time Runs Short

Claude Code has been instructed to prioritize this way if it runs out of time:

1. **Must ship:** Landing + Auth + Studio Home + Chat Lab with Compare Mode
2. **Should ship:** Voice Lab, Chain Builder with templates
3. **Nice to have:** Vision Lab, Gallery, Admin Panel

Chat Lab with Compare Mode is the single most important feature. If everything else fails and only that works, you still have a workshop.

## Questions That Come Up During the Workshop

**"Why are we seeing different responses from the two models?"**
That's the point. Compare Mode exposes the fact that AI models are not identical oracles. They have different training, different biases, different failure modes. Showing two side-by-side is how you teach healthy skepticism.

**"Why did the transcription get my language wrong?"**
Whisper is trained primarily on English and major European languages. Twi, Wolof, and many West African languages are underrepresented. The platform shows the detected language confidence so you can see when the model is guessing. This is a real trust failure to discuss with learners.

**"The chain failed on step 3."**
Compound systems accumulate errors. This is a designed learning moment. Ask the team: was the error in the model, the prompt, or the way the chain was composed? This is where trust becomes a design problem.

---

**Built for the MEST April 2026 cohort. Sleep well. Build something audacious tomorrow.**
