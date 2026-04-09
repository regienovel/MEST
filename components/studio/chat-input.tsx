'use client';
import { useState, useRef, useCallback } from 'react';
import { useI18n } from '@/lib/i18n-context';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Square, Paperclip, X } from 'lucide-react';

interface ChatInputProps {
  onSend: (content: string, image?: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, onStop, isStreaming, disabled }: ChatInputProps) {
  const { t } = useI18n();
  const [input, setInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(() => {
    if (!input.trim() && !image) return;
    onSend(input.trim(), image || undefined);
    setInput('');
    setImage(null);
  }, [input, image, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      alert('Image must be under 4MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="border-t border-mest-grey-300/60 bg-white p-4">
      {image && (
        <div className="mb-2 relative inline-block">
          <img src={image} alt="Upload" className="h-16 rounded-lg" />
          <button
            onClick={() => setImage(null)}
            className="absolute -top-2 -right-2 bg-mest-rust text-white rounded-full p-0.5"
            aria-label="Remove image"
          >
            <X size={14} />
          </button>
          <span className="text-xs text-mest-grey-500 ml-2">{t('chat.imageAttached')}</span>
        </div>
      )}
      <div className="flex items-end gap-2">
        <input
          type="file"
          ref={fileRef}
          onChange={handleFile}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={isStreaming}
          aria-label="Attach image"
        >
          <Paperclip size={18} />
        </Button>
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('chat.placeholder')}
          className="flex-1 min-h-[44px] max-h-[200px] resize-none"
          rows={1}
          disabled={isStreaming || disabled}
        />
        {isStreaming ? (
          <Button onClick={onStop} variant="destructive" size="sm" className="gap-1.5">
            <Square size={14} />
            {t('chat.stop')}
          </Button>
        ) : (
          <Button
            onClick={handleSend}
            disabled={(!input.trim() && !image) || disabled}
            className="bg-mest-blue hover:bg-mest-blue/90 text-white gap-1.5"
            size="sm"
          >
            <Send size={14} />
            {t('chat.send')}
          </Button>
        )}
      </div>
    </div>
  );
}
