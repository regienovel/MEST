'use client';
import { useState } from 'react';
import { useI18n } from '@/lib/i18n-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';

interface SaveDialogProps {
  open: boolean;
  onClose: () => void;
  defaultTitle: string;
  onSave: (title: string) => Promise<void>;
}

export function SaveDialog({ open, onClose, defaultTitle, onSave }: SaveDialogProps) {
  const { t } = useI18n();
  const [title, setTitle] = useState(defaultTitle);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      await onSave(title);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch {
      setError('Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('chat.save')}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>{t('common.title')}</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        {error && (
          <p className="text-sm text-mest-rust">{error}</p>
        )}
        {success && (
          <p className="text-sm text-mest-sage font-medium">Saved to Gallery!</p>
        )}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            onClick={handleSave}
            disabled={saving || !title.trim() || success}
            className="bg-mest-blue hover:bg-mest-blue/90 text-white"
          >
            {saving ? t('common.loading') : success ? '✓' : t('common.save')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
