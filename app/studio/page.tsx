import { getCurrentTeam } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { StudioHome } from './studio-home';

export default async function StudioPage() {
  const team = await getCurrentTeam();
  if (!team) redirect('/');

  return <StudioHome teamName={team.name} xp={team.xp || 0} />;
}
