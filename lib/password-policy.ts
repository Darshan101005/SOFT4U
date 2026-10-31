/**
 * Password rules shared by the signup / reset forms (client) and the API (server).
 * Rule: 8-128 characters with at least one letter and one number.
 */

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

export interface PasswordCheck {
  ok: boolean;
  /** First failing rule, worded for the user. */
  error?: string;
  /** 0 (very weak) to 4 (strong), for a strength meter. */
  score: 0 | 1 | 2 | 3 | 4;
  label: 'Very weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  rules: { length: boolean; letter: boolean; number: boolean; symbolOrMixedCase: boolean };
}

const COMMON = new Set(['password', 'password1', '12345678', '123456789', 'qwerty123', 'iloveyou', '11111111', 'abc12345', 'pakistan', 'pakistan1']);

export function checkPassword(password: string): PasswordCheck {
  const pw = password || '';
  const rules = {
    length: pw.length >= PASSWORD_MIN,
    letter: /[A-Za-z]/.test(pw),
    number: /\d/.test(pw),
    symbolOrMixedCase: /[^A-Za-z0-9]/.test(pw) || (/[a-z]/.test(pw) && /[A-Z]/.test(pw)),
  };
  let score = 0;
  if (rules.length) score++;
  if (rules.letter && rules.number) score++;
  if (rules.symbolOrMixedCase) score++;
  if (pw.length >= 12) score++;
  if (COMMON.has(pw.toLowerCase())) score = 0;
  const s = Math.min(4, score) as PasswordCheck['score'];
  const label = (['Very weak', 'Weak', 'Fair', 'Good', 'Strong'] as const)[s];

  let error: string | undefined;
  if (!rules.length) error = `Password must be at least ${PASSWORD_MIN} characters`;
  else if (pw.length > PASSWORD_MAX) error = `Password must be at most ${PASSWORD_MAX} characters`;
  else if (!rules.letter || !rules.number) error = 'Password must include at least one letter and one number';
  else if (COMMON.has(pw.toLowerCase())) error = 'This password is too common. Choose another one';

  return { ok: !error, error, score: s, label, rules };
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(email: string): string {
  return (email || '').trim().toLowerCase();
}
