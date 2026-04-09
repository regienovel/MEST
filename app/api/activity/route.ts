import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { ensureSeeded } from '@/lib/seed';
import type { ActivityEvent } from '@/lib/types';

export async function GET() {
  await ensureSeeded();
  const events = (await storage.get<ActivityEvent[]>('activity:recent')) || [];
  return NextResponse.json({ events });
}
