import { getCurrentTeam } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ChatPage() {
  const team = await getCurrentTeam();
  if (!team) redirect('/');

  return (
    <div className="min-h-screen bg-mest-paper flex items-center justify-center">
      <p className="text-mest-grey-500">Chat Lab — Coming soon</p>
    </div>
  );
}
