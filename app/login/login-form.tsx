'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/context/auth-context';
import { AuthCard, FormAlert, OtpInput, PasswordInput, authInputCls } from '@/components/auth/auth-ui';
import { VerifyEmailStep } from '@/components/auth/verify-email-step';

type Step = 'credentials' | 'two_factor' | 'verify';

export function LoginForm({ next, initialEmail, notice }: { next: string; initialEmail: string; notice: string }) {
  const router = useRouter();
  const { login, verifyLogin2fa } = useAuth();
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [resendIn, setResendIn] = useState(60);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const done = () => {
    router.replace(next);
    router.refresh();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return setError('Enter your email and password.');
    setError('');
    setLoading(true);
    const res = await login(email.trim(), password);
    setLoading(false);
    if (!res.success) return setError(res.error || 'Incorrect email or password');
    if (res.status === 'two_factor_required') {
      setCode('');
      setStep('two_factor');
    } else if (res.status === 'verification_required') {
      setResendIn(res.resendInSeconds ?? 60);
      setStep('verify');
    } else {
      done();
    }
  };

  const submit2fa = async (value = code) => {
    if (value.length !== 6 || loading) return;
    setError('');
    setLoading(true);
    const res = await verifyLogin2fa(value);
    setLoading(false);
    if (res.success) return done();
    setCode('');
    if (res.code === 'EXPIRED' || res.code === 'LOCKED') {
      setStep('credentials');
      setPassword('');
    }
    setError(res.error || 'That code is not right');
  };

  if (step === 'verify') {
    return (
      <AuthCard title="Verify your email" subtitle="Your account is not verified yet. Enter the code we just emailed you.">
        <VerifyEmailStep
          email={email.trim().toLowerCase()}
          resendInSeconds={resendIn}
          onVerified={done}
          onBack={() => {
            setStep('credentials');
            setPassword('');
          }}
        />
      </AuthCard>
    );
  }

  if (step === 'two_factor') {
    return (
      <AuthCard title="Two-factor authentication" subtitle="Enter the 6-digit code from your authenticator app.">
        <div className="flex justify-center">
          <span className="w-14 h-14 rounded-2xl bg-pista-lighter text-pista-dark flex items-center justify-center">
            <ShieldCheck className="w-7 h-7" aria-hidden="true" />
          </span>
        </div>
        {error && <FormAlert>{error}</FormAlert>}
        <form
          onSubmit={e => {
            e.preventDefault();
            submit2fa();
          }}
          className="space-y-4"
        >
          <OtpInput value={code} onChange={setCode} onComplete={v => submit2fa(v)} disabled={loading} idPrefix="totp" />
          <button type="submit" disabled={loading || code.length !== 6} className="w-full min-h-12 bg-pista-dark text-white hover:bg-pista-darker text-sm font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
            {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            Verify and sign in
          </button>
        </form>
        <button
          type="button"
          onClick={() => {
            setStep('credentials');
            setPassword('');
            setError('');
          }}
          className="w-full min-h-11 text-sm font-semibold text-charcoal-muted hover:text-charcoal"
        >
          Back to sign in
        </button>
        <p className="text-xs text-center text-charcoal-subtle">
          Lost your authenticator? <Link href="/contact" className="underline">Contact support</Link> to reset two-factor authentication.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Sign in to Soft4u" subtitle="See your orders, delivered access and support.">
      {notice && <FormAlert tone="ok">{notice}</FormAlert>}
      {error && <FormAlert>{error}</FormAlert>}
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="login-email" className="text-sm font-semibold text-charcoal block mb-1">
            Email address
          </label>
          <input id="login-email" type="email" autoComplete="email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className={authInputCls} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="login-password" className="text-sm font-semibold text-charcoal">
              Password
            </label>
            <Link href={`/forgot-password${email ? `?email=${encodeURIComponent(email.trim())}` : ''}`} className="inline-flex items-center min-h-11 text-xs text-pista-darker hover:underline font-semibold">
              Forgot password?
            </Link>
          </div>
          <PasswordInput id="login-password" value={password} onChange={setPassword} autoComplete="current-password" placeholder="Your password" />
        </div>
        <button type="submit" disabled={loading} className="w-full min-h-12 px-4 bg-pista text-charcoal hover:bg-pista-hover text-sm font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : null}
          <span>{loading ? 'Signing in...' : 'Sign in'}</span>
          {!loading && <ArrowRight className="w-4 h-4" aria-hidden="true" />}
        </button>
      </form>
      <div className="text-center text-sm text-charcoal-subtle">
        New to Soft4u?{' '}
        <Link href={`/register${next !== '/account' ? `?next=${encodeURIComponent(next)}` : ''}`} className="text-charcoal font-bold hover:underline">
          Create an account
        </Link>
      </div>
    </AuthCard>
  );
}
