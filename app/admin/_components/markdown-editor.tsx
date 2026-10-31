'use client';

import React, { useState } from 'react';
import { Markdown } from '@/app/_store/markdown';
import { Textarea } from './ui';

/**
 * Formatted view of CMS Markdown using the same renderer as the public pages
 * (React elements only, so no raw HTML or scripts can be injected).
 */
export function MarkdownView({ source, className = '' }: { source: string; className?: string }) {
  return (
    <div className={`p-5 bg-white border border-charcoal-border rounded-xl ${className}`}>
      {source.trim() ? <Markdown source={source} /> : <p className="text-sm text-charcoal-subtle">Nothing written yet.</p>}
    </div>
  );
}

/** Markdown editor: Write | Preview tabs on small screens, editor and live preview side by side on desktop. */
export function MarkdownEditor({ value, onChange, rows = 12, placeholder }: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const tabCls = (on: boolean) => `px-3 py-1.5 rounded-lg text-xs font-bold ${on ? 'bg-pista text-charcoal' : 'text-charcoal-muted hover:bg-pista-lighter'}`;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 lg:hidden" role="tablist" aria-label="Editor mode">
        <button type="button" role="tab" aria-selected={tab === 'write'} className={tabCls(tab === 'write')} onClick={() => setTab('write')}>
          Write
        </button>
        <button type="button" role="tab" aria-selected={tab === 'preview'} className={tabCls(tab === 'preview')} onClick={() => setTab('preview')}>
          Preview
        </button>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className={tab === 'write' ? '' : 'hidden lg:block'}>
          <span className="hidden lg:block text-[11px] font-bold uppercase tracking-wide text-charcoal-subtle mb-1">Write (Markdown)</span>
          <Textarea rows={rows} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} className="font-mono text-xs" />
          <p className="mt-1 text-[11px] text-charcoal-subtle"># Heading · **bold** · *italic* · - list · 1. list · [link](https://…)</p>
        </div>
        <div className={tab === 'preview' ? '' : 'hidden lg:block'}>
          <span className="hidden lg:block text-[11px] font-bold uppercase tracking-wide text-charcoal-subtle mb-1">Preview</span>
          <MarkdownView source={value} className="max-h-[640px] overflow-y-auto" />
        </div>
      </div>
    </div>
  );
}
