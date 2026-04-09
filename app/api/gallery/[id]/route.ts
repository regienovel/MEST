import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { ensureSeeded } from '@/lib/seed';
import type { GalleryItem } from '@/lib/types';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeeded();
  const { id } = await params;

  const item = await storage.get<GalleryItem>(`gallery:${id}`);
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Increment views
  item.views = (item.views || 0) + 1;
  await storage.set(`gallery:${id}`, item);

  return NextResponse.json({ item });
}
