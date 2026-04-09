import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { isAdmin } from '@/lib/auth';
import type { Config } from '@/lib/types';

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { en, fr } = await req.json();
  const config = await storage.get<Config>('config');
  if (!config) return NextResponse.json({ error: 'Config not found' }, { status: 500 });

  config.dailyChallenge = { en, fr };
  config.dailyChallengeUpdatedAt = new Date().toISOString();

  await storage.set('config', config);
  return NextResponse.json({ ok: true });
}
