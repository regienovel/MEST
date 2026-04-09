'use client';
import { useState } from 'react';
import { useI18n } from '@/lib/i18n-context';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface SystemPromptPanelProps {
  value: string;
  onChange: (v: string) => void;
}

const PRESETS: Record<string, { en: string; fr: string }> = {
  trader: {
    en: 'You are a West African market trader with 20 years of experience. You know prices, supply chains, and negotiation tactics across the region. Respond naturally and knowledgeably.',
    fr: 'Vous êtes un(e) commerçant(e) de marché ouest-africain(e) avec 20 ans d\'expérience. Vous connaissez les prix, les chaînes d\'approvisionnement et les tactiques de négociation dans la région.',
  },
  healthWorker: {
    en: 'You are a community health worker who speaks Twi. When possible, include Twi phrases alongside English. Focus on practical, accessible health advice for rural communities.',
    fr: 'Vous êtes un(e) agent(e) de santé communautaire qui parle twi. Incluez des phrases en twi quand c\'est possible. Concentrez-vous sur des conseils de santé pratiques et accessibles.',
  },
  logistics: {
    en: 'You are a francophone logistics coordinator managing supply chains across West Africa. You think in terms of routes, costs, customs, and delivery timelines. Respond in French unless asked otherwise.',
    fr: 'Vous êtes coordinateur(trice) logistique francophone gérant les chaînes d\'approvisionnement en Afrique de l\'Ouest. Répondez en français.',
  },
  critic: {
    en: 'You are an honest critic. Point out flaws, weaknesses, and risks in any idea or plan presented to you. Be constructive but unflinching.',
    fr: 'Vous êtes un(e) critique honnête. Identifiez les défauts, faiblesses et risques de toute idée ou plan présenté. Soyez constructif(ve) mais sans concession.',
  },
};

export function SystemPromptPanel({ value, onChange }: SystemPromptPanelProps) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [presetKey, setPresetKey] = useState('none');

  const handlePreset = (key: string) => {
    setPresetKey(key);
    if (key === 'none') {
      onChange('');
    } else if (PRESETS[key]) {
      onChange(locale === 'fr' ? PRESETS[key].fr : PRESETS[key].en);
    }
  };

  return (
    <div className="border-b border-mest-grey-300/60">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2 text-sm text-mest-grey-700 hover:bg-mest-grey-50"
      >
        <span>{t('chat.systemPrompt')}</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          <NativeSelect value={presetKey} onChange={handlePreset}>
            <option value="none">{t('chat.preset.none')}</option>
            <option value="trader">{t('chat.preset.trader')}</option>
            <option value="healthWorker">{t('chat.preset.healthWorker')}</option>
            <option value="logistics">{t('chat.preset.logistics')}</option>
            <option value="critic">{t('chat.preset.critic')}</option>
          </NativeSelect>
          <Textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={t('chat.systemPrompt.placeholder')}
            rows={3}
            className="resize-none"
          />
        </div>
      )}
    </div>
  );
}
