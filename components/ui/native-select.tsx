import { cn } from '@/lib/utils';

interface NativeSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function NativeSelect({ value, onChange, placeholder, disabled, className, children }: NativeSelectProps) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        "h-9 w-full rounded-lg border border-mest-grey-300 bg-white px-3 text-sm text-mest-ink",
        "focus:border-mest-blue focus:ring-2 focus:ring-mest-blue/20 outline-none",
        "appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {children}
    </select>
  );
}
