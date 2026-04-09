import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { isAdmin } from '@/lib/auth';
import type { GalleryItem } from '@/lib/types';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;

  const item = await storage.get<GalleryItem>(`gallery:${id}`);
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Toggle featured
  item.featured = !item.featured;
  await storage.set(`gallery:${id}`, item);

  return NextResponse.json({ ok: true, featured: item.featured });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;

  await storage.delete(`gallery:${id}`);
  return NextResponse.json({ ok: true });
}
