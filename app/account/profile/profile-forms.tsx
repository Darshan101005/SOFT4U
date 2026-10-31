'use client';

import React, { useState } from 'react';
import { LocalTime } from '@/components/local-time';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Mail } from 'lucide-react';
import { useAuth } from '@/lib/context/auth-context';
import { checkPassword } from '@/lib/password-policy';
import { FormAlert, PasswordInput, PasswordStrength } from '@/components/auth/auth-ui';

const PHONE_RE = /^\+?[0-9 ()-]{7,20}$/;
const inputCls =
  'w-full min-h-11 px-3 text-base sm:text-sm border border-charcoal-border rounded-xl bg-surface-bg text-charcoal focus:bg-white focus:outline-none focus:border-pista-500 focus:ring-2 focus:ring-pista-100';

interface ProfileUser {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  telegram: string;
  createdAt: string;
}

export function ProfileForms({ user }: { user: ProfileUser }) {
  const router = useRouter();
  const { refresh } = useAuth();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [whatsapp, setWhatsapp] = useState(user.whatsapp);
  const [telegram, setTelegram] = useState(user.telegram ? `@${user.telegram}` : '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (name.trim().length < 2) return setMsg({ tone: 'error', text: 'Enter your full name.' });
    if (phone.trim() && !PHONE_RE.test(phone.trim())) return setMsg({ tone: 'error', text: 'Enter a valid mobile number with country code.' });
    if (whatsapp.trim() && !PHONE_RE.test(whatsapp.trim())) return setMsg({ tone: 'error', text: 'Enter a valid WhatsApp number with country code.' });
    const tg = telegram.trim().replace(/^@+/, '');
    if (tg && !/^[A-Za-z0-9_]{4,32}$/.test(tg)) return setMsg({ tone: 'error', text: 'Telegram usernames use 4-32 letters, numbers or underscores.' });
    setSaving(true);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), whatsapp: whatsapp.trim(), telegram: tg }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save your details');
      setMsg({ tone: 'ok', text: 'Your details are saved.' });
      await refresh();
      router.refresh();
    } catch (err) {
      setMsg({ tone: 'error', text: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (!current) return setPwMsg({ tone: 'error', text: 'Enter your current password.' });
    const pw = checkPassword(password);
    if (!pw.ok) return setPwMsg({ tone: 'error', text: pw.error || 'Choose a stronger password.' });
    if (password !== confirm) return setPwMsg({ tone: 'error', text: 'New passwords do not match.' });
    setPwSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, password, confirmPassword: confirm }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not change your password');
      setCurrent('');
      setPassword('');
      setConfirm('');
      setPwMsg({ tone: 'ok', text: 'Password changed. Other devices were signed out.' });
    } catch (err) {
      setPwMsg({ tone: 'error', text: (err as Error).message });
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={save} className="bg-white border border-charcoal-border rounded-2xl p-4 sm:p-6 space-y-4" noValidate>
        <h2 className="text-base font-bold text-charcoal">Personal and contact details</h2>
        {msg && <FormAlert tone={msg.tone === 'ok' ? 'ok' : 'error'}>{msg.text}</FormAlert>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="pf-name" className="text-sm font-semibold text-charcoal block mb-1">
              Full name
            </label>
            <input id="pf-name" value={name} onChange={e => setName(e.target.value)} maxLength={80} autoComplete="name" className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <span className="text-sm font-semibold text-charcoal block mb-1">Email</span>
            <div className="min-h-11 px-3 rounded-xl border border-charcoal-border bg-surface-muted text-sm text-charcoal-muted flex items-center gap-2 break-all">
              <Mail className="w-4 h-4 text-pista-dark shrink-0" aria-hidden="true" />
              {user.email}
              <span className="ml-auto text-[11px] font-bold text-pista-darker whitespace-nowrap">Verified</span>
            </div>
          </div>
          <div>
            <label htmlFor="pf-whatsapp" className="text-sm font-semibold text-charcoal block mb-1">
              WhatsApp number
            </label>
            <input id="pf-whatsapp" type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+92 300 1234567" className={inputCls} />
          </div>
          <div>
            <label htmlFor="pf-phone" className="text-sm font-semibold text-charcoal block mb-1">
              Mobile number
            </label>
            <input id="pf-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+92 300 1234567" autoComplete="tel" className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="pf-telegram" className="text-sm font-semibold text-charcoal block mb-1">
              Telegram username
            </label>
            <input id="pf-telegram" value={telegram} onChange={e => setTelegram(e.target.value)} placeholder="@username" className={inputCls} />
            <p className="mt-1 text-xs text-charcoal-subtle">
              To get deliveries in Telegram, also{' '}
              <Link href="/account/telegram" className="underline font-semibold text-pista-darker">
                connect the bot
              </Link>
              .
            </p>
          </div>
        </div>
        <button type="submit" disabled={saving} className="min-h-11 px-5 rounded-xl bg-pista-dark text-white text-sm font-bold inline-flex items-center gap-2 disabled:opacity-60">
          {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          Save details
        </button>
      </form>

      <form onSubmit={changePassword} className="bg-white border border-charcoal-border rounded-2xl p-4 sm:p-6 space-y-4" noValidate>
        <h2 className="text-base font-bold text-charcoal">Change password</h2>
        {pwMsg && <FormAlert tone={pwMsg.tone === 'ok' ? 'ok' : 'error'}>{pwMsg.text}</FormAlert>}
        <div>
          <label htmlFor="pw-current" className="text-sm font-semibold text-charcoal block mb-1">
            Current password
          </label>
          <PasswordInput id="pw-current" value={current} onChange={setCurrent} autoComplete="current-password" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="pw-new" className="text-sm font-semibold text-charcoal block mb-1">
              New password
            </label>
            <PasswordInput id="pw-new" value={password} onChange={setPassword} autoComplete="new-password" />
          </div>
          <div>
            <label htmlFor="pw-confirm" className="text-sm font-semibold text-charcoal block mb-1">
              Confirm new password
            </label>
            <PasswordInput id="pw-confirm" value={confirm} onChange={setConfirm} autoComplete="new-password" invalid={confirm.length > 0 && confirm !== password} />
          </div>
        </div>
        <PasswordStrength password={password} />
        <button type="submit" disabled={pwSaving} className="min-h-11 px-5 rounded-xl bg-pista text-charcoal text-sm font-bold inline-flex items-center gap-2 disabled:opacity-60">
          {pwSaving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          Change password
        </button>
      </form>

      <p className="text-xs text-charcoal-subtle">Member since <LocalTime iso={user.createdAt} format="month" />.</p>
    </div>
  );
}
