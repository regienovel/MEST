'use client';
import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';
import { Modal } from '@/components/ui/modal';
import { Save, Upload, Trash2, Loader2, CheckCircle } from 'lucide-react';
import type { RagConfig, SavedModel } from '@/lib/rag-config';

const DEFAULT_CONFIG: RagConfig = {
  chunkStrategy: 'paragraph',
  chunkSize: 500,
  chunkOverlap: 50,
  topK: 5,
  enableReranking: true,
  rerankModel: 'claude-sonnet',
  strictThreshold: 0.15,
  generationModel: 'gpt-4o',
  systemPrompt: `You are an Air Canada customer service assistant. You answer questions about bereavement fares, refunds, and policies using ONLY the provided source documents. If the answer is not in the documents, say the refusal message. You always cite the document you are quoting from using the citation markers provided. Be helpful, concise, and honest about what you don't know.`,
  refusalMessage: "I don't know — this answer is not in the source documents. Please contact Air Canada customer service for assistance.",
  temperature: 0.2,
  citationStyle: 'inline',
};

interface ConfigureTabProps {
  teamId: string;
  onConfigChange?: (config: RagConfig) => void;
  activeModelName?: string;
  onActiveModelChange?: (name: string | null) => void;
}

export function ConfigureTab({ teamId, onConfigChange, onActiveModelChange }: ConfigureTabProps) {
  const { t } = useI18n();
  const [config, setConfig] = useState<RagConfig>(DEFAULT_CONFIG);
  const [models, setModels] = useState<SavedModel[]>([]);
  const [saving, setSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [modelName, setModelName] = useState('');
  const [modelDesc, setModelDesc] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Load config and models
  const fetchData = useCallback(() => {
    Promise.all([
      fetch('/api/rag/config').then(r => r.json()),
      fetch('/api/rag/models').then(r => r.json()),
    ]).then(([configData, modelsData]) => {
      if (configData.config) {
        setConfig({ ...DEFAULT_CONFIG, ...configData.config });
      }
      if (modelsData.models) setModels(modelsData.models);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-save config on change (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetch('/api/rag/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      }).catch(() => {});
      onConfigChange?.(config);
    }, 500);
    return () => clearTimeout(timeout);
  }, [config, onConfigChange]);

  const updateConfig = (key: keyof RagConfig, value: unknown) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveModel = async () => {
    if (!modelName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/rag/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', name: modelName, description: modelDesc }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage({ type: 'success', text: `"${modelName}" ${t('config.saved')}` });
        onActiveModelChange?.(modelName);
        setShowSaveModal(false);
        setModelName('');
        setModelDesc('');
        fetchData();
      }
    } catch {
      setMessage({ type: 'error', text: 'Save failed' });
    }
    setSaving(false);
  };

  const handleDeleteModel = async (modelId: string) => {
    if (!confirm(t('config.deleteModel'))) return;
    await fetch('/api/rag/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', modelId }),
    });
    fetchData();
  };

  const handleLoadModel = (model: SavedModel) => {
    setConfig(model.config);
    onActiveModelChange?.(model.name);
    setMessage({ type: 'success', text: `${t('config.load')}: "${model.name}"` });
  };

  const handleSubmitModel = async (modelId: string, modelName: string) => {
    if (!confirm(t('config.submitConfirm'))) return;
    const res = await fetch('/api/rag/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelId }),
    });
    const data = await res.json();
    if (data.ok) {
      setMessage({ type: 'success', text: `"${modelName}" ${t('config.submittedMsg')}` });
      fetchData();
    } else {
      setMessage({ type: 'error', text: data.error || 'Submit failed' });
    }
  };

  if (loading) return <div className="text-center py-12 text-mest-grey-500 animate-pulse">{t('common.loading')}</div>;

  return (
    <div className="space-y-6">
      {message && (
        <div className={`px-4 py-2 rounded-lg text-sm ${message.type === 'success' ? 'bg-mest-sage-light text-mest-sage' : 'bg-mest-rust-light text-mest-rust'}`}>
          {message.text}
        </div>
      )}

      {/* Saved Models */}
      {models.length > 0 && (
        <div className="bg-white rounded-xl border border-mest-grey-300/60 p-4">
          <h3 className="text-sm font-semibold text-mest-ink mb-3">{t('config.savedModels')}</h3>
          <div className="space-y-2">
            {models.map(model => (
              <div key={model.id} className="flex items-center gap-3 p-3 rounded-lg bg-mest-grey-50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-mest-ink">{model.name}</span>
                    {model.submitted && (
                      <span className="text-xs bg-mest-sage-light text-mest-sage px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle size={10} /> {t('config.submitted')}
                      </span>
                    )}
                  </div>
                  {model.description && <p className="text-xs text-mest-grey-500 mt-0.5">{model.description}</p>}
                  <p className="text-xs text-mest-grey-300 mt-0.5">{new Date(model.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline" onClick={() => handleLoadModel(model)} className="text-xs">{t('config.load')}</Button>
                  {!model.submitted && (
                    <Button size="sm" onClick={() => handleSubmitModel(model.id, model.name)} className="bg-mest-gold hover:bg-mest-gold/90 text-white text-xs gap-1">
                      <Upload size={12} /> {t('config.submit')}
                    </Button>
                  )}
                  <button onClick={() => handleDeleteModel(model.id)} className="p-1 hover:bg-mest-rust-light rounded text-mest-grey-300 hover:text-mest-rust">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Configuration Form */}
      <div className="bg-white rounded-xl border border-mest-grey-300/60 p-6 space-y-5">
        <h3 className="font-serif text-lg text-mest-ink">{t('config.title')}</h3>

        {/* Chunking */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-mest-ink block mb-1">{t('config.chunkStrategy')}</label>
            <NativeSelect value={config.chunkStrategy} onChange={v => updateConfig('chunkStrategy', v)}>
              <option value="paragraph">{t('config.byParagraph')}</option>
              <option value="fixed">{t('config.fixedSize')}</option>
              <option value="semantic">{t('config.semantic')}</option>
            </NativeSelect>
          </div>
          {config.chunkStrategy === 'fixed' && (
            <>
              <div>
                <label className="text-sm font-medium text-mest-ink block mb-1">{t('config.chunkSize')}</label>
                <Input type="number" value={config.chunkSize} onChange={e => updateConfig('chunkSize', parseInt(e.target.value) || 500)} />
              </div>
              <div>
                <label className="text-sm font-medium text-mest-ink block mb-1">{t('config.chunkOverlap')}</label>
                <Input type="number" value={config.chunkOverlap} onChange={e => updateConfig('chunkOverlap', parseInt(e.target.value) || 50)} />
              </div>
            </>
          )}
        </div>

        {/* Retrieval */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-mest-ink block mb-1">{t('config.topK')}</label>
            <Input type="number" min={1} max={20} value={config.topK} onChange={e => updateConfig('topK', parseInt(e.target.value) || 5)} />
            <p className="text-xs text-mest-grey-500 mt-1">{t('config.topKDesc')}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-mest-ink block mb-1">{t('config.reranking')}</label>
            <NativeSelect value={config.enableReranking ? 'on' : 'off'} onChange={v => updateConfig('enableReranking', v === 'on')}>
              <option value="on">{t('config.enabled')}</option>
              <option value="off">{t('config.disabled')}</option>
            </NativeSelect>
          </div>
          {config.enableReranking && (
            <div>
              <label className="text-sm font-medium text-mest-ink block mb-1">{t('config.rerankModel')}</label>
              <NativeSelect value={config.rerankModel} onChange={v => updateConfig('rerankModel', v)}>
                <option value="claude-sonnet">Claude Sonnet</option>
                <option value="gpt-4o">GPT-4o</option>
              </NativeSelect>
            </div>
          )}
        </div>

        {/* Generation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-mest-ink block mb-1">{t('config.genModel')}</label>
            <NativeSelect value={config.generationModel} onChange={v => updateConfig('generationModel', v)}>
              <option value="gpt-4o">GPT-4o</option>
              <option value="claude-sonnet">Claude Sonnet</option>
            </NativeSelect>
          </div>
          <div>
            <label className="text-sm font-medium text-mest-ink block mb-1">{t('config.temperature')}: {config.temperature}</label>
            <input type="range" min={0} max={1} step={0.05} value={config.temperature}
              onChange={e => updateConfig('temperature', parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-mest-grey-500 mt-1">{t('config.tempDesc')}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-mest-ink block mb-1">{t('config.strictThreshold')}: {config.strictThreshold}</label>
            <input type="range" min={0} max={1} step={0.05} value={config.strictThreshold}
              onChange={e => updateConfig('strictThreshold', parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-mest-grey-500 mt-1">{t('config.strictDesc')}</p>
          </div>
        </div>

        {/* Citation */}
        <div>
          <label className="text-sm font-medium text-mest-ink block mb-1">{t('config.citationStyle')}</label>
          <NativeSelect value={config.citationStyle} onChange={v => updateConfig('citationStyle', v)} className="w-48">
            <option value="inline">{t('config.citationInline')}</option>
            <option value="footnote">{t('config.citationFootnote')}</option>
            <option value="none">{t('config.citationNone')}</option>
          </NativeSelect>
        </div>

        {/* System Prompt */}
        <div>
          <label className="text-sm font-medium text-mest-ink block mb-1">{t('config.systemPrompt')}</label>
          <Textarea
            value={config.systemPrompt}
            onChange={e => updateConfig('systemPrompt', e.target.value)}
            rows={5}
            className="resize-y font-mono text-xs"
            placeholder={t('config.systemPromptPlaceholder')}
          />
          <p className="text-xs text-mest-grey-500 mt-1">{t('config.systemPromptDesc')}</p>
        </div>

        {/* Refusal Message */}
        <div>
          <label className="text-sm font-medium text-mest-ink block mb-1">{t('config.refusalMessage')}</label>
          <Input
            value={config.refusalMessage}
            onChange={e => updateConfig('refusalMessage', e.target.value)}
            placeholder={t('config.refusalPlaceholder')}
          />
        </div>
      </div>

      {/* Save as Model button */}
      <div className="flex justify-end">
        <Button onClick={() => setShowSaveModal(true)} className="bg-mest-blue hover:bg-mest-blue/90 text-white gap-2">
          <Save size={16} />
          {t('config.saveAsModel')}
        </Button>
      </div>

      {/* Save Modal */}
      <Modal open={showSaveModal} onClose={() => setShowSaveModal(false)} title={t('config.saveAsModel')}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-mest-ink block mb-1">{t('config.modelName')} *</label>
            <Input value={modelName} onChange={e => setModelName(e.target.value)} placeholder="e.g. Strict Air Canada v1" />
          </div>
          <div>
            <label className="text-sm font-medium text-mest-ink block mb-1">{t('config.modelDesc')}</label>
            <Input value={modelDesc} onChange={e => setModelDesc(e.target.value)} placeholder="e.g. Higher threshold, more cautious refusals" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowSaveModal(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSaveModel} disabled={saving || !modelName.trim()} className="bg-mest-blue hover:bg-mest-blue/90 text-white">
              {saving ? <Loader2 size={14} className="animate-spin" /> : t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
