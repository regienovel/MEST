import { cookies } from 'next/headers';
import type { Team } from './types';

export async function getCurrentTeam(): Promise<Team | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('mest_session')?.value;
  if (!sessionId) return null;

  // Read team info directly from cookie (works across serverless instances)
  const teamCookie = cookieStore.get('mest_team')?.value;
  if (!teamCookie) return null;

  try {
    const team = JSON.parse(decodeURIComponent(teamCookie)) as Team;
    if (!team.id) return null;
    return team;
  } catch {
    return null;
  }
}

export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get('mest_admin')?.value === '1';
}

export async function requireTeam(): Promise<Team> {
  const team = await getCurrentTeam();
  if (!team) throw new Error('Unauthorized');
  return team;
}
