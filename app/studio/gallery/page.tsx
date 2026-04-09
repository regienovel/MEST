import { getCurrentTeam } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { storage } from '@/lib/storage';
import { ensureSeeded } from '@/lib/seed';
import { Gallery } from '@/components/studio/gallery';
import type { Team } from '@/lib/types';

export default async function GalleryPage() {
  await ensureSeeded();
  const team = await getCurrentTeam();
  if (!team) redirect('/');

  // Get teams for filter dropdown
  const keys = await storage.list('team:');
  const teams: Array<{ id: string; name: string }> = [];
  for (const key of keys) {
    const t = await storage.get<Team>(key);
    if (t && t.id !== 'admin' && !t.disabled) {
      teams.push({ id: t.id, name: t.name });
    }
  }

  return <Gallery teamName={team.name} xp={team.xp} teams={teams} />;
}
