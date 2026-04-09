import { storage } from './storage';
import type { Team } from './types';

export async function awardXp(teamId: string, amount: number): Promise<void> {
  const team = await storage.get<Team>(`team:${teamId}`);
  if (team) {
    team.xp = (team.xp || 0) + amount;
    await storage.set(`team:${teamId}`, team);
  }
}
