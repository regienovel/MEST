import { cookies } from 'next/headers';
import { storage } from './storage';
import type { Session, Team } from './types';

export async function getCurrentTeam(): Promise<Team | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('mest_session')?.value;
  if (!sessionId) return null;

  const session = await storage.get<Session>(`session:${sessionId}`);
  if (!session) return null;

  if (new Date(session.expiresAt) < new Date()) {
    await storage.delete(`session:${sessionId}`);
    return null;
  }

  const team = await storage.get<Team>(`team:${session.teamId}`);
  if (!team || team.disabled) return null;

  return team;
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
