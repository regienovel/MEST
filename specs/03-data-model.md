# 03 — Data Model

All storage goes through the Storage adapter defined in `/lib/storage.ts` (see spec 01). Keys follow a simple prefix pattern.

## Type Definitions

Create `/lib/types.ts` with these types:

```typescript
export interface Team {
  id: string;              // slug: "sankofa", "baobab", etc.
  name: string;            // display name: "Sankofa"
  password: string;        // stored as plain text (this is a workshop, not prod)
  xp: number;              // gamification points
  createdAt: string;       // ISO date
  disabled?: boolean;      // admin kill switch
}

export interface Session {
  id: string;              // random UUID
  teamId: string;
  createdAt: string;
  expiresAt: string;       // 24h from creation
}

export type GalleryItemType = 'chat' | 'voice' | 'vision' | 'chain';

export interface GalleryItem {
  id: string;
  teamId: string;
  teamName: string;
  type: GalleryItemType;
  title: string;
  description?: string;
  data: unknown;           // type-specific payload
  createdAt: string;
  views: number;
  forks: number;
  featured: boolean;
}

export interface ChainBlock {
  id: string;
  type: ChainBlockType;
  config: Record<string, unknown>;
}

export type ChainBlockType =
  | 'input-text'
  | 'input-image'
  | 'input-audio'
  | 'process-chat-gpt'
  | 'process-chat-claude'
  | 'process-transcribe'
  | 'process-tts'
  | 'process-vision-gpt'
  | 'process-vision-claude'
  | 'process-translate'
  | 'process-extract-json'
  | 'process-summarize'
  | 'output-text'
  | 'output-audio'
  | 'output-image';

export interface Chain {
  id: string;
  teamId: string;
  teamName: string;
  name: string;
  description?: string;
  blocks: ChainBlock[];
  createdAt: string;
  forkedFrom?: string;     // parent chain id
  runs: number;
}

export interface ChainExecution {
  chainId: string;
  teamId: string;
  timestamp: string;
  blockResults: Array<{
    blockId: string;
    blockType: ChainBlockType;
    input: unknown;
    output: unknown;
    durationMs: number;
    error?: string;
  }>;
  success: boolean;
  totalDurationMs: number;
}

export interface ActivityEvent {
  id: string;
  teamId: string;
  teamName: string;
  type: 'login' | 'chat-saved' | 'voice-saved' | 'vision-saved' | 'chain-saved' | 'chain-run' | 'chain-forked' | 'item-featured';
  message: string;         // pre-formatted, bilingual via template
  messageFr: string;
  timestamp: string;
}

export interface UsageRecord {
  teamId: string;
  hour: string;            // "2025-04-09T09" - rounded to hour
  calls: number;
  estimatedCostUsd: number;
}

export interface Config {
  dailyChallenge: {
    en: string;
    fr: string;
  };
  dailyChallengeUpdatedAt: string;
  enabledModules: {
    chat: boolean;
    voice: boolean;
    vision: boolean;
    chain: boolean;
    gallery: boolean;
  };
  rateLimitPerHour: number;
  broadcastMessage?: {
    en: string;
    fr: string;
    expiresAt: string;
  };
}
```

## Key Schema

Keys are stored in the JSON blob under predictable paths:

| Key Pattern | Value Type | Description |
|---|---|---|
| `team:{id}` | `Team` | Team record |
| `session:{id}` | `Session` | Active login session |
| `gallery:{id}` | `GalleryItem` | Saved creation |
| `chain:{id}` | `Chain` | Saved chain |
| `activity:recent` | `ActivityEvent[]` | Capped at 50 most recent |
| `usage:{teamId}:{hour}` | `UsageRecord` | Per-hour rate limit counter |
| `config` | `Config` | Global config (admin editable) |
| `templates` | `Chain[]` | Seed chain templates (readonly) |

## Storage Adapter Implementation

`/lib/storage.ts` should:
1. Read the entire JSON blob from `/.data/storage.json` into memory on each operation
2. Use an async mutex (simple Promise chain) to serialize writes
3. Write back to disk on every `set` / `delete` / `increment`
4. Handle missing file by creating it with `{}`
5. Handle corrupt file by logging and creating a fresh one (do not crash)

Example skeleton:

```typescript
import fs from 'fs/promises';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), '.data', 'storage.json');

let writeLock: Promise<void> = Promise.resolve();

async function readBlob(): Promise<Record<string, unknown>> {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return {};
    console.error('[storage] read failed, starting fresh:', err);
    return {};
  }
}

async function writeBlob(data: Record<string, unknown>): Promise<void> {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
}

export const storage = {
  async get<T>(key: string): Promise<T | null> {
    const blob = await readBlob();
    return (blob[key] as T) ?? null;
  },

  async set<T>(key: string, value: T): Promise<void> {
    writeLock = writeLock.then(async () => {
      const blob = await readBlob();
      blob[key] = value;
      await writeBlob(blob);
    });
    return writeLock;
  },

  async delete(key: string): Promise<void> {
    writeLock = writeLock.then(async () => {
      const blob = await readBlob();
      delete blob[key];
      await writeBlob(blob);
    });
    return writeLock;
  },

  async list(prefix: string): Promise<string[]> {
    const blob = await readBlob();
    return Object.keys(blob).filter(k => k.startsWith(prefix));
  },

  async increment(key: string, amount = 1): Promise<number> {
    let result = 0;
    writeLock = writeLock.then(async () => {
      const blob = await readBlob();
      const current = (blob[key] as number) ?? 0;
      result = current + amount;
      blob[key] = result;
      await writeBlob(blob);
    });
    await writeLock;
    return result;
  },
};
```

## Seeding on First Boot

On the first API request (or via a `/lib/seed.ts` helper called from server init), check if teams exist. If not, seed from `/seed/teams.json` and `/seed/templates.json`.

```typescript
// /lib/seed.ts
import { storage } from './storage';
import teamsSeed from '../seed/teams.json';
import templatesSeed from '../seed/templates.json';

export async function ensureSeeded(): Promise<void> {
  const existing = await storage.list('team:');
  if (existing.length > 0) return;

  for (const team of teamsSeed.teams) {
    await storage.set(`team:${team.id}`, {
      ...team,
      xp: 0,
      createdAt: new Date().toISOString(),
    });
  }

  await storage.set('templates', templatesSeed.templates);

  await storage.set('config', {
    dailyChallenge: {
      en: 'Build something that works in an African language before 12:00.',
      fr: 'Construisez quelque chose qui fonctionne dans une langue africaine avant 12h00.',
    },
    dailyChallengeUpdatedAt: new Date().toISOString(),
    enabledModules: { chat: true, voice: true, vision: true, chain: true, gallery: true },
    rateLimitPerHour: 200,
  });
}
```

Call `ensureSeeded()` at the start of every API route handler (it's cheap and idempotent).
