import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { isAdmin } from '@/lib/auth';
import type { Team } from '@/lib/types';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;

  const team = await storage.get<Team>(`team:${id}`);
  if (!team) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updates = await req.json();
  if (updates.name !== undefined) team.name = updates.name;
  if (updates.password !== undefined) team.password = updates.password;
  if (updates.disabled !== undefined) team.disabled = updates.disabled;
  if (updates.xp !== undefined) team.xp = updates.xp;

  await storage.set(`team:${id}`, team);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;

  await storage.delete(`team:${id}`);
  return NextResponse.json({ ok: true });
}
