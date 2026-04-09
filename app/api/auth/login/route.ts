import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { ensureSeeded } from '@/lib/seed';
import type { Team } from '@/lib/types';

export async function POST(req: NextRequest) {
  await ensureSeeded();

  try {
    const { teamId, password, adminPassword } = await req.json();

    if (!teamId || !password) {
      return NextResponse.json({ ok: false, error: 'Missing team or password' }, { status: 400 });
    }

    const team = await storage.get<Team>(`team:${teamId}`);
    if (!team || team.password !== password) {
      return NextResponse.json({ ok: false, error: 'Invalid team or password' }, { status: 401 });
    }

    if (team.disabled) {
      return NextResponse.json({ ok: false, error: 'Team is disabled' }, { status: 403 });
    }

    const sessionId = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    await storage.set(`session:${sessionId}`, {
      id: sessionId,
      teamId: team.id,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });

    const isAdmin = adminPassword && adminPassword === process.env.ADMIN_PASSWORD;

    const res = NextResponse.json({
      ok: true,
      team: { id: team.id, name: team.name, xp: team.xp },
      isAdmin,
    });

    res.cookies.set('mest_session', sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 86400,
    });

    if (isAdmin) {
      res.cookies.set('mest_admin', '1', {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 86400,
      });
    }

    return res;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
}
