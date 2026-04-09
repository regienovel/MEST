import { getCurrentTeam } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ChatLab } from '@/components/studio/chat-lab';

export default async function ChatPage() {
  const team = await getCurrentTeam();
  if (!team) redirect('/');

  return <ChatLab teamName={team.name} xp={team.xp} />;
}
