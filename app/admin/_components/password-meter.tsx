'use client';

import { Check, X } from 'lucide-react';
import { checkPassword } from '@/lib/password-policy';
import { cx } from './ui';

/** Strength bar + rules for a new password (same rules as the server). */
export function PasswordMeter({ password, confirm }: { password: string; confirm?: string }) {
  if (!password) return null;
  const c = checkPassword(password);
  const colors = ['bg-accent-rose', 'bg-accent-rose', 'bg-accent-amber', 'bg-pista-hover', 'bg-pista-dark'];
  const rules: Array<[boolean, string]> = [
    [c.rules.length, 'At least 8 characters'],
    [c.rules.letter && c.rules.number, 'A letter and a number'],
    [c.rules.symbolOrMixedCase, 'A symbol or upper + lower case (recommended)'],
  ];
  if (confirm !== undefined) rules.push([Boolean(confirm) && confirm === password, 'Both passwords match']);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 grid grid-cols-4 gap-1">
          {[0, 1, 2, 3].map(i => (
            <span key={i} className={cx('h-1.5 rounded-full', i < Math.max(1, c.score) ? colors[c.score] : 'bg-surface-subtle')} />
          ))}
        </div>
        <span className="text-[11px] font-bold text-charcoal-subtle w-16 text-right">{c.label}</span>
      </div>
      <ul className="grid sm:grid-cols-2 gap-1">
        {rules.map(([ok, text]) => (
          <li key={text} className={cx('flex items-center gap-1.5 text-[11px]', ok ? 'text-pista-dark' : 'text-charcoal-subtle')}>
            {ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Random admin password that satisfies the policy (letters, digits, symbol). */
export function generatePassword(length = 14): string {
  const letters = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const symbols = '!@#$%&*?';
  const all = letters + digits + symbols;
  const pick = (set: string) => {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return set[buf[0] % set.length];
  };
  const chars = [pick(letters.slice(0, 23)), pick(letters.slice(23)), pick(digits), pick(symbols)];
  while (chars.length < length) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i--) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    const j = buf[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}
