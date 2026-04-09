import { getCurrentTeam } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ChainBuilder } from '@/components/studio/chain-builder';

export default async function ChainPage() {
  const team = await getCurrentTeam();
  if (!team) redirect('/');

  return <ChainBuilder teamName={team.name} xp={team.xp} />;
}
