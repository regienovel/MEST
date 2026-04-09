'use client';
import { Wordmark } from '@/components/studio/wordmark';
import { LanguageToggle } from '@/components/studio/language-toggle';
import { useI18n } from '@/lib/i18n-context';

export default function Home() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-mest-paper flex flex-col items-center justify-center gap-8 p-8">
      <Wordmark />
      <h1 className="font-serif text-4xl text-mest-ink text-center">
        {t('landing.title')}
      </h1>
      <p className="text-mest-grey-500 text-center max-w-md">
        {t('landing.subtitle')}
      </p>
      <LanguageToggle />
      <p className="text-sm text-mest-grey-300">
        {t('landing.footer')}
      </p>
    </div>
  );
}
