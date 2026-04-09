'use client';
import { useI18n } from '@/lib/i18n-context';
import { TopBar } from '@/components/studio/top-bar';
import { ModuleCard } from '@/components/studio/module-card';
import { ActivityFeed } from '@/components/studio/activity-feed';
import { DailyChallenge } from '@/components/studio/daily-challenge';
import { BroadcastBanner } from '@/components/studio/broadcast-banner';
import { MessageSquare, Mic, Eye, Workflow, LayoutGrid } from 'lucide-react';

interface StudioHomeProps {
  teamName: string;
  xp: number;
}

export function StudioHome({ teamName, xp }: StudioHomeProps) {
  const { t } = useI18n();

  const modules = [
    {
      title: t('studio.modules.chat'),
      description: t('studio.modules.chat.desc'),
      href: '/studio/chat',
      icon: MessageSquare,
      borderColor: 'border-l-4 border-l-mest-blue',
    },
    {
      title: t('studio.modules.voice'),
      description: t('studio.modules.voice.desc'),
      href: '/studio/voice',
      icon: Mic,
      borderColor: 'border-l-4 border-l-mest-teal',
    },
    {
      title: t('studio.modules.vision'),
      description: t('studio.modules.vision.desc'),
      href: '/studio/vision',
      icon: Eye,
      borderColor: 'border-l-4 border-l-mest-gold',
    },
    {
      title: t('studio.modules.chain'),
      description: t('studio.modules.chain.desc'),
      href: '/studio/chain',
      icon: Workflow,
      borderColor: 'border-l-4 border-l-mest-rust',
    },
    {
      title: t('studio.modules.gallery'),
      description: t('studio.modules.gallery.desc'),
      href: '/studio/gallery',
      icon: LayoutGrid,
      borderColor: 'border-l-4 border-l-mest-sage',
    },
  ];

  return (
    <div className="min-h-screen bg-mest-paper">
      <TopBar teamName={teamName} xp={xp} />
      <BroadcastBanner />

      <div className="max-w-7xl mx-auto px-6 py-8 md:px-8">
        <h1 className="font-serif text-4xl text-mest-ink mb-2">
          {t('studio.welcome')}, {teamName}!
        </h1>

        <div className="mt-8 space-y-8">
          <DailyChallenge />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map(mod => (
              <ModuleCard key={mod.href} {...mod} />
            ))}
          </div>

          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
