'use client';
import { useState } from 'react';
import { useI18n } from '@/lib/i18n-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(title);
      onClose();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('chat.save')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('common.title')}</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="bg-mest-blue hover:bg-mest-blue/90 text-white"
            >
              {saving ? t('common.loading') : t('common.save')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
