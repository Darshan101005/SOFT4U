'use client';

import React, { useState } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import { siteConfig } from '@/lib/site-config';

const inputClass =
  'w-full px-3 py-2.5 text-sm border border-charcoal-border rounded-lg bg-surface-bg focus:bg-surface-card focus:outline-none focus:border-pista text-charcoal';

// Mock data until integration: the form only confirms on screen, no message is sent to a backend yet.
export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const reset = () => {
    setName('');
    setEmail('');
    setPhone('');
    setSubject('');
    setMessage('');
    setSubmitted(false);
  };

  return (
    <div className="bg-surface-card border border-charcoal-border rounded-2xl p-6 sm:p-8">
      <h2 className="text-lg font-bold text-charcoal mb-1">Send us a message</h2>
      <p className="text-xs text-charcoal-subtle mb-5">Fill in the form and our team will get back to you shortly.</p>

      {submitted ? (
        <div role="status" className="p-6 bg-pista-lighter border border-pista-light rounded-xl text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-pista-dark mx-auto" aria-hidden="true" />
          <h3 className="text-base font-bold text-charcoal">Thank you, {name || 'your message has been received'}!</h3>
          <p className="text-sm text-charcoal-muted">
            We have received your message and will reply to {email} within 24 hours. For urgent help, WhatsApp us at{' '}
            <a href={siteConfig.whatsappHref} target="_blank" rel="noopener noreferrer" className="font-semibold text-pista-darker underline">
              {siteConfig.whatsapp}
            </a>
            .
          </p>
          <button type="button" onClick={reset} className="mt-2 text-sm font-semibold text-pista-darker hover:underline">
            Send another message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact-name" className="text-sm font-semibold text-charcoal block mb-1">Full name *</label>
              <input id="contact-name" type="text" required autoComplete="name" value={name} onChange={e => setName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="contact-email" className="text-sm font-semibold text-charcoal block mb-1">Email *</label>
              <input id="contact-email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact-phone" className="text-sm font-semibold text-charcoal block mb-1">Phone / WhatsApp</label>
              <input id="contact-phone" type="tel" autoComplete="tel" placeholder="03XX XXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="contact-subject" className="text-sm font-semibold text-charcoal block mb-1">Subject</label>
              <input id="contact-subject" type="text" value={subject} onChange={e => setSubject(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label htmlFor="contact-message" className="text-sm font-semibold text-charcoal block mb-1">Message *</label>
            <textarea id="contact-message" rows={5} required value={message} onChange={e => setMessage(e.target.value)} className={inputClass} />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-pista-dark text-white hover:bg-pista-darker text-sm font-bold rounded-lg inline-flex items-center gap-2 transition-colors"
          >
            <Send className="w-4 h-4" aria-hidden="true" />
            <span>Send Message</span>
          </button>
        </form>
      )}
    </div>
  );
}
