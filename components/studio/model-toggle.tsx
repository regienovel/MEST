'use client';
import { useI18n } from '@/lib/i18n-context';

type Model = 'gpt-4o' | 'claude-sonnet' | 'both';

interface ModelToggleProps {
  value: Model;
  onChange: (model: Model) => void;
  disabled?: boolean;
}

export function ModelToggle({ value, onChange, disabled }: ModelToggleProps) {
  const { t } = useI18n();

  const options: { value: Model; label: string }[] = [
    { value: 'gpt-4o', label: t('chat.model.gpt') },
    { value: 'claude-sonnet', label: t('chat.model.claude') },
    { value: 'both', label: t('chat.model.both') },
  ];

  return (
    <div className="flex bg-mest-grey-100 rounded-lg p-1 gap-1">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          disabled={disabled}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            value === opt.value
              ? 'bg-white text-mest-ink shadow-sm'
              : 'text-mest-grey-500 hover:text-mest-ink'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
