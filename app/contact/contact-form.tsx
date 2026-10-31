'use client';

import React, { useState } from 'react';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { useAuth } from '@/lib/context/auth-context';
import { FormAlert } from '@/components/auth/auth-ui';

const inputClass =
  'w-full min-h-11 px-3 text-base sm:text-sm border border-charcoal-border rounded-xl bg-surface-bg focus:bg-surface-card focus:outline-none focus:border-pista-500 focus:ring-2 focus:ring-pista-100 text-charcoal';

export function ContactForm({ whatsapp, whatsappHref }: { whatsapp: string; whatsappHref: string }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState('');

  const nameValue = name || (user?.name ?? '');
  const emailValue = email || (user?.email ?? '');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameValue, email: emailValue, phone, subject, message, website }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not send your message');
      setSentTo(emailValue);
      setSubject('');
      setMessage('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-surface-card border border-charcoal-border rounded-2xl p-4 sm:p-8">
      <h2 className="text-lg font-bold text-charcoal mb-1">Send us a message</h2>
      <p className="text-sm text-charcoal-subtle mb-5">Fill in the form and our team will reply by email.</p>

      {sentTo ? (
        <div role="status" className="p-6 bg-pista-lighter border border-pista-light rounded-xl text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-pista-dark mx-auto" aria-hidden="true" />
          <h3 className="text-base font-bold text-charcoal">Thank you, your message was sent.</h3>
          <p className="text-sm text-charcoal-muted">
            We will reply to <span className="font-semibold break-all">{sentTo}</span> within 24 hours. For urgent help, WhatsApp us at{' '}
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="font-semibold text-pista-darker underline">
              {whatsapp}
            </a>
            .
          </p>
          <button type="button" onClick={() => setSentTo('')} className="mt-2 min-h-11 text-sm font-semibold text-pista-darker hover:underline">
            Send another message
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <FormAlert>{error}</FormAlert>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact-name" className="text-sm font-semibold text-charcoal block mb-1">
                Full name *
              </label>
              <input id="contact-name" type="text" required autoComplete="name" value={nameValue} onChange={e => setName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="contact-email" className="text-sm font-semibold text-charcoal block mb-1">
                Email *
              </label>
              <input id="contact-email" type="email" required autoComplete="email" value={emailValue} onChange={e => setEmail(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact-phone" className="text-sm font-semibold text-charcoal block mb-1">
                Phone / WhatsApp
              </label>
              <input id="contact-phone" type="tel" autoComplete="tel" placeholder="+92 300 1234567" value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="contact-subject" className="text-sm font-semibold text-charcoal block mb-1">
                Subject
              </label>
              <input id="contact-subject" type="text" value={subject} onChange={e => setSubject(e.target.value)} maxLength={140} className={inputClass} />
            </div>
          </div>
          <div>
            <label htmlFor="contact-message" className="text-sm font-semibold text-charcoal block mb-1">
              Message *
            </label>
            <textarea id="contact-message" rows={5} required minLength={10} maxLength={4000} value={message} onChange={e => setMessage(e.target.value)} className={`${inputClass} py-2.5`} />
          </div>
          <div className="hidden" aria-hidden="true">
            <label>
              Website
              <input tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)} />
            </label>
          </div>
          <button type="submit" disabled={sending} className="min-h-12 px-6 bg-pista-dark text-white hover:bg-pista-darker text-sm font-bold rounded-xl inline-flex items-center gap-2 transition-colors disabled:opacity-60">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Send className="w-4 h-4" aria-hidden="true" />}
            <span>{sending ? 'Sending...' : 'Send Message'}</span>
          </button>
        </form>
      )}
    </div>
  );
}
