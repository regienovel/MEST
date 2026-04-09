import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { ensureSeeded } from '@/lib/seed';
import type { Config } from '@/lib/types';

const DEFAULT_CONFIG: Config = {
  dailyChallenge: {
    en: 'Build something that works in an African language before 12:00.',
    fr: 'Construisez quelque chose qui fonctionne dans une langue africaine avant 12h00.',
  },
  dailyChallengeUpdatedAt: new Date().toISOString(),
  enabledModules: { chat: true, voice: true, vision: true, chain: true, gallery: true },
  rateLimitPerHour: 200,
};

export async function GET() {
  await ensureSeeded();
  const config = await storage.get<Config>('config');
  return NextResponse.json({ config: config || DEFAULT_CONFIG });
}
