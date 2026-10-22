'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg">
      <Header />
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-12 flex flex-col justify-center">
        <div className="bg-white border border-charcoal-border rounded-2xl p-8 shadow-xs space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-charcoal">Reset Your Password</h1>
            <p className="text-xs text-charcoal-subtle">Enter your registered email to receive recovery instructions.</p>
          </div>

          {submitted ? (
            <div className="p-4 bg-pista-lighter border border-pista rounded-xl text-center space-y-2 text-xs">
              <CheckCircle2 className="w-8 h-8 text-pista-dark mx-auto" />
              <div className="font-bold text-charcoal">Recovery Email Dispatched</div>
              <p className="text-charcoal-muted">
                We sent a secure password reset link to <span className="font-semibold text-charcoal">{email}</span>. Please check your inbox or spam folder.
              </p>
              <div className="pt-2">
                <Link href="/login" className="text-charcoal font-bold underline">
                  Back to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-charcoal block mb-1">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. alex@example.com"
                    className="w-full px-3 py-2.5 pl-8 border border-charcoal-border rounded-lg bg-surface-bg focus:bg-white focus:outline-none focus:border-pista-hover"
                  />
                  <Mail className="w-3.5 h-3.5 text-charcoal-subtle absolute left-2.5 top-3" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-pista-dark text-white hover:bg-pista-darker text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Send Reset Link</span>
                <ArrowRight className="w-4 h-4 text-pista-dark" />
              </button>

              <div className="text-center text-xs text-charcoal-subtle pt-2">
                Remember your password?{' '}
                <Link href="/login" className="text-charcoal font-bold hover:underline">
                  Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
