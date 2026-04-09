'use client';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n-context';
import { Wordmark } from './wordmark';
import { LanguageToggle } from './language-toggle';
import { Button } from '@/components/ui/button';
import { Trophy, LogOut } from 'lucide-react';

interface TopBarProps {
  teamName: string;
  xp: number;
}

export function TopBar({ teamName, xp }: TopBarProps) {
  const { t } = useI18n();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <div className="flex items-center justify-between px-6 py-3 md:px-8 border-b border-mest-grey-300/60 bg-white sticky top-0 z-50">
      <a href="/studio" className="hover:opacity-80 transition-opacity">
        <Wordmark />
      </a>
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline px-3 py-1 rounded-full bg-mest-blue-light text-mest-blue text-sm font-semibold">
          {teamName}
        </span>
        <span className="flex items-center gap-1 text-sm text-mest-gold font-medium">
          <Trophy size={16} />
          {xp} {t('studio.xp')}
        </span>
        <LanguageToggle />
        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5">
          <LogOut size={16} />
          <span className="hidden sm:inline">{t('studio.logout')}</span>
        </Button>
      </div>
    </div>
  );
}
