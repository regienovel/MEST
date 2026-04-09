import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { ensureSeeded } from '@/lib/seed';
import type { Config } from '@/lib/types';

export async function GET() {
  await ensureSeeded();
  const config = await storage.get<Config>('config');
  return NextResponse.json({ config });
}
