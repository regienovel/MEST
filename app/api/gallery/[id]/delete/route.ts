import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import type { GalleryItem } from '@/lib/types';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const teamCookie = req.cookies.get('mest_team')?.value;
  if (!teamCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let team: { id: string };
  try { team = JSON.parse(decodeURIComponent(teamCookie)); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const item = await storage.get<GalleryItem>(`gallery:${id}`);
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Only allow teams to delete their own items
  if (item.teamId !== team.id) {
    return NextResponse.json({ error: 'You can only delete your own items' }, { status: 403 });
  }

  await storage.delete(`gallery:${id}`);
  await storage.delete(`chain:${id}`);

  return NextResponse.json({ ok: true });
}
