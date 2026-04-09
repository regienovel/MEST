'use client';
import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n-context';

interface ActivityEvent {
  id: string;
  teamName: string;
  message: string;
  messageFr: string;
  timestamp: string;
}

export function ActivityFeed() {
  const { t, locale } = useI18n();
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    function fetchActivity() {
      fetch('/api/activity')
        .then(r => r.json())
        .then(d => setEvents(d.events || []))
        .catch(() => {});
    }
    fetchActivity();
    const interval = setInterval(fetchActivity, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-xl border border-mest-grey-300/60 shadow-sm p-6">
      <h3 className="font-serif text-xl text-mest-ink mb-4">{t('studio.activity.title')}</h3>
      {events.length === 0 ? (
        <p className="text-sm text-mest-grey-500 italic">{t('studio.activity.empty')}</p>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {events.slice(0, 15).map(event => (
            <div key={event.id} className="flex items-start gap-3 text-sm">
              <span className="font-semibold text-mest-blue shrink-0">{event.teamName}</span>
              <span className="text-mest-grey-700">{locale === 'fr' ? event.messageFr : event.message}</span>
              <span className="text-mest-grey-300 text-xs shrink-0 ml-auto">
                {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
