import { NextRequest, NextResponse } from 'next/server';
import teamsSeed from '@/seed/teams.json';

export async function POST(req: NextRequest) {
  try {
    const { teamId, password, adminPassword } = await req.json();

    if (!teamId || !password) {
      return NextResponse.json({ ok: false, error: 'Missing team or password' }, { status: 400 });
    }

    // Validate against seed file directly — works on Vercel without storage
    const team = teamsSeed.teams.find(t => t.id === teamId);
    if (!team || team.password !== password) {
      return NextResponse.json({ ok: false, error: 'Invalid team or password' }, { status: 401 });
    }

    const sessionId = crypto.randomUUID();

    const isAdmin = adminPassword && adminPassword === process.env.ADMIN_PASSWORD;

    const res = NextResponse.json({
      ok: true,
      team: { id: team.id, name: team.name, xp: 0 },
      isAdmin,
    });

    res.cookies.set('mest_session', sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 86400,
    });

    // Store team info in cookie so server components work across serverless instances
    const teamData = { id: team.id, name: team.name, xp: 0, password: team.password, createdAt: new Date().toISOString() };
    res.cookies.set('mest_team', encodeURIComponent(JSON.stringify(teamData)), {
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
