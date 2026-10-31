'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/context/auth-context';
import { checkPassword, EMAIL_RE } from '@/lib/password-policy';
import { AuthCard, FormAlert, PasswordInput, PasswordStrength, authInputCls } from '@/components/auth/auth-ui';
import { VerifyEmailStep } from '@/components/auth/verify-email-step';
import { Checkbox } from '@/components/ui/checkbox';

export function RegisterForm({ next }: { next: string }) {
  const router = useRouter();
  const { register } = useAuth();
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(60);
  const [verifiedEmail, setVerifiedEmail] = useState('');

  const pw = checkPassword(password);
  const mismatch = confirm.length > 0 && confirm !== password;
  const emailOk = EMAIL_RE.test(email.trim());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setError('');
    setErrorCode('');
    if (name.trim().length < 2) return setError('Enter your full name.');
    if (!emailOk) return setError('Enter a valid email address.');
    if (!pw.ok) return setError(pw.error || 'Choose a stronger password.');
    if (password !== confirm) return setError('Passwords do not match.');
    if (!agreed) return setError('Please accept the Terms & Conditions and Privacy Policy.');
    setLoading(true);
    const res = await register(name.trim(), email.trim(), password, confirm);
    setLoading(false);
    if (!res.success) {
      setErrorCode(res.code || '');
      if (res.retryAfterSeconds) {
        setResendIn(res.retryAfterSeconds);
        setVerifiedEmail(email.trim().toLowerCase());
        setStep('verify');
        return;
      }
      return setError(res.error || 'We could not create your account');
    }
    setVerifiedEmail(res.email || email.trim().toLowerCase());
    setResendIn(res.resendInSeconds ?? 60);
    setStep('verify');
  };

  if (step === 'verify') {
    return (
      <AuthCard title="Check your email" subtitle="Enter the 6-digit code to activate your account.">
        <VerifyEmailStep
          email={verifiedEmail}
          resendInSeconds={resendIn}
          onVerified={() => {
            router.replace(next);
            router.refresh();
          }}
          onBack={() => setStep('form')}
        />
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Create your account" subtitle="Order faster and keep every delivery in one place.">
      {error && (
        <FormAlert>
          {error}
          {errorCode === 'EMAIL_TAKEN' && (
            <>
              {' '}
              <Link href={`/login?email=${encodeURIComponent(email.trim())}`} className="font-bold underline">
                Sign in
              </Link>
            </>
          )}
        </FormAlert>
      )}
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="reg-name" className="text-sm font-semibold text-charcoal block mb-1">
            Full name
          </label>
          <input id="reg-name" type="text" autoComplete="name" value={name} onChange={e => setName(e.target.value)} maxLength={80} placeholder="Your name" className={authInputCls} />
        </div>
        <div>
          <label htmlFor="reg-email" className="text-sm font-semibold text-charcoal block mb-1">
            Email address
          </label>
          <input
            id="reg-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-invalid={touched && !emailOk ? true : undefined}
            className={`${authInputCls} ${touched && !emailOk ? 'border-accent-rose' : ''}`}
          />
          <p className="mt-1 text-xs text-charcoal-subtle">We send a 6-digit code to verify it.</p>
        </div>
        <div>
          <label htmlFor="reg-password" className="text-sm font-semibold text-charcoal block mb-1">
            Password
          </label>
          <PasswordInput id="reg-password" value={password} onChange={setPassword} autoComplete="new-password" placeholder="At least 8 characters" invalid={touched && !pw.ok} />
          <div className="mt-2">
            <PasswordStrength password={password} />
          </div>
        </div>
        <div>
          <label htmlFor="reg-confirm" className="text-sm font-semibold text-charcoal block mb-1">
            Confirm password
          </label>
          <PasswordInput id="reg-confirm" value={confirm} onChange={setConfirm} autoComplete="new-password" placeholder="Type the password again" invalid={mismatch} />
          {mismatch && <p className="mt-1 text-xs text-accent-rose">Passwords do not match.</p>}
          {!mismatch && confirm.length > 0 && confirm === password && <p className="mt-1 text-xs text-pista-darker font-semibold">Passwords match.</p>}
        </div>
        <Checkbox checked={agreed} onChange={setAgreed}>
          I agree to the{' '}
          <Link href="/terms" className="underline hover:text-pista-darker">
            Terms &amp; Conditions
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline hover:text-pista-darker">
            Privacy Policy
          </Link>
          .
        </Checkbox>
        <button type="submit" disabled={loading} className="w-full min-h-12 px-4 bg-pista text-charcoal hover:bg-pista-hover text-sm font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
          {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          <span>{loading ? 'Creating your account...' : 'Create account'}</span>
          {!loading && <ArrowRight className="w-4 h-4" aria-hidden="true" />}
        </button>
      </form>
      <div className="text-center text-sm text-charcoal-subtle">
        Already have an account?{' '}
        <Link href={`/login${next !== '/account' ? `?next=${encodeURIComponent(next)}` : ''}`} className="text-charcoal font-bold hover:underline">
          Sign in
        </Link>
      </div>
    </AuthCard>
  );
}
