import { storage } from './storage';
import teamsSeed from '../seed/teams.json';
import templatesSeed from '../seed/templates.json';

let seeded = false;

export async function ensureSeeded(): Promise<void> {
  if (seeded) return;

  // Seed each team individually if it doesn't exist yet
  // This handles both fresh databases AND team list changes
  for (const team of teamsSeed.teams) {
    const existing = await storage.get(`team:${team.id}`);
    if (!existing) {
      await storage.set(`team:${team.id}`, {
        id: team.id,
        name: team.name,
        password: team.password,
        xp: 0,
        createdAt: new Date().toISOString(),
      });
    }
  }

  // Seed config if missing
  const config = await storage.get('config');
  if (!config) {
    await storage.set('config', {
      dailyChallenge: {
        en: 'Build something that works in an African language before 12:00.',
        fr: 'Construisez quelque chose qui fonctionne dans une langue africaine avant 12h00.',
      },
      dailyChallengeUpdatedAt: new Date().toISOString(),
      enabledModules: { chat: true, voice: true, vision: true, chain: true, gallery: true },
      rateLimitPerHour: parseInt(process.env.RATE_LIMIT_PER_HOUR || '200', 10),
    });
  }

  // Seed templates if missing
  const templates = await storage.get('templates');
  if (!templates) {
    await storage.set('templates', (templatesSeed as Record<string, unknown>).templates ?? templatesSeed);
  }

  seeded = true;
}
