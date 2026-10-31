'use client';

import React from 'react';
import { Check } from 'lucide-react';

/** Pistachio checkbox: native input (keyboard + forms) with a custom box, 44px tap target. */
export function Checkbox({
  checked,
  onChange,
  children,
  disabled,
  className = '',
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label className={`flex items-start gap-3 min-h-11 py-2 cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <input type="checkbox" className="peer sr-only" checked={checked} disabled={disabled} onChange={e => onChange(e.target.checked)} />
      <span
        className={`mt-0.5 w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-pista-500 peer-focus-visible:ring-offset-1 ${
          checked ? 'bg-pista-600 border-pista-600 text-white' : 'bg-white border-charcoal-border-dark'
        }`}
        aria-hidden="true"
      >
        {checked && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
      </span>
      <span className="text-sm text-charcoal-muted leading-snug">{children}</span>
    </label>
  );
}
