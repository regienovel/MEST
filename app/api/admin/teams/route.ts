import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { isAdmin } from '@/lib/auth';
import type { Team } from '@/lib/types';

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, name, password } = await req.json();
  if (!id || !name || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const existing = await storage.get<Team>(`team:${id}`);
  if (existing) {
    return NextResponse.json({ error: 'Team already exists' }, { status: 409 });
  }

  const team: Team = {
    id,
    name,
    password,
    xp: 0,
    createdAt: new Date().toISOString(),
  };

  await storage.set(`team:${id}`, team);
  return NextResponse.json({ ok: true });
}
