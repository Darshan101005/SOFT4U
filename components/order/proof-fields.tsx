'use client';

import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { compressImage, MAX_PROOFS } from '@/components/order/image-compress';

export interface ProofValue {
  screenshots: string[];
  transactionId: string;
  senderName: string;
  senderAccount: string;
  amountPaid: string;
  paymentDate: string;
}

export const EMPTY_PROOF: ProofValue = { screenshots: [], transactionId: '', senderName: '', senderAccount: '', amountPaid: '', paymentDate: '' };

export function proofProblem(p: ProofValue): string | null {
  if (p.screenshots.length === 0) return 'Attach a screenshot of your payment';
  if (p.transactionId.trim().length < 4) return 'Enter the transaction ID from your payment receipt';
  return null;
}

export function proofPayload(p: ProofValue) {
  return {
    screenshots: p.screenshots,
    transactionId: p.transactionId.trim(),
    senderName: p.senderName.trim() || undefined,
    senderAccount: p.senderAccount.trim() || undefined,
    amountPaid: p.amountPaid.trim() || undefined,
    paymentDate: p.paymentDate || undefined,
  };
}

const inputCls =
  'w-full min-h-11 px-3 rounded-xl border border-charcoal-border bg-surface-bg text-base sm:text-sm text-charcoal focus:outline-none focus:border-pista-500 focus:bg-white focus:ring-2 focus:ring-pista-100';

/** Screenshot picker (1-3 images, compressed in the browser) plus transaction ID and optional sender details. */
export function ProofFields({ value, onChange, idPrefix = 'proof' }: { value: ProofValue; onChange: (v: ProofValue) => void; idPrefix?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError('');
    const room = MAX_PROOFS - value.screenshots.length;
    const list = Array.from(files).slice(0, room);
    if (files.length > room) setError(`You can attach up to ${MAX_PROOFS} screenshots`);
    setBusy(true);
    const next = [...value.screenshots];
    for (const f of list) {
      try {
        next.push(await compressImage(f));
      } catch (err) {
        setError((err as Error).message);
      }
    }
    setBusy(false);
    onChange({ ...value, screenshots: next });
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm font-semibold text-charcoal mb-1.5">
          Payment screenshot <span className="text-accent-rose">*</span>{' '}
          <span className="font-normal text-charcoal-subtle">(up to {MAX_PROOFS} · JPG, PNG or WebP · 5 MB each)</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {value.screenshots.map((src, i) => (
            <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-charcoal-border bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Payment screenshot ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onChange({ ...value, screenshots: value.screenshots.filter((_, idx) => idx !== i) })}
                className="absolute top-1 right-1 w-9 h-9 rounded-full bg-night/70 text-white flex items-center justify-center hover:bg-night"
                aria-label={`Remove screenshot ${i + 1}`}
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          ))}
          {value.screenshots.length < MAX_PROOFS && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="w-24 h-24 rounded-xl border-2 border-dashed border-pista-300 bg-pista-50 flex flex-col items-center justify-center gap-1 text-pista-darker hover:border-pista-500 hover:bg-pista-100 transition-colors disabled:opacity-60"
            >
              {busy ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <ImagePlus className="w-5 h-5" aria-hidden="true" />}
              <span className="text-[11px] font-bold">{busy ? 'Preparing' : 'Add image'}</span>
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="hidden"
            onChange={e => {
              pick(e.target.files);
              e.target.value = '';
            }}
          />
        </div>
        {error && (
          <p role="alert" className="mt-2 text-xs text-accent-rose">
            {error}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold text-charcoal">
            Transaction ID <span className="text-accent-rose">*</span>
          </span>
          <input
            id={`${idPrefix}-txn`}
            value={value.transactionId}
            onChange={e => onChange({ ...value, transactionId: e.target.value.slice(0, 80) })}
            placeholder="e.g. TID 1234567890"
            autoComplete="off"
            className={`${inputCls} mt-1 font-mono`}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-charcoal">Sender name (optional)</span>
          <input value={value.senderName} onChange={e => onChange({ ...value, senderName: e.target.value.slice(0, 80) })} className={`${inputCls} mt-1`} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-charcoal">Sender account / number (optional)</span>
          <input value={value.senderAccount} onChange={e => onChange({ ...value, senderAccount: e.target.value.slice(0, 60) })} className={`${inputCls} mt-1`} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-charcoal">Amount paid (optional)</span>
          <input inputMode="decimal" value={value.amountPaid} onChange={e => onChange({ ...value, amountPaid: e.target.value.replace(/[^\d.]/g, '').slice(0, 12) })} className={`${inputCls} mt-1`} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-charcoal">Payment date (optional)</span>
          <input type="date" value={value.paymentDate} onChange={e => onChange({ ...value, paymentDate: e.target.value })} className={`${inputCls} mt-1`} />
        </label>
      </div>
    </div>
  );
}
