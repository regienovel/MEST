'use client';
import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n-context';
import { Trophy } from 'lucide-react';

export function DailyChallenge() {
  const { t, locale } = useI18n();
  const [challenge, setChallenge] = useState<{ en: string; fr: string } | null>(null);

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(d => {
        if (d.config?.dailyChallenge) setChallenge(d.config.dailyChallenge);
      })
      .catch(() => {});
  }, []);

  if (!challenge) return null;

  return (
    <div className="bg-mest-gold-light rounded-xl border border-mest-gold/30 p-6">
      <div className="flex items-center gap-2 mb-2">
        <Trophy size={20} className="text-mest-gold" />
        <h3 className="font-serif text-lg text-mest-ink">{t('studio.dailyChallenge')}</h3>
      </div>
      <p className="text-sm text-mest-grey-700">
        {locale === 'fr' ? challenge.fr : challenge.en}
      </p>
    </div>
  );
}
