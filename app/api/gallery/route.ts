import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { ensureSeeded } from '@/lib/seed';
import { awardXp } from '@/lib/usage';
import { logActivity } from '@/lib/activity';
import type { Session, Team, GalleryItem } from '@/lib/types';

export async function GET(req: NextRequest) {
  await ensureSeeded();

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const teamId = searchParams.get('teamId');
  const sort = searchParams.get('sort') || 'newest';

  const keys = await storage.list('gallery:');
  const items: GalleryItem[] = [];

  for (const key of keys) {
    const item = await storage.get<GalleryItem>(key);
    if (item) {
      if (type && type !== 'all' && item.type !== type) continue;
      if (teamId && teamId !== 'all' && item.teamId !== teamId) continue;
      items.push(item);
    }
  }

  if (sort === 'newest') items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  else if (sort === 'views') items.sort((a, b) => b.views - a.views);
  else if (sort === 'forks') items.sort((a, b) => b.forks - a.forks);
  else if (sort === 'featured') items.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  await ensureSeeded();

  const sessionId = req.cookies.get('mest_session')?.value;
  if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const session = await storage.get<Session>(`session:${sessionId}`);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const team = await storage.get<Team>(`team:${session.teamId}`);
  if (!team) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { type, title, description, data } = body;

  const id = crypto.randomUUID();
  const item: GalleryItem = {
    id,
    teamId: team.id,
    teamName: team.name,
    type,
    title: title || 'Untitled',
    description,
    data,
    createdAt: new Date().toISOString(),
    views: 0,
    forks: 0,
    featured: false,
  };

  await storage.set(`gallery:${id}`, item);
  await awardXp(team.id, 10);

  const typeLabel = type === 'chat' ? 'conversation' : type === 'voice' ? 'voice recording' : type === 'vision' ? 'image analysis' : 'chain';
  const typeLabelFr = type === 'chat' ? 'conversation' : type === 'voice' ? 'enregistrement vocal' : type === 'vision' ? "analyse d'image" : 'chaîne';

  await logActivity(
    `${type}-saved` as 'chat-saved',
    team.id,
    team.name,
    `saved a ${typeLabel}: "${title}"`,
    `a sauvegardé une ${typeLabelFr}: "${title}"`
  );

  return NextResponse.json({ ok: true, id });
}
