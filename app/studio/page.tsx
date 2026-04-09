import { getCurrentTeam } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { StudioHomePlaceholder } from './studio-home-placeholder';

export default async function StudioPage() {
  const team = await getCurrentTeam();
  if (!team) redirect('/');

  return <StudioHomePlaceholder teamName={team.name} xp={team.xp} />;
}
