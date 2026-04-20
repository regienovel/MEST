'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useI18n } from '@/lib/i18n-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Modal } from '@/components/ui/modal';
import { NativeSelect } from '@/components/ui/native-select';
import { Loader2, Save, Send, CheckCircle2 } from 'lucide-react';
import {
  EMPTY_CARD,
  REQUIRED_FIELDS,
  completenessScore,
  type ModelCard,
} from '@/lib/model-card';
import type { TranslationKey } from '@/lib/i18n';

interface ModelCardTabProps {
  teamId: string;
  teamName: string;
}

interface SavedModelLite {
  id: string;
  name: string;
  submitted: boolean;
}

type CardState = ModelCard;

function makeBlank(teamName: string): CardState {
  return {
    ...EMPTY_CARD,
    team: teamName,
    status: 'draft',
    updatedAt: '',
  };
}

interface FieldSpec {
  key: keyof CardState;
  labelKey: TranslationKey;
  helpKey: TranslationKey;
  placeholderKey: TranslationKey;
  multiline?: boolean;
  rows?: number;
  type?: 'text' | 'date';
}

const SECTIONS: Array<{
  titleKey: TranslationKey;
  helpKey: TranslationKey;
  fields: FieldSpec[];
}> = [
  {
    titleKey: 'mc.s1.title',
    helpKey: 'mc.s1.help',
    fields: [
      { key: 'modelName', labelKey: 'mc.f.modelName', helpKey: 'mc.f.modelName.help', placeholderKey: 'mc.f.modelName.placeholder' },
      { key: 'scenario', labelKey: 'mc.f.scenario', helpKey: 'mc.f.scenario.help', placeholderKey: 'mc.f.scenario.placeholder' },
      { key: 'intendedUsers', labelKey: 'mc.f.intendedUsers', helpKey: 'mc.f.intendedUsers.help', placeholderKey: 'mc.f.intendedUsers.placeholder' },
      { key: 'intendedUseCase', labelKey: 'mc.f.intendedUseCase', helpKey: 'mc.f.intendedUseCase.help', placeholderKey: 'mc.f.intendedUseCase.placeholder', multiline: true, rows: 2 },
    ],
  },
  {
    titleKey: 'mc.s2.title',
    helpKey: 'mc.s2.help',
    fields: [
      { key: 'primaryFunction', labelKey: 'mc.f.primaryFunction', helpKey: 'mc.f.primaryFunction.help', placeholderKey: 'mc.f.primaryFunction.placeholder', multiline: true, rows: 3 },
      { key: 'exampleQueries', labelKey: 'mc.f.exampleQueries', helpKey: 'mc.f.exampleQueries.help', placeholderKey: 'mc.f.exampleQueries.placeholder', multiline: true, rows: 4 },
      { key: 'outOfScope', labelKey: 'mc.f.outOfScope', helpKey: 'mc.f.outOfScope.help', placeholderKey: 'mc.f.outOfScope.placeholder', multiline: true, rows: 2 },
    ],
  },
  {
    titleKey: 'mc.s3.title',
    helpKey: 'mc.s3.help',
    fields: [
      { key: 'knownLimitations', labelKey: 'mc.f.knownLimitations', helpKey: 'mc.f.knownLimitations.help', placeholderKey: 'mc.f.knownLimitations.placeholder', multiline: true, rows: 3 },
      { key: 'failureModes', labelKey: 'mc.f.failureModes', helpKey: 'mc.f.failureModes.help', placeholderKey: 'mc.f.failureModes.placeholder', multiline: true, rows: 3 },
      { key: 'notSuitableFor', labelKey: 'mc.f.notSuitableFor', helpKey: 'mc.f.notSuitableFor.help', placeholderKey: 'mc.f.notSuitableFor.placeholder', multiline: true, rows: 2 },
    ],
  },
  {
    titleKey: 'mc.s4.title',
    helpKey: 'mc.s4.help',
    fields: [
      { key: 'trustHonestUncertainty', labelKey: 'mc.f.trust.honestUncertainty', helpKey: 'mc.f.trust.honestUncertainty.help', placeholderKey: 'mc.f.trust.honestUncertainty.placeholder', multiline: true, rows: 2 },
      { key: 'trustSourceCitation', labelKey: 'mc.f.trust.sourceCitation', helpKey: 'mc.f.trust.sourceCitation.help', placeholderKey: 'mc.f.trust.sourceCitation.placeholder', multiline: true, rows: 2 },
      { key: 'trustContextFit', labelKey: 'mc.f.trust.contextFit', helpKey: 'mc.f.trust.contextFit.help', placeholderKey: 'mc.f.trust.contextFit.placeholder', multiline: true, rows: 2 },
      { key: 'trustRecoverability', labelKey: 'mc.f.trust.recoverability', helpKey: 'mc.f.trust.recoverability.help', placeholderKey: 'mc.f.trust.recoverability.placeholder', multiline: true, rows: 2 },
      { key: 'trustAdversarialRobustness', labelKey: 'mc.f.trust.adversarialRobustness', helpKey: 'mc.f.trust.adversarialRobustness.help', placeholderKey: 'mc.f.trust.adversarialRobustness.placeholder', multiline: true, rows: 2 },
    ],
  },
  {
    titleKey: 'mc.s5.title',
    helpKey: 'mc.s5.help',
    fields: [
      { key: 'reviewer', labelKey: 'mc.f.reviewer', helpKey: 'mc.f.reviewer.help', placeholderKey: 'mc.f.reviewer.placeholder' },
      { key: 'reviewDate', labelKey: 'mc.f.reviewDate', helpKey: 'mc.f.reviewDate.help', placeholderKey: 'mc.f.reviewDate.placeholder', type: 'date' },
      { key: 'versionHistory', labelKey: 'mc.f.versionHistory', helpKey: 'mc.f.versionHistory.help', placeholderKey: 'mc.f.versionHistory.placeholder', multiline: true, rows: 2 },
    ],
  },
  {
    titleKey: 'mc.s6.title',
    helpKey: 'mc.s6.help',
    fields: [
      { key: 'biasRisks', labelKey: 'mc.f.biasRisks', helpKey: 'mc.f.biasRisks.help', placeholderKey: 'mc.f.biasRisks.placeholder', multiline: true, rows: 2 },
      { key: 'privacyConcerns', labelKey: 'mc.f.privacyConcerns', helpKey: 'mc.f.privacyConcerns.help', placeholderKey: 'mc.f.privacyConcerns.placeholder', multiline: true, rows: 2 },
      { key: 'harmMitigation', labelKey: 'mc.f.harmMitigation', helpKey: 'mc.f.harmMitigation.help', placeholderKey: 'mc.f.harmMitigation.placeholder', multiline: true, rows: 2 },
    ],
  },
];

