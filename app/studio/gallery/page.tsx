import { getCurrentTeam } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Gallery } from '@/components/studio/gallery';
import teamsSeed from '@/seed/teams.json';

export default async function GalleryPage() {
  const team = await getCurrentTeam();
  if (!team) redirect('/');

  // Read teams from seed file for filter dropdown
  const teams = teamsSeed.teams
    .filter(t => t.id !== 'admin')
    .map(t => ({ id: t.id, name: t.name }));

  return <Gallery teamId={team.id} teamName={team.name} xp={team.xp || 0} teams={teams} />;
}
