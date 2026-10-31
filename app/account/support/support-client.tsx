'use client';

import React, { useState } from 'react';
import { ChevronLeft, LifeBuoy, Loader2, Plus, Send, X } from 'lucide-react';
import type { SupportTicket } from '@/lib/db/types';
import { Select } from '@/components/ui/select';
import { FormAlert } from '@/components/auth/auth-ui';

const CATEGORIES = ['General Support', 'Order & delivery', 'Replacement warranty', 'Payment', 'Account'];
const inputCls =
  'w-full min-h-11 px-3 text-base sm:text-sm border border-charcoal-border rounded-xl bg-surface-bg text-charcoal focus:bg-white focus:outline-none focus:border-pista-500 focus:ring-2 focus:ring-pista-100';

const STATUS: Record<SupportTicket['status'], string> = {
  open: 'Open',
  pending: 'In progress',
  waiting_customer: 'Waiting for you',
  resolved: 'Resolved',
  closed: 'Closed',
};

export function SupportClient({ initialTickets, orderNumbers }: { initialTickets: SupportTicket[]; orderNumbers: string[] }) {
  const [tickets, setTickets] = useState<SupportTicket[]>(initialTickets);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [newOpen, setNewOpen] = useState(initialTickets.length === 0);
  const [subject, setSubject] = useState('');
  const [orderId, setOrderId] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [message, setMessage] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const selected = tickets.find(t => t.id === selectedId) || null;

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !replyText.trim()) return;
    setReplyLoading(true);
    setError('');
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reply', ticketId: selected.id, message: replyText }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ticket) throw new Error(data.error || 'Could not send your reply');
      setTickets(prev => prev.map(t => (t.id === data.ticket.id ? data.ticket : t)));
      setReplyText('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setReplyLoading(false);
    }
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return setError('Add a subject and a message.');
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), orderId: orderId || undefined, category, message: message.trim(), priority: 'medium' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ticket) throw new Error(data.error || 'Could not open the ticket');
      setTickets(prev => [data.ticket, ...prev]);
      setSelectedId(data.ticket.id);
      setNewOpen(false);
      setSubject('');
      setOrderId('');
      setMessage('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">Support</div>
          <h1 className="text-2xl font-extrabold text-charcoal">Help with an order</h1>
          <p className="text-sm text-charcoal-subtle mt-0.5">Report a problem, ask for a replacement, or ask a question. We reply here and by email.</p>
        </div>
        <button type="button" onClick={() => setNewOpen(true)} className="min-h-11 px-4 bg-pista-dark text-white hover:bg-pista-darker text-sm font-bold rounded-xl inline-flex items-center justify-center gap-1.5">
          <Plus className="w-4 h-4" aria-hidden="true" />
          New ticket
        </button>
      </div>

      {error && <FormAlert>{error}</FormAlert>}

      {newOpen && (
        <form onSubmit={create} className="bg-white border border-charcoal-border rounded-2xl p-4 sm:p-6 space-y-4" noValidate>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-charcoal">Open a support ticket</h2>
            {tickets.length > 0 && (
              <button type="button" onClick={() => setNewOpen(false)} className="w-11 h-11 inline-flex items-center justify-center rounded-xl text-charcoal-subtle hover:text-charcoal" aria-label="Close">
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            )}
          </div>
          <label className="block">
            <span className="text-sm font-semibold text-charcoal">Subject</span>
            <input value={subject} onChange={e => setSubject(e.target.value)} maxLength={160} placeholder="e.g. My login stopped working" className={`${inputCls} mt-1`} />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span id="tk-cat" className="text-sm font-semibold text-charcoal block mb-1">
                Topic
              </span>
              <Select value={category} onChange={setCategory} options={CATEGORIES.map(c => ({ value: c, label: c }))} ariaLabelledBy="tk-cat" />
            </div>
            <div>
              <span id="tk-order" className="text-sm font-semibold text-charcoal block mb-1">
                Order (optional)
              </span>
              <Select
                value={orderId}
                onChange={setOrderId}
                placeholder="No specific order"
                options={[{ value: '', label: 'No specific order' }, ...orderNumbers.map(n => ({ value: n, label: n }))]}
                ariaLabelledBy="tk-order"
              />
            </div>
          </div>
          <label className="block">
            <span className="text-sm font-semibold text-charcoal">Message</span>
            <textarea rows={4} value={message} onChange={e => setMessage(e.target.value)} maxLength={5000} placeholder="Tell us what happened. Add any error message you see." className={`${inputCls} mt-1 py-2.5`} />
          </label>
          <button type="submit" disabled={creating} className="min-h-11 px-5 bg-pista text-charcoal hover:bg-pista-hover text-sm font-bold rounded-xl inline-flex items-center gap-2 disabled:opacity-60">
            {creating && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            Submit ticket
          </button>
        </form>
      )}

      {tickets.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 bg-white border border-charcoal-border rounded-2xl overflow-hidden">
          <ul className={`lg:col-span-4 lg:border-r border-charcoal-border divide-y divide-surface-muted max-h-[600px] overflow-y-auto ${selected ? 'hidden lg:block' : ''}`}>
            {tickets.map(t => (
              <li key={t.id}>
                <button type="button" onClick={() => setSelectedId(t.id)} className={`w-full text-left p-4 min-h-11 ${selected?.id === t.id ? 'bg-pista-lighter' : 'hover:bg-surface-bg'}`}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-charcoal">{t.ticketNumber}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-charcoal-border text-pista-dark font-bold">{STATUS[t.status]}</span>
                  </div>
                  <div className="text-sm font-bold text-charcoal line-clamp-1">{t.subject}</div>
                  <div className="text-xs text-charcoal-subtle mt-1">
                    {t.category} · {new Date(t.updatedAt).toLocaleDateString('en-GB')}
                  </div>
                </button>
              </li>
            ))}
          </ul>

          <div className={`lg:col-span-8 flex flex-col p-4 sm:p-6 min-h-[420px] ${selected ? '' : 'hidden lg:flex'}`}>
            {selected ? (
              <>
                <div className="pb-4 border-b border-charcoal-border">
                  <button type="button" onClick={() => setSelectedId(null)} className="lg:hidden inline-flex items-center gap-1 min-h-11 text-sm font-semibold text-charcoal-muted">
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" /> All tickets
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-pista-dark">{selected.ticketNumber}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-pista-lighter text-pista-dark font-bold">{STATUS[selected.status]}</span>
                  </div>
                  <h2 className="text-base font-bold text-charcoal mt-1">{selected.subject}</h2>
                  {selected.orderId && <div className="text-xs text-charcoal-subtle mt-0.5">Order: <span className="font-mono font-semibold text-charcoal">{selected.orderId}</span></div>}
                </div>
                <div className="flex-1 py-4 overflow-y-auto space-y-4 max-h-[420px]">
                  {selected.messages.map(m => {
                    const mine = m.senderRole === 'CUSTOMER';
                    return (
                      <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                        <div className="text-[11px] text-charcoal-subtle mb-1 px-1">
                          <span className="font-semibold text-charcoal">{mine ? 'You' : m.senderName}</span> · {new Date(m.timestamp).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className={`p-3 rounded-xl max-w-[88%] text-sm leading-relaxed whitespace-pre-line break-words ${mine ? 'bg-pista-dark text-white' : 'bg-surface-bg text-charcoal border border-charcoal-border'}`}>{m.message}</div>
                      </div>
                    );
                  })}
                </div>
                {selected.status !== 'closed' && (
                  <form onSubmit={sendReply} className="pt-4 border-t border-charcoal-border flex gap-2">
                    <label htmlFor="ticket-reply" className="sr-only">
                      Your reply
                    </label>
                    <input id="ticket-reply" value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write a reply..." className={`${inputCls} flex-1 min-w-0`} />
                    <button type="submit" disabled={replyLoading || !replyText.trim()} className="min-h-11 px-4 bg-pista text-charcoal hover:bg-pista-hover text-sm font-bold rounded-xl inline-flex items-center gap-1.5 disabled:opacity-50">
                      <Send className="w-4 h-4" aria-hidden="true" />
                      <span className="hidden sm:inline">{replyLoading ? 'Sending...' : 'Reply'}</span>
                    </button>
                  </form>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-sm text-charcoal-subtle gap-2">
                <LifeBuoy className="w-8 h-8 text-pista-dark" aria-hidden="true" />
                Choose a ticket to read the conversation.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
