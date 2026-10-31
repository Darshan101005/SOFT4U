'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, Eye, EyeOff, X } from 'lucide-react';
import { checkPassword, PASSWORD_MIN } from '@/lib/password-policy';

export const authInputCls =
  'w-full min-h-12 px-3.5 text-base border border-charcoal-border rounded-xl bg-surface-bg text-charcoal focus:bg-white focus:outline-none focus:border-pista-500 focus:ring-2 focus:ring-pista-100 placeholder:text-charcoal-subtle';

export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-charcoal-border rounded-2xl p-5 sm:p-8 shadow-sm space-y-6">
      <div className="text-center space-y-1.5">
        <h1 className="text-2xl font-extrabold text-charcoal">{title}</h1>
        {subtitle && <p className="text-sm text-charcoal-subtle">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function FormAlert({ tone = 'error', children }: { tone?: 'error' | 'ok' | 'info'; children: React.ReactNode }) {
  const cls =
    tone === 'ok'
      ? 'bg-pista-lighter border-pista-light text-pista-darker'
      : tone === 'info'
        ? 'bg-surface-muted border-charcoal-border text-charcoal'
        : 'bg-white border-accent-rose/40 text-charcoal border-l-4 border-l-accent-rose';
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`p-3 rounded-xl border text-sm ${cls}`}>
      {children}
    </div>
  );
}

export function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  placeholder,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  placeholder?: string;
  invalid?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        className={`${authInputCls} pr-12 ${invalid ? 'border-accent-rose' : ''}`}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-0.5 top-1/2 -translate-y-1/2 w-11 h-11 inline-flex items-center justify-center rounded-xl text-charcoal-subtle hover:text-charcoal"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
      </button>
    </div>
  );
}

const BAR = ['bg-accent-rose', 'bg-accent-rose', 'bg-accent-amber', 'bg-pista-500', 'bg-pista-700'];

/** Live password rules (min 8 characters, a letter and a number) plus a strength meter. */
export function PasswordStrength({ password }: { password: string }) {
  const c = checkPassword(password);
  const rules = [
    { ok: c.rules.length, label: `At least ${PASSWORD_MIN} characters` },
    { ok: c.rules.letter, label: 'At least one letter' },
    { ok: c.rules.number, label: 'At least one number' },
    { ok: c.rules.symbolOrMixedCase, label: 'Stronger: a symbol or upper + lower case', optional: true },
  ];
  return (
    <div className="space-y-2" aria-live="polite">
      <div className="flex items-center gap-2">
        <div className="flex-1 grid grid-cols-4 gap-1" aria-hidden="true">
          {[1, 2, 3, 4].map(i => (
            <span key={i} className={`h-1.5 rounded-full ${password && c.score >= i ? BAR[c.score] : 'bg-charcoal-border'}`} />
          ))}
        </div>
        <span className="text-xs font-bold text-charcoal-muted w-20 text-right">{password ? c.label : ''}</span>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
        {rules.map(r => (
          <li key={r.label} className={`flex items-center gap-1.5 text-xs ${r.ok ? 'text-pista-darker font-semibold' : r.optional ? 'text-charcoal-subtle' : 'text-charcoal-muted'}`}>
            {r.ok ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <X className="w-3.5 h-3.5 opacity-60" aria-hidden="true" />}
            {r.label}
          </li>
        ))}
      </ul>
      {password && c.ok === false && c.rules.length && c.rules.letter && c.rules.number && c.error && <p className="text-xs text-accent-rose">{c.error}</p>}
    </div>
  );
}

/** Six one-digit boxes with paste support and SMS / email autofill (autocomplete="one-time-code"). */
export function OtpInput({ value, onChange, onComplete, disabled, idPrefix = 'otp' }: { value: string; onChange: (v: string) => void; onComplete?: (v: string) => void; disabled?: boolean; idPrefix?: string }) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(6, ' ').slice(0, 6).split('');

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  const set = (next: string) => {
    const clean = next.replace(/\D/g, '').slice(0, 6);
    onChange(clean);
    if (clean.length === 6) onComplete?.(clean);
  };

  return (
    <div className="flex justify-center gap-1 min-[380px]:gap-1.5 sm:gap-2" role="group" aria-label="6-digit code">
      {digits.map((d, i) => (
        <input
          key={i}
          id={`${idPrefix}-${i}`}
          ref={el => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={i === 0 ? 6 : 1}
          disabled={disabled}
          aria-label={`Digit ${i + 1}`}
          value={d.trim()}
          onChange={e => {
            const v = e.target.value.replace(/\D/g, '');
            if (v.length > 1) {
              set(v);
              refs.current[Math.min(5, v.length)]?.focus();
              return;
            }
            const pos = Math.min(i, value.length);
            set(v ? value.slice(0, pos) + v + value.slice(pos + 1) : value.slice(0, pos) + value.slice(pos + 1));
            if (v && pos < 5) refs.current[pos + 1]?.focus();
          }}
          onKeyDown={e => {
            if (e.key === 'Backspace' && !digits[i].trim() && i > 0) refs.current[i - 1]?.focus();
            if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
            if (e.key === 'ArrowRight' && i < 5) refs.current[i + 1]?.focus();
          }}
          onPaste={e => {
            const text = e.clipboardData.getData('text');
            if (/\d/.test(text)) {
              e.preventDefault();
              set(text);
              refs.current[Math.min(5, text.replace(/\D/g, '').length)]?.focus();
            }
          }}
          className="w-11 h-14 sm:w-12 sm:h-14 text-center text-2xl font-extrabold text-charcoal border-2 border-charcoal-border rounded-xl bg-white focus:outline-none focus:border-pista-600 focus:ring-2 focus:ring-pista-100 disabled:opacity-50"
        />
      ))}
    </div>
  );
}

/** Seconds countdown; returns the remaining seconds and a restart function. */
export function useCountdown(initialSeconds: number) {
  const [left, setLeft] = useState(Math.max(0, initialSeconds));
  const endsAt = useRef<number | null>(null);
  const initial = useRef(initialSeconds);
  useEffect(() => {
    if (endsAt.current === null) endsAt.current = Date.now() + Math.max(0, initial.current) * 1000;
    const t = setInterval(() => {
      setLeft(Math.max(0, Math.ceil(((endsAt.current ?? 0) - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(t);
  }, []);
  const restart = (seconds: number) => {
    endsAt.current = Date.now() + Math.max(0, seconds) * 1000;
    setLeft(Math.max(0, seconds));
  };
  return { left, restart };
}

export function mmss(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
