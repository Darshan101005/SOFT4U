'use client';

import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

/** 44px copy-to-clipboard button with a "Copied" confirmation. */
export function CopyButton({ value, label = 'Copy', className = '', compact = false }: { value: string; label?: string; className?: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        if (await copyText(value)) {
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        }
      }}
      className={`shrink-0 inline-flex items-center justify-center gap-1.5 min-h-11 ${compact ? 'w-11' : 'px-3'} rounded-xl border text-xs font-bold transition-colors ${
        copied ? 'border-pista-500 bg-pista-100 text-pista-darker' : 'border-charcoal-border bg-white text-charcoal-muted hover:border-pista hover:text-pista-darker'
      } ${className}`}
      aria-label={copied ? 'Copied' : `${label}`}
    >
      {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
      {!compact && <span>{copied ? 'Copied' : label}</span>}
    </button>
  );
}

/** Label / value row with a copy button (payment details, delivered access). */
export function CopyRow({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-surface-muted last:border-b-0">
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-charcoal-subtle">{label}</div>
        <div className={`text-sm font-bold text-charcoal break-all ${mono ? 'font-mono' : ''}`}>{value}</div>
      </div>
      <CopyButton value={value} label={`Copy ${label.toLowerCase()}`} compact />
    </div>
  );
}
