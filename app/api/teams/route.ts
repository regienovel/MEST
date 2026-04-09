import { NextResponse } from 'next/server';
import teamsSeed from '@/seed/teams.json';

export async function GET() {
  // Read directly from seed file — works on Vercel without storage
  const teams = teamsSeed.teams
    .filter(t => t.id !== 'admin')
    .map(t => ({ id: t.id, name: t.name }));

  return NextResponse.json({ teams });
}
