'use client';
import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n-context';

export function BroadcastBanner() {
  const { locale } = useI18n();
  const [broadcast, setBroadcast] = useState<{ en: string; fr: string; expiresAt: string } | null>(null);

  useEffect(() => {
    function fetchBroadcast() {
      fetch('/api/config')
        .then(r => r.json())
        .then(d => {
          const msg = d.config?.broadcastMessage;
          if (msg && new Date(msg.expiresAt) > new Date()) {
            setBroadcast(msg);
          } else {
            setBroadcast(null);
          }
        })
        .catch(() => {});
    }
    fetchBroadcast();
    const interval = setInterval(fetchBroadcast, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!broadcast) return null;

  return (
    <div className="bg-mest-blue text-white px-6 py-3 text-center text-sm font-medium animate-pulse">
      {locale === 'fr' ? broadcast.fr : broadcast.en}
    </div>
  );
}
