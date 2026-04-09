'use client';
import { useI18n } from '@/lib/i18n-context';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLocale(locale === 'en' ? 'fr' : 'en')}
      className="gap-2"
      aria-label={`Switch to ${locale === 'en' ? 'French' : 'English'}`}
    >
      <Languages size={16} />
      {locale === 'en' ? 'FR' : 'EN'}
    </Button>
  );
}
