import fs from 'fs/promises';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), '.data', 'storage.json');

// In-memory fallback for environments where the filesystem is read-only (e.g. Vercel)
let memoryBlob: Record<string, unknown> | null = null;
let useMemory = false;
let writeLock: Promise<void> = Promise.resolve();

async function readBlob(): Promise<Record<string, unknown>> {
  if (useMemory) {
    return memoryBlob || {};
  }
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
  if (useMemory) {
    memoryBlob = data;
    return;
  }
  try {
    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
  } catch (err: unknown) {
    // Filesystem is read-only (Vercel), switch to in-memory
    console.warn('[storage] filesystem write failed, switching to in-memory mode');
    useMemory = true;
    memoryBlob = data;
  }
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
