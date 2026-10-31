'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ExternalLink, KeyRound, Loader2, Send, Unlink } from 'lucide-react';
import { useAuth } from '@/lib/context/auth-context';
import { FormAlert, mmss } from '@/components/auth/auth-ui';
import { CopyButton } from '@/components/ui/copy-button';

interface LinkCode {
  code: string;
  expiresAt: string;
  deepLink: string | null;
}

export function TelegramClient({
  enabled,
  botUsername,
  botUrl,
  linked: initialLinked,
}: {
  enabled: boolean;
  botUsername: string | null;
  botUrl: string | null;
  linked: { username: string; linkedAt: string } | null;
}) {
  const router = useRouter();
  const { refresh } = useAuth();
  const [linked, setLinked] = useState(initialLinked);
  const [code, setCode] = useState<LinkCode | null>(null);
  const [left, setLeft] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!code) return;
    const tick = () => setLeft(Math.max(0, Math.ceil((new Date(code.expiresAt).getTime() - Date.now()) / 1000)));
    const t = setInterval(tick, 1000);
    const first = setTimeout(tick, 0);
    return () => {
      clearInterval(t);
      clearTimeout(first);
    };
  }, [code]);

  // While a code is showing, check every 5 s whether the bot linked the chat.
  useEffect(() => {
    if (!code || linked) return;
    const t = setInterval(async () => {
      try {
        const res = await fetch('/api/telegram/link', { cache: 'no-store' });
        const data = await res.json();
        if (data.linked) {
          setLinked({ username: data.linked.username || '', linkedAt: data.linked.linkedAt });
          setCode(null);
          refresh();
          router.refresh();
        }
      } catch {
        // try again on the next tick
      }
    }, 5000);
    return () => clearInterval(t);
  }, [code, linked, refresh, router]);

  const generate = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/telegram/link', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not create a code');
      setCode({ code: data.code, expiresAt: data.expiresAt, deepLink: data.deepLink });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const unlink = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/telegram/link', { method: 'DELETE' });
      if (!res.ok) throw new Error('Could not disconnect Telegram');
      setLinked(null);
      await refresh();
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!enabled) {
    return <FormAlert tone="info">The Telegram bot is not available right now. Please check back soon.</FormAlert>;
  }

  return (
    <div className="space-y-6">
      {error && <FormAlert>{error}</FormAlert>}

      {linked ? (
        <section className="bg-white border border-pista-300 rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-pista-dark shrink-0" aria-hidden="true" />
            <div>
              <h2 className="text-base font-bold text-charcoal">Telegram is connected</h2>
              <p className="text-sm text-charcoal-muted">
                {linked.username ? `Linked to @${linked.username}` : 'Your Telegram chat is linked'} since{' '}
                {new Date(linked.linkedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}. You can choose Telegram delivery at checkout.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {botUrl && (
              <a href={botUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 min-h-11 px-5 rounded-xl bg-pista-dark text-white text-sm font-bold">
                <Send className="w-4 h-4" aria-hidden="true" />
                Open the bot
              </a>
            )}
            <button type="button" onClick={unlink} disabled={busy} className="inline-flex items-center justify-center gap-2 min-h-11 px-5 rounded-xl border border-charcoal-border text-sm font-semibold text-charcoal-muted hover:border-accent-rose hover:text-accent-rose disabled:opacity-60">
              <Unlink className="w-4 h-4" aria-hidden="true" />
              Disconnect
            </button>
          </div>
        </section>
      ) : (
        <section className="bg-white border border-charcoal-border rounded-2xl p-4 sm:p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-charcoal">Connect in one tap</h2>
            <p className="text-sm text-charcoal-muted mt-1">Generate a one-time code, then open the bot. The code links this account to your Telegram chat.</p>
          </div>

          {code && left > 0 ? (
            <div className="p-4 rounded-2xl bg-pista-50 border border-pista-200 space-y-4">
              <div className="text-center">
                <div className="text-xs font-bold uppercase tracking-wider text-pista-darker">Your link code</div>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <span className="font-mono text-3xl sm:text-4xl font-extrabold tracking-[0.3em] text-charcoal select-all">{code.code}</span>
                  <CopyButton value={code.code} label="Copy code" compact />
                </div>
                <div className="mt-1 text-xs text-charcoal-subtle">Expires in {mmss(left)} · single use</div>
              </div>
              {code.deepLink && (
                <a href={code.deepLink} target="_blank" rel="noopener noreferrer" className="w-full inline-flex items-center justify-center gap-2 min-h-12 px-5 rounded-xl bg-pista-dark text-white text-sm font-bold">
                  <Send className="w-4 h-4" aria-hidden="true" />
                  Open {botUsername ? `@${botUsername}` : 'the bot'} and connect
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                </a>
              )}
              <p className="text-xs text-charcoal-muted text-center flex items-center justify-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-pista-dark" aria-hidden="true" />
                Waiting for Telegram. This page updates when you are connected.
              </p>
            </div>
          ) : (
            <button type="button" onClick={generate} disabled={busy} className="min-h-12 px-6 rounded-xl bg-pista text-charcoal text-sm font-bold inline-flex items-center gap-2 disabled:opacity-60">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <KeyRound className="w-4 h-4" aria-hidden="true" />}
              {code ? 'Code expired. Generate a new code' : 'Generate link code'}
            </button>
          )}

          <div className="pt-4 border-t border-surface-muted">
            <h3 className="text-sm font-bold text-charcoal mb-2">Other ways to connect</h3>
            <ul className="text-sm text-charcoal-muted space-y-1.5 list-disc pl-5 marker:text-pista">
              <li>
                Open {botUsername ? <strong>@{botUsername}</strong> : 'the bot'} and send <code className="px-1.5 py-0.5 rounded bg-surface-muted font-mono">/link CODE</code> with the code above.
              </li>
              <li>Or sign in inside the bot with your Soft4u email and password. The bot deletes your password message straight away.</li>
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
