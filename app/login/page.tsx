'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useAuth } from '@/lib/context/auth-context';
import { LogoText } from '@/components/brand/logo';
import { Lock, Mail, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const res = await login(email, password);
    if (!res.success) {
      setErrorMsg(res.error || 'Invalid email or password');
      setLoading(false);
    } else {
      router.push('/account');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg">
      <Header />
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-12 flex flex-col justify-center">
        <div className="bg-white border border-charcoal-border rounded-2xl p-8 shadow-xs space-y-6">
          <div className="text-center space-y-1">
            <div className="flex justify-center mb-2">
              <LogoText size="md" />
            </div>
            <h1 className="text-2xl font-bold text-charcoal">Sign In to Soft4u</h1>
            <p className="text-xs text-charcoal-subtle">Access your purchased digital vault, licenses, and support.</p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-surface-muted border border-charcoal-border text-xs text-charcoal rounded-lg">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-charcoal block mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2.5 pl-8 border border-charcoal-border rounded-lg bg-surface-bg focus:bg-white focus:outline-none focus:border-pista-hover"
                />
                <Mail className="w-3.5 h-3.5 text-charcoal-subtle absolute left-2.5 top-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-charcoal">Password</label>
                <Link href="/forgot-password" className="text-[11px] text-pista-dark hover:underline font-semibold">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 pl-8 border border-charcoal-border rounded-lg bg-surface-bg focus:bg-white focus:outline-none focus:border-pista-hover"
                />
                <Lock className="w-3.5 h-3.5 text-charcoal-subtle absolute left-2.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-pista text-charcoal hover:bg-pista-hover text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center text-xs text-charcoal-subtle">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-charcoal font-bold hover:underline">
              Register now
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
