'use client';

import React, { useState } from 'react';
import { Loader2, MailCheck } from 'lucide-react';
import { useAuth } from '@/lib/context/auth-context';
import { FormAlert, OtpInput, mmss, useCountdown } from '@/components/auth/auth-ui';

const CODE_MINUTES = 10;

/** Email verification: 6-digit code, 10-minute expiry, 60 s resend cooldown, attempts left. */
export function VerifyEmailStep({ email, resendInSeconds = 60, onVerified, onBack }: { email: string; resendInSeconds?: number; onVerified: () => void; onBack: () => void }) {
  const { verifyEmail, resendCode } = useAuth();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const cooldown = useCountdown(resendInSeconds);
  const expiry = useCountdown(CODE_MINUTES * 60);

  const submit = async (value = code) => {
    if (value.length !== 6 || busy) return;
    setBusy(true);
    setError('');
    setInfo('');
    const res = await verifyEmail(email, value);
    setBusy(false);
    if (res.success) {
      onVerified();
      return;
    }
    setCode('');
    setError(res.error || 'That code did not work');
  };

  const resend = async () => {
    setError('');
    setInfo('');
    setResending(true);
    const res = await resendCode(email, 'signup');
    setResending(false);
    if (res.success) {
      cooldown.restart(res.resendInSeconds ?? 60);
      expiry.restart(CODE_MINUTES * 60);
      setInfo('A new code is on its way. Check your inbox and spam folder.');
    } else {
      if (res.retryAfterSeconds) cooldown.restart(res.retryAfterSeconds);
      setError(res.error || 'Could not send a new code');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center text-center gap-2">
        <span className="w-14 h-14 rounded-2xl bg-pista-lighter text-pista-dark flex items-center justify-center">
          <MailCheck className="w-7 h-7" aria-hidden="true" />
        </span>
        <p className="text-sm text-charcoal-muted">
          We sent a 6-digit code to <span className="font-bold text-charcoal break-all">{email}</span>.
        </p>
        <p className={`text-xs font-semibold ${expiry.left === 0 ? 'text-accent-rose' : 'text-charcoal-subtle'}`}>
          {expiry.left > 0 ? `Code expires in ${mmss(expiry.left)}` : 'This code has expired. Request a new one.'}
        </p>
      </div>

      {error && <FormAlert>{error}</FormAlert>}
      {info && <FormAlert tone="ok">{info}</FormAlert>}

      <form
        onSubmit={e => {
          e.preventDefault();
          submit();
        }}
        className="space-y-4"
      >
        <OtpInput value={code} onChange={setCode} onComplete={v => submit(v)} disabled={busy} idPrefix="verify" />
        <button
          type="submit"
          disabled={busy || code.length !== 6}
          aria-busy={busy || undefined}
          className="w-full min-h-12 px-4 bg-pista-dark text-white hover:bg-pista-darker text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          Verify email
        </button>
      </form>

      <div className="flex items-center justify-between gap-3 text-sm">
        <button type="button" onClick={onBack} className="min-h-11 px-1 font-semibold text-charcoal-muted hover:text-charcoal">
          Change email
        </button>
        <button type="button" onClick={resend} disabled={cooldown.left > 0 || resending} aria-busy={resending || undefined} className="min-h-11 px-1 font-bold text-pista-darker hover:underline disabled:text-charcoal-subtle disabled:no-underline inline-flex items-center gap-1.5">
          {resending && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          {resending ? 'Sending...' : cooldown.left > 0 ? `Resend code in ${cooldown.left}s` : 'Resend code'}
        </button>
      </div>
      <p className="text-xs text-center text-charcoal-subtle">You have 5 attempts per code. Did not get it? Check spam, or resend.</p>
    </div>
  );
}
