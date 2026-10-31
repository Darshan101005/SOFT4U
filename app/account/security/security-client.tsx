'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Laptop, Loader2, ShieldCheck, ShieldOff, Smartphone } from 'lucide-react';
import { FormAlert, OtpInput, PasswordInput } from '@/components/auth/auth-ui';
import { CopyButton } from '@/components/ui/copy-button';

interface SessionRow {
  id: string;
  device: string;
  ip: string;
  lastUsedAt: string;
  createdAt: string;
  current: boolean;
}

async function post(url: string, body?: unknown) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

function when(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function SecurityClient({ twoFactorEnabled, sessions: initialSessions }: { twoFactorEnabled: boolean; sessions: SessionRow[] }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(twoFactorEnabled);
  const [setup, setSetup] = useState<{ secret: string; qrDataUrl: string } | null>(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [disabling, setDisabling] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [sessions, setSessions] = useState(initialSessions);
  const [revoking, setRevoking] = useState<string | null>(null);

  const startSetup = async () => {
    setMsg(null);
    setBusy(true);
    try {
      const data = await post('/api/auth/2fa/setup');
      setSetup({ secret: data.secret, qrDataUrl: data.qrDataUrl });
      setCode('');
    } catch (err) {
      setMsg({ tone: 'error', text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const enable = async (value = code) => {
    if (value.length !== 6) return;
    setBusy(true);
    setMsg(null);
    try {
      await post('/api/auth/2fa/enable', { code: value });
      setEnabled(true);
      setSetup(null);
      setCode('');
      setMsg({ tone: 'ok', text: 'Two-factor authentication is on. You will need a code from your app each time you sign in.' });
      router.refresh();
    } catch (err) {
      setCode('');
      setMsg({ tone: 'error', text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const disable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || code.length !== 6) return setMsg({ tone: 'error', text: 'Enter your password and a current 6-digit code.' });
    setBusy(true);
    setMsg(null);
    try {
      await post('/api/auth/2fa/disable', { password, code });
      setEnabled(false);
      setDisabling(false);
      setPassword('');
      setCode('');
      setMsg({ tone: 'ok', text: 'Two-factor authentication is off.' });
      router.refresh();
    } catch (err) {
      setCode('');
      setMsg({ tone: 'error', text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (id: string) => {
    setRevoking(id);
    try {
      const res = await fetch(`/api/auth/sessions?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) setSessions(s => s.filter(x => x.id !== id));
    } finally {
      setRevoking(null);
    }
  };

  const revokeOthers = async () => {
    for (const s of sessions.filter(x => !x.current)) await revoke(s.id);
  };

  return (
    <div className="space-y-6">
      <section className="bg-white border border-charcoal-border rounded-2xl p-4 sm:p-6 space-y-4" aria-labelledby="tfa-title">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${enabled ? 'bg-pista-100 text-pista-darker' : 'bg-surface-muted text-charcoal-subtle'}`}>
              {enabled ? <ShieldCheck className="w-5 h-5" aria-hidden="true" /> : <ShieldOff className="w-5 h-5" aria-hidden="true" />}
            </span>
            <div>
              <h2 id="tfa-title" className="text-base font-bold text-charcoal">
                Two-factor authentication
              </h2>
              <p className="text-sm text-charcoal-muted">Use an authenticator app (Google Authenticator, Microsoft Authenticator, Authy) for a 6-digit code at sign-in.</p>
            </div>
          </div>
          <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${enabled ? 'bg-pista-600 text-white' : 'bg-surface-muted text-charcoal-muted'}`}>{enabled ? 'On' : 'Off'}</span>
        </div>

        {msg && <FormAlert tone={msg.tone === 'ok' ? 'ok' : 'error'}>{msg.text}</FormAlert>}

        {!enabled && !setup && (
          <button type="button" onClick={startSetup} disabled={busy} className="min-h-11 px-5 rounded-xl bg-pista-dark text-white text-sm font-bold inline-flex items-center gap-2 disabled:opacity-60">
            {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            Turn on two-factor authentication
          </button>
        )}

        {!enabled && setup && (
          <div className="grid grid-cols-1 sm:grid-cols-[auto,1fr] gap-5 items-start p-4 rounded-xl bg-pista-50 border border-pista-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={setup.qrDataUrl} alt="QR code for your authenticator app" className="w-44 h-44 rounded-xl bg-white p-2 border border-charcoal-border mx-auto" />
            <div className="space-y-3 min-w-0">
              <ol className="list-decimal pl-5 text-sm text-charcoal-muted space-y-1">
                <li>Scan the QR code with your authenticator app.</li>
                <li>Or enter this key by hand:</li>
              </ol>
              <div className="flex items-center gap-2">
                <code className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-white border border-charcoal-border font-mono text-sm break-all">{setup.secret}</code>
                <CopyButton value={setup.secret} label="Copy key" compact />
              </div>
              <p className="text-sm font-semibold text-charcoal">Enter the 6-digit code from the app</p>
              <OtpInput value={code} onChange={setCode} onComplete={v => enable(v)} disabled={busy} idPrefix="tfa-setup" />
              <div className="flex gap-2">
                <button type="button" onClick={() => enable()} disabled={busy || code.length !== 6} className="min-h-11 px-5 rounded-xl bg-pista-dark text-white text-sm font-bold disabled:opacity-50">
                  Confirm and turn on
                </button>
                <button type="button" onClick={() => setSetup(null)} className="min-h-11 px-4 rounded-xl border border-charcoal-border text-sm font-semibold">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {enabled && !disabling && (
          <button type="button" onClick={() => setDisabling(true)} className="min-h-11 px-5 rounded-xl border border-charcoal-border text-sm font-semibold text-charcoal-muted hover:border-accent-rose hover:text-accent-rose">
            Turn off two-factor authentication
          </button>
        )}

        {enabled && disabling && (
          <form onSubmit={disable} className="space-y-3 p-4 rounded-xl bg-surface-muted" noValidate>
            <div>
              <label htmlFor="tfa-password" className="text-sm font-semibold text-charcoal block mb-1">
                Your password
              </label>
              <PasswordInput id="tfa-password" value={password} onChange={setPassword} autoComplete="current-password" />
            </div>
            <p className="text-sm font-semibold text-charcoal">Current code from your app</p>
            <OtpInput value={code} onChange={setCode} disabled={busy} idPrefix="tfa-off" />
            <div className="flex gap-2">
              <button type="submit" disabled={busy} className="min-h-11 px-5 rounded-xl bg-accent-rose text-white text-sm font-bold disabled:opacity-60">
                Turn off
              </button>
              <button type="button" onClick={() => setDisabling(false)} className="min-h-11 px-4 rounded-xl border border-charcoal-border bg-white text-sm font-semibold">
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="bg-white border border-charcoal-border rounded-2xl p-4 sm:p-6 space-y-4" aria-labelledby="sessions-title">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 id="sessions-title" className="text-base font-bold text-charcoal">
            Signed-in devices
          </h2>
          {sessions.some(s => !s.current) && (
            <button type="button" onClick={revokeOthers} className="min-h-11 px-3 rounded-xl border border-charcoal-border text-xs font-bold text-charcoal-muted hover:border-accent-rose hover:text-accent-rose">
              Sign out all other devices
            </button>
          )}
        </div>
        <ul className="divide-y divide-surface-muted">
          {sessions.map(s => {
            const mobile = /iphone|android|mobile|ipad/i.test(s.device);
            return (
              <li key={s.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  {mobile ? <Smartphone className="w-5 h-5 text-pista-dark shrink-0" aria-hidden="true" /> : <Laptop className="w-5 h-5 text-pista-dark shrink-0" aria-hidden="true" />}
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-charcoal">
                      {s.device} {s.current && <span className="ml-1 text-[11px] font-bold text-pista-darker">This device</span>}
                    </div>
                    <div className="text-xs text-charcoal-subtle break-all">
                      {s.ip ? `${s.ip} · ` : ''}Last active {when(s.lastUsedAt)}
                    </div>
                  </div>
                </div>
                {!s.current && (
                  <button type="button" onClick={() => revoke(s.id)} disabled={revoking === s.id} className="shrink-0 min-h-11 px-3 rounded-xl border border-charcoal-border text-xs font-bold text-charcoal-muted hover:border-accent-rose hover:text-accent-rose disabled:opacity-50">
                    {revoking === s.id ? 'Signing out...' : 'Sign out'}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
