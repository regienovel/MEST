import { storage } from './storage';
import teamsSeed from '../seed/teams.json';
import templatesSeed from '../seed/templates.json';

let seeded = false;

export async function ensureSeeded(): Promise<void> {
  if (seeded) return;

  const existing = await storage.list('team:');
  if (existing.length > 0) {
    seeded = true;
    return;
  }

  for (const team of teamsSeed.teams) {
    await storage.set(`team:${team.id}`, {
      id: team.id,
      name: team.name,
      password: team.password,
      xp: 0,
      createdAt: new Date().toISOString(),
    });
  }

  await storage.set('templates', (templatesSeed as Record<string, unknown>).templates ?? templatesSeed);

  await storage.set('config', {
    dailyChallenge: {
      en: 'Build something that works in an African language before 12:00.',
      fr: 'Construisez quelque chose qui fonctionne dans une langue africaine avant 12h00.',
    },
    dailyChallengeUpdatedAt: new Date().toISOString(),
    enabledModules: { chat: true, voice: true, vision: true, chain: true, gallery: true },
    rateLimitPerHour: parseInt(process.env.RATE_LIMIT_PER_HOUR || '200', 10),
  });

  seeded = true;
}
