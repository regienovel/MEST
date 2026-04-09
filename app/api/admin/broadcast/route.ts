import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { isAdmin } from '@/lib/auth';
import type { Config } from '@/lib/types';

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { en, fr, durationMinutes = 10 } = await req.json();
  const config = await storage.get<Config>('config');
  if (!config) return NextResponse.json({ error: 'Config not found' }, { status: 500 });

  config.broadcastMessage = {
    en,
    fr,
    expiresAt: new Date(Date.now() + durationMinutes * 60000).toISOString(),
  };

  await storage.set('config', config);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const config = await storage.get<Config>('config');
  if (config) {
    delete config.broadcastMessage;
    await storage.set('config', config);
  }

  return NextResponse.json({ ok: true });
}
