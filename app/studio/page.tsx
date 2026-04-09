import { getCurrentTeam } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ensureSeeded } from '@/lib/seed';
import { StudioHome } from './studio-home';

export default async function StudioPage() {
  await ensureSeeded();
  const team = await getCurrentTeam();
  if (!team) redirect('/');

  return <StudioHome teamName={team.name} xp={team.xp} />;
}
