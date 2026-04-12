'use client';
import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  className?: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, className, children }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* Content */}
      <div className={`relative bg-white rounded-xl shadow-xl w-full mx-4 p-6 z-10 overflow-y-auto ${className || 'max-w-md max-h-[80vh]'}`}>
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="font-serif text-lg text-mest-ink">{title}</h2>}
          <button
            onClick={onClose}
            className="p-1 hover:bg-mest-grey-100 rounded-lg text-mest-grey-500 hover:text-mest-ink ml-auto"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
