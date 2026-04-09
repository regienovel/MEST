'use client';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n-context';
import { Wordmark } from '@/components/studio/wordmark';
import { LanguageToggle } from '@/components/studio/language-toggle';
import { Button } from '@/components/ui/button';
import { Trophy, LogOut } from 'lucide-react';

export function StudioHomePlaceholder({ teamName, xp }: { teamName: string; xp: number }) {
  const { t } = useI18n();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-mest-paper">
      <div className="flex items-center justify-between px-6 py-4 md:px-8 border-b border-mest-grey-300/60 bg-white">
        <Wordmark />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-mest-ink">
            <span className="px-3 py-1 rounded-full bg-mest-blue-light text-mest-blue font-semibold">
              {teamName}
            </span>
            <span className="flex items-center gap-1 text-mest-gold">
              <Trophy size={16} />
              {xp} {t('studio.xp')}
            </span>
          </div>
          <LanguageToggle />
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut size={16} />
            {t('studio.logout')}
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 md:px-8">
        <h1 className="font-serif text-4xl text-mest-ink">
          {t('studio.welcome')}, {teamName}!
        </h1>
        <p className="mt-2 text-mest-grey-500">
          {t('studio.xp')}: {xp}
        </p>
      </div>
    </div>
  );
}
