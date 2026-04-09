import { storage } from './storage';
import type { ActivityEvent } from './types';

export async function logActivity(
  type: ActivityEvent['type'],
  teamId: string,
  teamName: string,
  message: string,
  messageFr: string
): Promise<void> {
  const events = (await storage.get<ActivityEvent[]>('activity:recent')) || [];

  events.unshift({
    id: crypto.randomUUID(),
    teamId,
    teamName,
    type,
    message,
    messageFr,
    timestamp: new Date().toISOString(),
  });

  // Cap at 50 most recent
  if (events.length > 50) events.length = 50;

  await storage.set('activity:recent', events);
}
