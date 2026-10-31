'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { KeyRound, Loader2, MailCheck } from 'lucide-react';
import { useAuth } from '@/lib/context/auth-context';
import { checkPassword, EMAIL_RE } from '@/lib/password-policy';
import { AuthCard, FormAlert, OtpInput, PasswordInput, PasswordStrength, authInputCls, mmss, useCountdown } from '@/components/auth/auth-ui';

async function postJson(url: string, body: unknown) {
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return { ok: res.ok, data: await res.json().catch(() => ({})) };
  } catch {
    return { ok: false, data: { error: 'Network error. Check your connection and try again.' } };
  }
}

function NewPasswordFields({ password, setPassword, confirm, setConfirm }: { password: string; setPassword: (v: string) => void; confirm: string; setConfirm: (v: string) => void }) {
  const mismatch = confirm.length > 0 && confirm !== password;
  return (
    <>
      <div>
        <label htmlFor="new-password" className="text-sm font-semibold text-charcoal block mb-1">
          New password
        </label>
        <PasswordInput id="new-password" value={password} onChange={setPassword} autoComplete="new-password" placeholder="At least 8 characters" />
        <div className="mt-2">
          <PasswordStrength password={password} />
        </div>
      </div>
      <div>
        <label htmlFor="confirm-password" className="text-sm font-semibold text-charcoal block mb-1">
          Confirm new password
        </label>
        <PasswordInput id="confirm-password" value={confirm} onChange={setConfirm} autoComplete="new-password" placeholder="Type it again" invalid={mismatch} />
        {mismatch && <p className="mt-1 text-xs text-accent-rose">Passwords do not match.</p>}
      </div>
    </>
  );
}

