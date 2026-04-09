import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { ensureSeeded } from '@/lib/seed';
import templatesSeed from '@/seed/templates.json';

export async function GET() {
  await ensureSeeded();

  // Try storage first, fall back to seed file
  const stored = await storage.get<unknown[]>('templates');
  const templates = stored || templatesSeed.templates;

  return NextResponse.json({ templates });
}
