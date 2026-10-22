'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useAuth } from '@/lib/context/auth-context';
import { LogoText } from '@/components/brand/logo';
import { Lock, Mail, User, Phone, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const res = await register(name, email, password, phone);
    if (!res.success) {
      setErrorMsg(res.error || 'Registration failed');
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
            <h1 className="text-2xl font-bold text-charcoal">Create Customer Account</h1>
            <p className="text-xs text-charcoal-subtle">Keep your digital licenses and warranty records organized.</p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-surface-muted border border-charcoal-border text-xs text-charcoal rounded-lg">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-charcoal block mb-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Alex Vance"
                  className="w-full px-3 py-2.5 pl-8 border border-charcoal-border rounded-lg bg-surface-bg focus:bg-white focus:outline-none focus:border-pista-hover"
                />
                <User className="w-3.5 h-3.5 text-charcoal-subtle absolute left-2.5 top-3" />
              </div>
            </div>

            <div>
              <label className="font-semibold text-charcoal block mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full px-3 py-2.5 pl-8 border border-charcoal-border rounded-lg bg-surface-bg focus:bg-white focus:outline-none focus:border-pista-hover"
                />
                <Mail className="w-3.5 h-3.5 text-charcoal-subtle absolute left-2.5 top-3" />
              </div>
            </div>

            <div>
              <label className="font-semibold text-charcoal block mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2.5 pl-8 border border-charcoal-border rounded-lg bg-surface-bg focus:bg-white focus:outline-none focus:border-pista-hover"
                />
                <Lock className="w-3.5 h-3.5 text-charcoal-subtle absolute left-2.5 top-3" />
              </div>
            </div>

            <div>
              <label className="font-semibold text-charcoal block mb-1">Phone Number (Optional)</label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+92 300 0000000"
                  className="w-full px-3 py-2.5 pl-8 border border-charcoal-border rounded-lg bg-surface-bg focus:bg-white focus:outline-none focus:border-pista-hover"
                />
                <Phone className="w-3.5 h-3.5 text-charcoal-subtle absolute left-2.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-pista text-charcoal hover:bg-pista-hover text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <span>{loading ? 'Creating...' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center text-xs text-charcoal-subtle">
            Already have an account?{' '}
            <Link href="/login" className="text-charcoal font-bold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
