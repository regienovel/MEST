'use client';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

interface ModuleCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  borderColor: string;
  disabled?: boolean;
}

export function ModuleCard({ title, description, href, icon: Icon, borderColor, disabled }: ModuleCardProps) {
  if (disabled) {
    return (
      <div className={`bg-white rounded-xl border border-mest-grey-300/60 shadow-sm p-6 ${borderColor} opacity-50 cursor-not-allowed`}>
        <Icon size={32} className="text-mest-grey-300 mb-3" />
        <h3 className="font-serif text-2xl text-mest-grey-500">{title}</h3>
        <p className="text-sm text-mest-grey-300 mt-1">{description}</p>
      </div>
    );
  }

  return (
    <Link href={href}>
      <div className={`bg-white rounded-xl border border-mest-grey-300/60 shadow-sm p-6 ${borderColor} hover:shadow-md hover:border-mest-blue/40 hover:-translate-y-1 transition-all cursor-pointer`}>
        <Icon size={32} className="text-mest-ink mb-3" />
        <h3 className="font-serif text-2xl text-mest-ink">{title}</h3>
        <p className="text-sm text-mest-grey-500 mt-1">{description}</p>
      </div>
    </Link>
  );
}