/** Password reset by emailed 6-digit code, or by the reset link (?token=...). */
export function ForgotForm({ initialEmail, token }: { initialEmail: string; token: string }) {
  const router = useRouter();
  const { resendCode } = useAuth();
  const [step, setStep] = useState<'email' | 'code' | 'link'>(token ? 'link' : 'email');
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkState, setLinkState] = useState<'checking' | 'valid' | 'invalid'>(token ? 'checking' : 'invalid');
  const cooldown = useCountdown(0);
  const expiry = useCountdown(0);

  useEffect(() => {
    if (!token) return;
    let active = true;
    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        if (!active) return;
        setLinkState(d.valid ? 'valid' : 'invalid');
        if (d.email) setEmail(d.email);
      })
      .catch(() => active && setLinkState('invalid'));
    return () => {
      active = false;
    };
  }, [token]);

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!EMAIL_RE.test(email.trim())) return setError('Enter a valid email address.');
    setLoading(true);
    const { ok, data } = await postJson('/api/auth/forgot-password', { email: email.trim() });
    setLoading(false);
    if (!ok) {
      if (data.retryAfterSeconds) {
        cooldown.restart(data.retryAfterSeconds);
        expiry.restart(600);
        setStep('code');
        return;
      }
      return setError(data.error || 'Could not send the reset code');
    }
    cooldown.restart(data.resendInSeconds ?? 60);
    expiry.restart(600);
    setInfo('If an account exists for this email, we sent a 6-digit code and a reset link.');
    setStep('code');
  };

  const resend = async () => {
    setError('');
    setInfo('');
    const res = await resendCode(email.trim(), 'password_reset');
    if (res.success) {
      cooldown.restart(res.resendInSeconds ?? 60);
      expiry.restart(600);
      setInfo('A new code is on its way.');
    } else {
      if (res.retryAfterSeconds) cooldown.restart(res.retryAfterSeconds);
      setError(res.error || 'Could not send a new code');
    }
  };

  const reset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (step === 'code' && code.length !== 6) return setError('Enter the 6-digit code from the email.');
    const pw = checkPassword(password);
    if (!pw.ok) return setError(pw.error || 'Choose a stronger password.');
    if (password !== confirm) return setError('Passwords do not match.');
    setLoading(true);
    const body = step === 'link' ? { token, password, confirmPassword: confirm } : { email: email.trim(), code, password, confirmPassword: confirm };
    const { ok, data } = await postJson('/api/auth/reset-password', body);
    setLoading(false);
    if (!ok) {
      if (step === 'code') setCode('');
      return setError(data.error || 'Could not reset your password');
    }
    router.replace(`/login?reset=1&email=${encodeURIComponent(email.trim())}`);
  };

  const submitBtn = (label: string) => (
    <button type="submit" disabled={loading} className="w-full min-h-12 px-4 bg-pista-dark text-white hover:bg-pista-darker text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
      {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
      {label}
    </button>
  );

  if (step === 'link') {
    return (
      <AuthCard title="Choose a new password" subtitle={email ? `For ${email}` : undefined}>
        {linkState === 'checking' && <p className="text-center text-sm text-charcoal-subtle">Checking your reset link...</p>}
        {linkState === 'invalid' && (
          <div className="space-y-4">
            <FormAlert>This reset link is invalid or has expired. Request a new code below.</FormAlert>
            <button type="button" onClick={() => setStep('email')} className="w-full min-h-12 rounded-xl bg-pista text-charcoal text-sm font-bold">
              Request a new code
            </button>
          </div>
        )}
        {linkState === 'valid' && (
          <form onSubmit={reset} className="space-y-4" noValidate>
            {error && <FormAlert>{error}</FormAlert>}
            <NewPasswordFields password={password} setPassword={setPassword} confirm={confirm} setConfirm={setConfirm} />
            {submitBtn('Save new password')}
          </form>
        )}
      </AuthCard>
    );
  }

  if (step === 'code') {
    return (
      <AuthCard title="Reset your password" subtitle="Enter the code we emailed you and choose a new password.">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="w-14 h-14 rounded-2xl bg-pista-lighter text-pista-dark flex items-center justify-center">
            <MailCheck className="w-7 h-7" aria-hidden="true" />
          </span>
          <p className="text-sm text-charcoal-muted">
            Code sent to <span className="font-bold text-charcoal break-all">{email.trim()}</span>
          </p>
          <p className={`text-xs font-semibold ${expiry.left === 0 ? 'text-accent-rose' : 'text-charcoal-subtle'}`}>{expiry.left > 0 ? `Code expires in ${mmss(expiry.left)}` : 'If the code expired, request a new one.'}</p>
        </div>
        {info && <FormAlert tone="ok">{info}</FormAlert>}
        {error && <FormAlert>{error}</FormAlert>}
        <form onSubmit={reset} className="space-y-4" noValidate>
          <OtpInput value={code} onChange={setCode} disabled={loading} idPrefix="reset" />
          <NewPasswordFields password={password} setPassword={setPassword} confirm={confirm} setConfirm={setConfirm} />
          {submitBtn('Reset password')}
        </form>
        <div className="flex items-center justify-between gap-3 text-sm">
          <button type="button" onClick={() => setStep('email')} className="min-h-11 px-1 font-semibold text-charcoal-muted hover:text-charcoal">
            Change email
          </button>
          <button type="button" onClick={resend} disabled={cooldown.left > 0} className="min-h-11 px-1 font-bold text-pista-darker hover:underline disabled:text-charcoal-subtle disabled:no-underline">
            {cooldown.left > 0 ? `Resend code in ${cooldown.left}s` : 'Resend code'}
          </button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Forgot your password?" subtitle="Enter your account email. We will send a 6-digit code and a reset link.">
      <div className="flex justify-center">
        <span className="w-14 h-14 rounded-2xl bg-pista-lighter text-pista-dark flex items-center justify-center">
          <KeyRound className="w-7 h-7" aria-hidden="true" />
        </span>
      </div>
      {error && <FormAlert>{error}</FormAlert>}
      <form onSubmit={requestCode} className="space-y-4" noValidate>
        <div>
          <label htmlFor="fp-email" className="text-sm font-semibold text-charcoal block mb-1">
            Email address
          </label>
          <input id="fp-email" type="email" inputMode="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className={authInputCls} />
        </div>
        {submitBtn('Send reset code')}
      </form>
      <div className="text-center text-sm text-charcoal-subtle">
        Remember your password?{' '}
        <Link href="/login" className="text-charcoal font-bold hover:underline">
          Sign in
        </Link>
      </div>
    </AuthCard>
  );
}
