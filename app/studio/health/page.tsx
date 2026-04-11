import { getCurrentTeam } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { HealthDashboard } from '@/components/studio/health-dashboard';

export default async function HealthPage() {
  const team = await getCurrentTeam();
  if (!team) redirect('/');

  return <HealthDashboard teamId={team.id} teamName={team.name} xp={team.xp || 0} />;
}
