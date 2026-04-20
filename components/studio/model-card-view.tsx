'use client';
import { useI18n } from '@/lib/i18n-context';
import type { ModelCard } from '@/lib/model-card';
import { completenessScore, trustPropertiesCount } from '@/lib/model-card';
import type { TranslationKey } from '@/lib/i18n';

interface ViewProps {
  card: ModelCard;
  compact?: boolean;
}

const SECTIONS: Array<{
  titleKey: TranslationKey;
  fields: Array<{ key: keyof ModelCard; labelKey: TranslationKey }>;
}> = [
  {
    titleKey: 'mc.s1.title',
    fields: [
      { key: 'modelName', labelKey: 'mc.f.modelName' },
      { key: 'scenario', labelKey: 'mc.f.scenario' },
      { key: 'intendedUsers', labelKey: 'mc.f.intendedUsers' },
      { key: 'intendedUseCase', labelKey: 'mc.f.intendedUseCase' },
    ],
  },
  {
    titleKey: 'mc.s2.title',
    fields: [
      { key: 'primaryFunction', labelKey: 'mc.f.primaryFunction' },
      { key: 'exampleQueries', labelKey: 'mc.f.exampleQueries' },
      { key: 'outOfScope', labelKey: 'mc.f.outOfScope' },
    ],
  },
  {
    titleKey: 'mc.s3.title',
    fields: [
      { key: 'knownLimitations', labelKey: 'mc.f.knownLimitations' },
      { key: 'failureModes', labelKey: 'mc.f.failureModes' },
      { key: 'notSuitableFor', labelKey: 'mc.f.notSuitableFor' },
    ],
  },
  {
    titleKey: 'mc.s4.title',
    fields: [
      { key: 'trustHonestUncertainty', labelKey: 'mc.f.trust.honestUncertainty' },
      { key: 'trustSourceCitation', labelKey: 'mc.f.trust.sourceCitation' },
      { key: 'trustContextFit', labelKey: 'mc.f.trust.contextFit' },
      { key: 'trustRecoverability', labelKey: 'mc.f.trust.recoverability' },
      { key: 'trustAdversarialRobustness', labelKey: 'mc.f.trust.adversarialRobustness' },
    ],
  },
  {
    titleKey: 'mc.s5.title',
    fields: [
      { key: 'reviewer', labelKey: 'mc.f.reviewer' },
      { key: 'reviewDate', labelKey: 'mc.f.reviewDate' },
      { key: 'versionHistory', labelKey: 'mc.f.versionHistory' },
    ],
  },
  {
    titleKey: 'mc.s6.title',
    fields: [
      { key: 'biasRisks', labelKey: 'mc.f.biasRisks' },
      { key: 'privacyConcerns', labelKey: 'mc.f.privacyConcerns' },
      { key: 'harmMitigation', labelKey: 'mc.f.harmMitigation' },
    ],
  },
];

export function ModelCardView({ card, compact }: ViewProps) {
  const { t, locale } = useI18n();
  const completeness = completenessScore(card);
  const trustCount = trustPropertiesCount(card);

  return (
    <div className={compact ? 'space-y-4' : 'space-y-5'}>
      <div className="flex items-center gap-2 text-xs">
        <span className="bg-mest-blue-light text-mest-blue px-2 py-0.5 rounded-full font-semibold">
          {card.team}
        </span>
        <span className="bg-mest-grey-100 text-mest-grey-700 px-2 py-0.5 rounded">
          {t('mc.completeness')}: <span className="font-semibold">{completeness}%</span>
        </span>
        <span className="bg-mest-grey-100 text-mest-grey-700 px-2 py-0.5 rounded">
          {t('admin.mc.col.trust')}: <span className="font-semibold">{trustCount}/5</span>
        </span>
        {card.submittedAt && (
          <span className="text-mest-grey-500">
            {new Date(card.submittedAt).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US')}
          </span>
        )}
      </div>

      {SECTIONS.map((s, i) => (
        <div key={i} className="border border-mest-grey-300/50 rounded-lg p-4">
          <h4 className="font-serif text-base text-mest-ink mb-3">{t(s.titleKey)}</h4>
          <dl className="space-y-2">
            {s.fields.map(f => {
              const value = (card[f.key] as string) || '';
              return (
                <div key={String(f.key)}>
                  <dt className="text-xs font-semibold text-mest-grey-500 mb-0.5">{t(f.labelKey)}</dt>
                  <dd className={`text-sm whitespace-pre-wrap ${value ? 'text-mest-grey-700' : 'text-mest-grey-300 italic'}`}>
                    {value || '—'}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      ))}
    </div>
  );
}
