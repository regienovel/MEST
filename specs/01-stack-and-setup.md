# 01 — Stack and Setup

## Exact Tech Stack

These decisions are final. Do not substitute alternatives.

| Layer | Choice | Version |
|---|---|---|
| Framework | Next.js (App Router) | 14.2.x (latest stable 14) |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.4.x |
| UI Components | shadcn/ui | Latest |
| Icons | lucide-react | Latest |
| AI SDK | `openai` (official) | Latest |
| AI SDK | `@anthropic-ai/sdk` (official) | Latest |
| Storage | **File-based JSON** (see below) | N/A |
| Auth | Cookie-based team sessions | Custom, ~50 lines |
| Streaming | Web Streams API (built-in) | N/A |
| Audio | MediaRecorder API (browser) | N/A |

## Why File-Based Storage

The operator does not have Vercel KV set up and is deploying manually. For a 6-team workshop running on a single Vercel instance, a JSON file on disk is sufficient. This is intentional, not a limitation.

**Create `/lib/storage.ts` as a storage adapter** with this interface:

```typescript
export interface Storage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  list(prefix: string): Promise<string[]>;
  increment(key: string, amount?: number): Promise<number>;
}
```

Implement it with a single JSON file at `/.data/storage.json` that gets read/written on each operation. Use a simple file lock or async mutex to prevent race conditions. For this scale (6 teams, ~300 operations per session), it will perform fine.

If Vercel's read-only filesystem becomes a problem in production, the operator will swap in a real KV store later. Make the adapter easy to swap by keeping the Storage interface clean.

**Important:** Add `/.data/` to `.gitignore`.

## Initial Setup Commands

Run these in order from the project root:

```bash
# 1. Create Next.js app with TypeScript + Tailwind + App Router
npx create-next-app@14 . --typescript --tailwind --app --src-dir=false --import-alias "@/*" --no-eslint --use-npm

# 2. Install dependencies
npm install openai @anthropic-ai/sdk lucide-react clsx tailwind-merge class-variance-authority

# 3. Install shadcn/ui and initialize
npx shadcn@latest init -d

# 4. Install the shadcn components we'll need upfront
npx shadcn@latest add button input textarea label card dialog dropdown-menu select tabs toast badge separator switch slider

# 5. Create the folder structure
mkdir -p app/studio/chat app/studio/voice app/studio/vision app/studio/chain app/studio/gallery app/admin
mkdir -p app/api/auth/login app/api/auth/logout
mkdir -p app/api/chat app/api/transcribe app/api/tts app/api/vision
mkdir -p app/api/chain/run app/api/chain/save app/api/gallery app/api/admin app/api/activity
mkdir -p components/ui components/studio components/admin
mkdir -p lib
mkdir -p .data
```

## Required Environment Variables

Create `.env.example` with these placeholders (operator fills `.env.local` separately):

```env
# AI Provider Keys
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...

# Admin access
ADMIN_PASSWORD=change-me-to-something-strong

# Optional: override default settings
# RATE_LIMIT_PER_HOUR=200
```

Create `.env.example` in the project root. **Do NOT create `.env.local`** — the operator creates that file themselves with real keys.

## .gitignore Additions

Append these lines to the default Next.js `.gitignore`:

```
# Local data storage
/.data/

# Environment files
.env.local
.env*.local
```

## TypeScript Config

Use the default Next.js TypeScript config. Add path alias if not already present:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

## package.json Scripts

Ensure these scripts exist:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "node scripts/test-endpoints.js"
  }
}
```

## What to Verify Before Phase 1

- [ ] `npm run dev` starts without errors
- [ ] Visiting http://localhost:3000 shows the default Next.js page
- [ ] `/.data/` folder exists and is gitignored
- [ ] `.env.example` exists
- [ ] shadcn/ui `components/ui/button.tsx` exists
- [ ] TypeScript compilation succeeds (`npx tsc --noEmit`)

If all checks pass, commit with message: `chore: initial scaffold (Phase 0)` and proceed to Phase 1.