export function ModelCardTab({ teamId, teamName }: ModelCardTabProps) {
  const { t, locale } = useI18n();
  const [card, setCard] = useState<CardState>(makeBlank(teamName));
  const [savedModels, setSavedModels] = useState<SavedModelLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState('');
  const [submittedToast, setSubmittedToast] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | undefined>();
  const dirtyRef = useRef(false);
  const cardRef = useRef(card);
  cardRef.current = card;

  // Initial load
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/api/rag/modelcard').then(r => r.json()),
      fetch('/api/rag/models').then(r => r.json()),
    ])
      .then(([mcRes, modelsRes]) => {
        if (cancelled) return;
        const draft = mcRes.draft as ModelCard | null;
        const submitted = mcRes.submitted as ModelCard | null;
        if (draft) {
          setCard({ ...makeBlank(teamName), ...draft });
        }
        if (submitted) {
          setIsSubmitted(true);
          setSubmittedAt(submitted.submittedAt);
        }
        setSavedModels((modelsRes.models || []).map((m: { id: string; name: string; submitted: boolean }) => ({
          id: m.id, name: m.name, submitted: m.submitted,
        })));
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [teamName]);

  const saveDraft = useCallback(async (silent: boolean) => {
    if (!silent) setSaving(true); else setAutoSaving(true);
    try {
      const res = await fetch('/api/rag/modelcard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', card: cardRef.current }),
      });
      const data = await res.json();
      if (data.ok && data.card) {
        setCard(prev => ({ ...prev, updatedAt: data.card.updatedAt }));
        dirtyRef.current = false;
      }
    } catch {}
    if (!silent) setSaving(false); else setAutoSaving(false);
  }, []);

  // Auto-save every 60s if dirty
  useEffect(() => {
    const id = setInterval(() => {
      if (dirtyRef.current) saveDraft(true);
    }, 60_000);
    return () => clearInterval(id);
  }, [saveDraft]);

  function update<K extends keyof CardState>(key: K, value: CardState[K]) {
    setCard(prev => ({ ...prev, [key]: value }));
    dirtyRef.current = true;
  }

  function missingFields(): Array<keyof CardState> {
    return REQUIRED_FIELDS.filter(k => {
      const v = card[k];
      return !(typeof v === 'string' && v.trim().length > 0);
    });
  }

  async function handleSubmit() {
    setError('');
    const missing = missingFields();
    if (missing.length > 0) {
      setError(t('mc.requireFields'));
      setConfirmOpen(false);
      return;
    }
    try {
      const res = await fetch('/api/rag/modelcard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit', card }),
      });
      const data = await res.json();
      if (data.ok && data.card) {
        setIsSubmitted(true);
        setSubmittedAt(data.card.submittedAt);
        setCard(prev => ({ ...prev, updatedAt: data.card.updatedAt, submittedAt: data.card.submittedAt, status: 'submitted' }));
        setSubmittedToast(true);
        dirtyRef.current = false;
        setTimeout(() => setSubmittedToast(false), 4000);
      }
    } catch {
      setError(t('mc.requireFields'));
    }
    setConfirmOpen(false);
  }

  const completeness = completenessScore(card);
  const lastSavedLabel = card.updatedAt
    ? new Date(card.updatedAt).toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })
    : t('mc.never');

  if (loading) {
    return (
      <div className="text-center text-mest-grey-500 py-12 animate-pulse">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-mest-grey-300/60 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-serif text-2xl text-mest-ink">{t('mc.title')}</h2>
              {isSubmitted ? (
                <span className="text-xs bg-mest-sage-light text-mest-sage font-semibold px-2 py-0.5 rounded-full">
                  {t('mc.submitted')}
                </span>
              ) : (
                <span className="text-xs bg-mest-grey-100 text-mest-grey-500 font-semibold px-2 py-0.5 rounded-full">
                  {t('mc.draftBadge')}
                </span>
              )}
            </div>
            <p className="text-sm text-mest-grey-500">{t('mc.subtitle')}</p>
            <div className="flex items-center gap-3 mt-3 text-xs text-mest-grey-500">
              <span>
                {t('mc.lastSaved')}: <span className="text-mest-ink font-medium">{lastSavedLabel}</span>
              </span>
              <span>·</span>
              <span>
                {t('mc.completeness')}:{' '}
                <span className={`font-semibold ${completeness === 100 ? 'text-mest-sage' : 'text-mest-blue'}`}>
                  {completeness}%
                </span>
              </span>
              {autoSaving && (
                <span className="text-mest-blue animate-pulse">· {t('mc.autosaving')}</span>
              )}
              {submittedToast && (
                <span className="text-mest-sage font-medium">· {t('mc.submitSuccess')}</span>
              )}
            </div>
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-mest-grey-100 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full transition-all ${completeness === 100 ? 'bg-mest-sage' : 'bg-mest-blue'}`}
                style={{ width: `${completeness}%` }}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <Button
              onClick={() => saveDraft(false)}
              disabled={saving}
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {t('mc.saveDraft')}
            </Button>
            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={saving}
              size="sm"
              className="bg-mest-blue hover:bg-mest-blue/90 text-white gap-1.5"
            >
              {isSubmitted ? <CheckCircle2 size={14} /> : <Send size={14} />}
              {t('mc.submit')}
            </Button>
          </div>
        </div>

        {/* Linked model selector */}
        <div className="mt-5 pt-5 border-t border-mest-grey-300/40">
          <label className="text-sm font-medium text-mest-ink block mb-1">
            {t('mc.linkedModel')}
          </label>
          <p className="text-xs text-mest-grey-500 mb-2">{t('mc.linkedModel.help')}</p>
          <NativeSelect
            value={card.linkedModelId || ''}
            onChange={v => {
              const found = savedModels.find(m => m.id === v);
              setCard(prev => ({ ...prev, linkedModelId: v || null, linkedModelName: found?.name }));
              dirtyRef.current = true;
            }}
            className="w-full max-w-md"
          >
            <option value="">— {t('mc.linkedModel.none')} —</option>
            {savedModels.map(m => (
              <option key={m.id} value={m.id}>
                {m.name}{m.submitted ? ` · ${t('mc.submitted')}` : ''}
              </option>
            ))}
          </NativeSelect>
        </div>

        {error && (
          <p className="mt-3 text-sm text-mest-rust">{error}</p>
        )}
      </div>

      {/* Sections */}
      {SECTIONS.map((section, i) => (
        <div key={i} className="bg-white rounded-xl border border-mest-grey-300/60 p-6">
          <h3 className="font-serif text-lg text-mest-ink">{t(section.titleKey)}</h3>
          <p className="text-sm text-mest-grey-500 mb-5">{t(section.helpKey)}</p>
          <div className="space-y-5">
            {/* Section 1 has read-only Team field */}
            {i === 0 && (
              <div>
                <label className="text-sm font-medium text-mest-ink block mb-1">{t('mc.f.team')}</label>
                <Input value={teamName} disabled className="bg-mest-grey-100" />
              </div>
            )}
            {section.fields.map(f => (
              <Field
                key={String(f.key)}
                spec={f}
                value={(card[f.key] as string) || ''}
                onChange={v => update(f.key, v as never)}
                missing={REQUIRED_FIELDS.includes(f.key) && !(card[f.key] as string)?.trim()}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Submitted timestamp footer */}
      {isSubmitted && submittedAt && (
        <div className="text-center text-xs text-mest-grey-500">
          {t('mc.submitted')} · {new Date(submittedAt).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US')}
        </div>
      )}

      {/* Confirm modal */}
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title={t('mc.confirm.title')}>
        <p className="text-sm text-mest-grey-700 mb-5">{t('mc.confirm.body')}</p>
        {missingFields().length > 0 && (
          <p className="text-sm text-mest-rust mb-3">{t('mc.requireFields')}</p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setConfirmOpen(false)}>
            {t('mc.confirm.cancel')}
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={missingFields().length > 0}
            className="bg-mest-blue hover:bg-mest-blue/90 text-white"
          >
            {t('mc.confirm.submit')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

interface FieldProps {
  spec: FieldSpec;
  value: string;
  onChange: (v: string) => void;
  missing: boolean;
}

function Field({ spec, value, onChange, missing }: FieldProps) {
  const { t } = useI18n();
  const placeholder = t(spec.placeholderKey);
  return (
    <div>
      <label className="text-sm font-medium text-mest-ink block mb-1">
        {t(spec.labelKey)}
        {missing && <span className="ml-2 text-xs text-mest-rust font-normal">·</span>}
      </label>
      <p className="text-xs text-mest-grey-500 mb-2">{t(spec.helpKey)}</p>
      {spec.multiline ? (
        <Textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={spec.rows || 2}
          className={`w-full ${value ? '' : 'placeholder:italic placeholder:text-mest-grey-300'}`}
        />
      ) : (
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          type={spec.type || 'text'}
          className={value ? '' : 'placeholder:italic placeholder:text-mest-grey-300'}
        />
      )}
    </div>
  );
}
