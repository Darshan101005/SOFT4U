'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound, Lock, Mail, ShieldCheck } from 'lucide-react';
import { LogoText } from '@/components/brand/logo';
import { Button, Field, Input, api, errMsg } from '../_components/ui';

export function AdminLoginClient({ next }: { next: string }) {
  const [step, setStep] = useState<'credentials' | 'totp'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const done = () => {
    window.location.assign(next);
  };

  const submitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Enter your email and password');
      return;
    }
    setLoading(true);
    try {
      const res = await api<{ status: 'ok' | 'two_factor_required' }>('/api/admin/login', { body: { email: email.trim(), password } });
      if (res.status === 'two_factor_required') {
        setStep('totp');
        setLoading(false);
        return;
      }
      done();
    } catch (err) {
      setError(errMsg(err, 'Could not sign in'));
      setLoading(false);
    }
  };

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const clean = code.replace(/\s+/g, '');
    if (!/^\d{6}$/.test(clean)) {
      setError('Enter the 6-digit code from your authenticator app');
      return;
    }
    setLoading(true);
    try {
      await api('/api/admin/2fa/login-verify', { body: { code: clean } });
      done();
    } catch (err) {
      const msg = errMsg(err, 'That code is not right');
      setError(msg);
      if (/expired/i.test(msg)) {
        setStep('credentials');
        setCode('');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <LogoText size="md" />
          <span className="mt-2 text-[10px] text-pista-darker uppercase font-bold px-2 py-0.5 bg-pista-light rounded">Admin panel</span>
        </div>
        <div className="bg-white border border-charcoal-border rounded-2xl shadow-sm p-6 sm:p-8">
          {step === 'credentials' ? (
            <form onSubmit={submitCredentials} className="space-y-4" noValidate>
              <div>
                <h1 className="text-xl font-extrabold text-charcoal">Sign in</h1>
                <p className="text-sm text-charcoal-subtle mt-1">Use the admin email and password you were given.</p>
              </div>
              <Field label="Email">
                <div className="relative">
                  <Mail className="w-4 h-4 text-charcoal-subtle absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} className="pl-9" placeholder="you@soft4u.top" autoFocus />
                </div>
              </Field>
              <Field label="Password">
                <div className="relative">
                  <Lock className="w-4 h-4 text-charcoal-subtle absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type={show ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-9 pr-10"
                    placeholder="Your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(s => !s)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-charcoal-subtle hover:text-charcoal"
                    aria-label={show ? 'Hide password' : 'Show password'}
                  >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>
              {error && <p className="text-sm font-semibold text-accent-rose">{error}</p>}
              <Button type="submit" loading={loading} className="w-full" icon={KeyRound}>
                Sign in
              </Button>
              <p className="text-[11px] text-charcoal-subtle text-center">
                Forgot your password? Ask another admin to set a new one from Settings → Admins.
              </p>
            </form>
          ) : (
            <form onSubmit={submitCode} className="space-y-4" noValidate>
              <div className="w-12 h-12 rounded-2xl bg-pista-lighter text-pista-dark flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-charcoal">Two-factor check</h1>
                <p className="text-sm text-charcoal-subtle mt-1">Open your authenticator app and enter the 6-digit code for Soft4u Admin.</p>
              </div>
              <Field label="Authentication code">
                <Input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={7}
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/[^\d ]/g, ''))}
                  className="text-center text-2xl tracking-[0.4em] font-mono"
                  placeholder="000000"
                  autoFocus
                />
              </Field>
              {error && <p className="text-sm font-semibold text-accent-rose">{error}</p>}
              <Button type="submit" loading={loading} className="w-full">
                Verify and continue
              </Button>
              <button
                type="button"
                onClick={() => {
                  setStep('credentials');
                  setCode('');
                  setError('');
                }}
                className="w-full text-xs font-semibold text-pista-dark hover:underline"
              >
                Use a different account
              </button>
              <p className="text-[11px] text-charcoal-subtle text-center">Lost your phone? Another admin can reset your two-factor from Settings → Admins.</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
