'use client';

import React, { useState } from 'react';
import { BellRing, KeyRound, Save, ShieldCheck, ShieldOff, Smartphone, UserCircle2 } from 'lucide-react';
import type { AdminUser } from '@/lib/db/types';
import { checkPassword } from '@/lib/password-policy';
import { Badge, Button, Card, CopyButton, Field, Input, PageHeader, api, errMsg, toast } from '../_components/ui';
import { PasswordMeter } from '../_components/password-meter';
import { fmtDateTime } from '../_components/format';

export function ProfileClient({ admin, telegramReady, botName }: { admin: AdminUser; telegramReady: boolean; botName: string | null }) {
  const [name, setName] = useState(admin.name);
  const [email, setEmail] = useState(admin.email);
  const [savingProfile, setSavingProfile] = useState(false);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  const [twoFactor, setTwoFactor] = useState(admin.twoFactorEnabled);
  const [setup, setSetup] = useState<{ secret: string; qrDataUrl: string } | null>(null);
  const [setupCode, setSetupCode] = useState('');
  const [disablePw, setDisablePw] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [busy2fa, setBusy2fa] = useState(false);

  const [tgLinked, setTgLinked] = useState(Boolean(admin.telegramLinked));
  const [tgCode, setTgCode] = useState<{ code: string; deepLink: string | null; expiresAt?: string } | null>(null);
  const [busyTg, setBusyTg] = useState(false);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api('/api/admin/profile', { method: 'PATCH', body: { name, email } });
      toast.success('Profile saved');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const check = checkPassword(next);
    if (!check.ok) return toast.error(check.error!);
    if (next !== confirm) return toast.error('The new passwords do not match');
    setSavingPw(true);
    try {
      await api('/api/admin/profile/password', { body: { currentPassword: current, password: next, confirmPassword: confirm } });
      setCurrent('');
      setNext('');
      setConfirm('');
      toast.success('Password changed. Your other sessions were signed out.');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSavingPw(false);
    }
  };

  const startSetup = async () => {
    setBusy2fa(true);
    try {
      const res = await api<{ secret: string; qrDataUrl: string }>('/api/admin/2fa/setup', { body: {} });
      setSetup({ secret: res.secret, qrDataUrl: res.qrDataUrl });
      setSetupCode('');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy2fa(false);
    }
  };

  const enable = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy2fa(true);
    try {
      await api('/api/admin/2fa/enable', { body: { code: setupCode.replace(/\s+/g, '') } });
      setTwoFactor(true);
      setSetup(null);
      toast.success('Two-factor authentication is on');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy2fa(false);
    }
  };

  const disable = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy2fa(true);
    try {
      await api('/api/admin/2fa/disable', { body: { password: disablePw, code: disableCode.replace(/\s+/g, '') } });
      setTwoFactor(false);
      setDisablePw('');
      setDisableCode('');
      toast.success('Two-factor authentication is off');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy2fa(false);
    }
  };

  const connectTelegram = async () => {
    setBusyTg(true);
    try {
      const res = await api<{ code: string; deepLink: string | null; expiresAt?: string }>('/api/admin/telegram', { body: {} });
      setTgCode(res);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusyTg(false);
    }
  };

  const disconnectTelegram = async () => {
    setBusyTg(true);
    try {
      await api('/api/admin/telegram', { method: 'DELETE' });
      setTgLinked(false);
      setTgCode(null);
      toast.success('Telegram alerts stopped');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusyTg(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <PageHeader kicker="Settings" title="My profile" description={<>Signed in as {admin.email}. Last sign-in {fmtDateTime(admin.lastLoginAt)}.</>} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={<span className="flex items-center gap-2"><UserCircle2 className="w-4 h-4 text-pista-dark" />Name and email</span>}>
          <form onSubmit={saveProfile} className="space-y-4">
            <Field label="Name" required>
              <Input value={name} onChange={e => setName(e.target.value)} />
            </Field>
            <Field label="Email" required hint="Used to sign in and for new-order alerts.">
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </Field>
            <Button type="submit" loading={savingProfile} icon={Save}>
              Save profile
            </Button>
          </form>
        </Card>

        <Card title={<span className="flex items-center gap-2"><KeyRound className="w-4 h-4 text-pista-dark" />Change password</span>}>
          <form onSubmit={savePassword} className="space-y-4">
            <Field label="Current password" required>
              <Input type="password" autoComplete="current-password" value={current} onChange={e => setCurrent(e.target.value)} />
            </Field>
            <Field label="New password" required>
              <Input type="password" autoComplete="new-password" value={next} onChange={e => setNext(e.target.value)} />
            </Field>
            <Field label="Confirm new password" required>
              <Input type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} />
            </Field>
            <PasswordMeter password={next} confirm={confirm} />
            <Button type="submit" loading={savingPw} disabled={!current || !next || !confirm}>
              Change password
            </Button>
          </form>
        </Card>

        <Card
          title={<span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-pista-dark" />Two-factor authentication</span>}
          actions={twoFactor ? <Badge tone="green">On</Badge> : <Badge tone="gray">Off</Badge>}
          description="Ask for a 6-digit code from an authenticator app (Google Authenticator, Microsoft Authenticator, Authy) at every sign-in."
        >
          {twoFactor ? (
            <form onSubmit={disable} className="space-y-4">
              <p className="text-sm text-charcoal-muted">To turn two-factor off, confirm your password and a current code from your app.</p>
              <Field label="Password" required>
                <Input type="password" value={disablePw} onChange={e => setDisablePw(e.target.value)} />
              </Field>
              <Field label="Current 6-digit code" required>
                <Input inputMode="numeric" maxLength={7} value={disableCode} onChange={e => setDisableCode(e.target.value.replace(/[^\d ]/g, ''))} className="font-mono tracking-widest" />
              </Field>
              <Button type="submit" variant="outline-danger" icon={ShieldOff} loading={busy2fa} disabled={!disablePw || disableCode.replace(/\s/g, '').length !== 6}>
                Turn off two-factor
              </Button>
            </form>
          ) : setup ? (
            <form onSubmit={enable} className="space-y-4">
              <ol className="text-sm text-charcoal-muted list-decimal pl-5 space-y-1">
                <li>Open your authenticator app and scan this QR code.</li>
                <li>Enter the 6-digit code the app shows.</li>
              </ol>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={setup.qrDataUrl} alt="Two-factor QR code" className="w-44 h-44 rounded-xl border border-charcoal-border bg-white p-2" />
                <div className="text-xs text-charcoal-subtle space-y-1 min-w-0">
                  <div>Cannot scan? Enter this key manually:</div>
                  <div className="flex items-center gap-1">
                    <code className="font-mono text-charcoal font-bold break-all">{setup.secret}</code>
                    <CopyButton value={setup.secret} label="Key" />
                  </div>
                </div>
              </div>
              <Field label="6-digit code" required>
                <Input inputMode="numeric" maxLength={7} autoFocus value={setupCode} onChange={e => setSetupCode(e.target.value.replace(/[^\d ]/g, ''))} className="font-mono tracking-widest" />
              </Field>
              <div className="flex gap-2">
                <Button type="submit" loading={busy2fa} disabled={setupCode.replace(/\s/g, '').length !== 6}>
                  Verify and turn on
                </Button>
                <Button variant="secondary" onClick={() => setSetup(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button icon={Smartphone} onClick={startSetup} loading={busy2fa}>
              Set up two-factor
            </Button>
          )}
        </Card>

        <Card
          title={<span className="flex items-center gap-2"><BellRing className="w-4 h-4 text-pista-dark" />Telegram order alerts</span>}
          actions={tgLinked ? <Badge tone="green">Connected</Badge> : <Badge tone="gray">Not connected</Badge>}
          description="Get a Telegram message from the Soft4u bot when an order is placed or a payment proof arrives."
        >
          {!telegramReady ? (
            <p className="text-sm text-charcoal-muted">The Telegram bot is not configured yet (TELEGRAM_BOT_TOKEN). Alerts still arrive by email.</p>
          ) : tgLinked ? (
            <Button variant="outline-danger" onClick={disconnectTelegram} loading={busyTg}>
              Stop Telegram alerts
            </Button>
          ) : tgCode ? (
            <div className="space-y-3 text-sm">
              <p className="text-charcoal-muted">
                Open {botName ? <strong>@{botName}</strong> : 'the bot'} and send this code, or tap the button. The code works for 15 minutes.
              </p>
              <div className="flex items-center gap-2">
                <code className="px-3 py-2 rounded-xl bg-pista-lighter text-pista-darker font-mono text-xl font-extrabold tracking-[0.3em]">{tgCode.code}</code>
                <CopyButton value={tgCode.code} label="Code" />
              </div>
              <div className="flex flex-wrap gap-2">
                {tgCode.deepLink && (
                  <a href={tgCode.deepLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-2.5 rounded-xl bg-pista text-charcoal font-bold text-sm hover:bg-pista-hover">
                    Open Telegram
                  </a>
                )}
                <Button variant="secondary" onClick={() => window.location.reload()}>
                  I have sent it
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={connectTelegram} loading={busyTg}>
              Connect Telegram
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
}
