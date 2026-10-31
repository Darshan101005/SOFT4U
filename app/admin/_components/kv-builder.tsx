'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { DeliveryField } from '@/lib/db/types';
import { Button, Input, Select } from './ui';

export const FIELD_PRESETS = ['Email', 'Password', '2FA / OTP', 'Link', 'PIN', 'Profile', 'Licence key', 'Username', 'Note'];
const CUSTOM = '__custom__';

export interface KvRow extends DeliveryField {
  /** True when the label was typed by the admin instead of picked from the presets. */
  custom?: boolean;
}

export function toRows(fields: DeliveryField[] | undefined): KvRow[] {
  return (fields || []).map(f => ({ label: f.label, value: f.value, custom: !FIELD_PRESETS.includes(f.label) }));
}

export function cleanRows(rows: KvRow[]): DeliveryField[] {
  return rows.map(r => ({ label: r.label.trim(), value: r.value.trim() })).filter(r => r.label && r.value);
}

/**
 * Key/value builder: each row is a heading (preset or custom) and a value.
 * "+" adds a row, the bin removes it.
 */
export function KvBuilder({ rows, onChange, addLabel = 'Add field' }: { rows: KvRow[]; onChange: (rows: KvRow[]) => void; addLabel?: string }) {
  const options = [...FIELD_PRESETS.map(p => ({ value: p, label: p })), { value: CUSTOM, label: 'Custom heading…' }];
  const update = (i: number, patch: Partial<KvRow>) => onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const used = new Set(rows.map(r => r.label));
  const nextPreset = FIELD_PRESETS.find(p => !used.has(p)) || 'Note';

  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="grid grid-cols-1 sm:grid-cols-[180px_1fr_auto] gap-2 items-start p-2 rounded-xl bg-surface-bg border border-charcoal-border">
          <div className="space-y-1.5">
            <Select
              size="sm"
              value={row.custom ? CUSTOM : row.label}
              options={options}
              onChange={v => (v === CUSTOM ? update(i, { custom: true, label: '' }) : update(i, { custom: false, label: v }))}
              ariaLabel="Heading"
            />
            {row.custom && <Input value={row.label} onChange={e => update(i, { label: e.target.value })} placeholder="Heading, e.g. Recovery email" className="!py-1.5 !text-xs" />}
          </div>
          <Input
            value={row.value}
            onChange={e => update(i, { value: e.target.value })}
            placeholder={row.label ? `${row.label} value` : 'Value'}
            className="!py-1.5 font-mono !text-sm"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
            className="justify-self-end p-2 rounded-lg text-charcoal-subtle hover:text-accent-rose hover:bg-accent-rose/5"
            aria-label="Remove field"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <Button size="sm" variant="secondary" icon={Plus} onClick={() => onChange([...rows, { label: nextPreset, value: '' }])}>
        {addLabel}
      </Button>
    </div>
  );
}
