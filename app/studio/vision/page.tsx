import { getCurrentTeam } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { VisionLab } from '@/components/studio/vision-lab';

export default async function VisionPage() {
  const team = await getCurrentTeam();
  if (!team) redirect('/');

  return <VisionLab teamName={team.name} xp={team.xp} />;
}
