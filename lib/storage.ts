import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export const storage = {
  async get<T>(key: string): Promise<T | null> {
    const value = await redis.get(key);
    if (value === null || value === undefined) return null;
    // Upstash auto-parses JSON, so value is already the right type
    return value as T;
  },

  async set<T>(key: string, value: T): Promise<void> {
    await redis.set(key, value);
  },

  async delete(key: string): Promise<void> {
    await redis.del(key);
  },

  async list(prefix: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';
    do {
      const result = await redis.scan(Number(cursor), { match: `${prefix}*`, count: 100 });
      cursor = String(result[0]);
      keys.push(...(result[1] as string[]));
    } while (cursor !== '0');
    return keys;
  },

  async increment(key: string, amount = 1): Promise<number> {
    const current = await redis.get<number>(key);
    const newVal = (current ?? 0) + amount;
    await redis.set(key, newVal);
    return newVal;
  },
};
