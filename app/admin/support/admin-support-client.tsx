'use client';

import React, { useState } from 'react';
import { SupportTicket } from '@/lib/db/types';
import { useAuth } from '@/lib/context/auth-context';
import { LifeBuoy, Send, CheckCircle2, Lock, Clock, User } from 'lucide-react';

export function AdminSupportClient({ initialTickets }: { initialTickets: SupportTicket[] }) {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>(initialTickets);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(initialTickets[0] || null);
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply',
          ticketId: selectedTicket.id,
          message: replyText,
          senderId: user?.id || 'admin',
          senderName: `${user?.name || 'Agent'} (Support Desk)`,
          senderRole: 'ADMIN',
          isInternalNote
        })
      });
      const data = await res.json();
      if (data.ticket) {
        setSelectedTicket(data.ticket);
        setTickets(prev => prev.map(t => (t.id === data.ticket.id ? data.ticket : t)));
        setReplyText('');
        setIsInternalNote(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (newStatus: SupportTicket['status']) => {
    if (!selectedTicket) return;
    const updated = { ...selectedTicket, status: newStatus };
    setSelectedTicket(updated);
    setTickets(prev => prev.map(t => (t.id === updated.id ? updated : t)));
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">
          SERVICE DESK & WARRANTY DISPATCH
        </div>
        <h1 className="text-3xl font-extrabold text-charcoal">Support Helpdesk Triage</h1>
        <p className="text-xs text-charcoal-subtle mt-0.5">
          Respond to customer questions, authorize replacements, and log confidential staff notes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border border-charcoal-border rounded-2xl overflow-hidden min-h-[580px] shadow-xs">
        {/* Ticket List */}
        <div className="lg:col-span-4 border-r border-charcoal-border divide-y divide-surface-muted overflow-y-auto max-h-[600px]">
          {tickets.map(t => {
            const isSelected = selectedTicket?.id === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTicket(t)}
                className={`w-full text-left p-4 transition-colors block ${
                  isSelected ? 'bg-pista-lighter' : 'hover:bg-surface-bg'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold text-charcoal">{t.ticketNumber}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-white border border-charcoal-border text-pista-dark font-semibold uppercase">
                    {t.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-xs font-bold text-charcoal line-clamp-1">{t.subject}</div>
                <div className="text-[11px] text-charcoal-subtle mt-1 flex items-center justify-between">
                  <span>{t.customerName}</span>
                  <span className="font-mono">{new Date(t.updatedAt).toLocaleDateString()}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Thread Details & Reply */}
        <div className="lg:col-span-8 flex flex-col justify-between p-6">
          {selectedTicket ? (
            <>
              {/* Header */}
              <div className="pb-4 border-b border-charcoal-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-pista-dark">{selectedTicket.ticketNumber}</span>
                    <span className="text-xs text-charcoal-subtle">by {selectedTicket.customerName} ({selectedTicket.customerEmail})</span>
                  </div>
                  <h2 className="text-base font-bold text-charcoal mt-1">{selectedTicket.subject}</h2>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <select
                    value={selectedTicket.status}
                    onChange={e => handleStatusChange(e.target.value as any)}
                    className="px-2.5 py-1.5 border border-charcoal-border rounded-lg bg-surface-bg font-semibold text-charcoal"
                  >
                    <option value="open">Status: Open</option>
                    <option value="waiting_customer">Waiting on Customer</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Message Feed */}
              <div className="flex-1 py-4 overflow-y-auto space-y-4 max-h-[380px]">
                {selectedTicket.messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.senderRole === 'ADMIN'
                        ? 'items-end'
                        : 'items-start'
                    }`}
                  >
                    <div className="text-[10px] text-charcoal-subtle mb-1 px-1 flex items-center gap-1.5">
                      <span className="font-semibold text-charcoal">{msg.senderName}</span>
                      {msg.isInternalNote && (
                        <span className="px-1.5 py-0.2 bg-surface-muted text-charcoal rounded font-bold uppercase text-[9px] flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" /> Staff Internal Note
                        </span>
                      )}
                      <span>· {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div
                      className={`p-3.5 rounded-xl max-w-[85%] text-xs leading-relaxed ${
                        msg.isInternalNote
                          ? 'bg-pista-lighter text-charcoal border border-pista'
                          : msg.senderRole === 'CUSTOMER'
                          ? 'bg-surface-bg text-charcoal border border-charcoal-border'
                          : 'bg-pista-dark text-white'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="pt-4 border-t border-charcoal-border space-y-2 text-xs">
                <div className="flex items-center gap-2 pb-1">
                  <label className="flex items-center gap-1.5 cursor-pointer text-charcoal-muted select-none">
                    <input
                      type="checkbox"
                      checked={isInternalNote}
                      onChange={e => setIsInternalNote(e.target.checked)}
                      className="accent-pista-hover"
                    />
                    <span className="text-[11px] font-semibold">Post as Internal Staff Note (Invisible to customer)</span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder={isInternalNote ? 'Log private internal note for other agents...' : 'Reply to customer...'}
                    className="flex-1 px-3 py-2.5 border border-charcoal-border rounded-lg bg-surface-bg focus:bg-white focus:outline-none focus:border-pista-hover"
                  />
                  <button
                    type="submit"
                    disabled={loading || !replyText.trim()}
                    className="px-5 py-2.5 bg-pista text-charcoal hover:bg-pista-hover font-bold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-charcoal-subtle">
              Select a support ticket to begin triage.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
