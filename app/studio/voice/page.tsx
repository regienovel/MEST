import { getCurrentTeam } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { VoiceLab } from '@/components/studio/voice-lab';

export default async function VoicePage() {
  const team = await getCurrentTeam();
  if (!team) redirect('/');

  return <VoiceLab teamName={team.name} xp={team.xp} />;
}
