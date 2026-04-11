import { getCurrentTeam } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { RagLab } from '@/components/studio/rag-lab';

export default async function RagPage() {
  const team = await getCurrentTeam();
  if (!team) redirect('/');

  return <RagLab teamId={team.id} teamName={team.name} xp={team.xp || 0} />;
}
