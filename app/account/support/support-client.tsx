'use client';

import React, { useState } from 'react';
import { SupportTicket, TicketMessage } from '@/lib/db/types';
import { useAuth } from '@/lib/context/auth-context';
import {
  LifeBuoy,
  Plus,
  Send,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';

export function SupportClient({ initialTickets }: { initialTickets: SupportTicket[] }) {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>(initialTickets);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(initialTickets[0] || null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  // New ticket modal
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newOrderId, setNewOrderId] = useState('');
  const [newCategory, setNewCategory] = useState('General Support');
  const [newMessage, setNewMessage] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim() || replyLoading) return;

    setReplyLoading(true);
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply',
          ticketId: selectedTicket.id,
          message: replyText,
          senderId: user?.id || 'customer',
          senderName: user?.name || 'Customer',
          senderRole: 'CUSTOMER'
        })
      });
      const data = await res.json();
      if (data.ticket) {
        setSelectedTicket(data.ticket);
        setTickets(prev => prev.map(t => (t.id === data.ticket.id ? data.ticket : t)));
        setReplyText('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReplyLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject || !newMessage) return;

    setCreateLoading(true);
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: user?.id,
          customerName: user?.name || 'Demo Customer',
          customerEmail: user?.email || 'customer@example.com',
          subject: newSubject,
          orderId: newOrderId || undefined,
          category: newCategory,
          message: newMessage,
          priority: 'medium'
        })
      });
      const data = await res.json();
      if (data.ticket) {
        setTickets([data.ticket, ...tickets]);
        setSelectedTicket(data.ticket);
        setNewModalOpen(false);
        setNewSubject('');
        setNewOrderId('');
        setNewMessage('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">
            24/7 DEDICATED ASSISTANCE
          </div>
          <h1 className="text-2xl font-extrabold text-charcoal">Customer Support Helpdesk</h1>
          <p className="text-xs text-charcoal-subtle mt-0.5">
            Submit questions, report access interruptions, or request credential swaps under our 100% warranty.
          </p>
        </div>

        <button
          onClick={() => setNewModalOpen(true)}
          className="px-4 py-2 bg-pista-dark text-white hover:bg-pista-darker text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 text-pista-dark" />
          <span>New Support Ticket</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border border-charcoal-border rounded-2xl overflow-hidden min-h-[550px] shadow-xs">
        {/* Ticket List Column */}
        <div className="lg:col-span-4 border-r border-charcoal-border divide-y divide-surface-muted overflow-y-auto max-h-[600px]">
          {tickets.length > 0 ? (
            tickets.map(ticket => {
              const isSelected = selectedTicket?.id === ticket.id;
              return (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`w-full text-left p-4 transition-colors block ${
                    isSelected ? 'bg-pista-lighter' : 'hover:bg-surface-bg'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[11px] font-bold text-charcoal">
                      {ticket.ticketNumber}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white border border-charcoal-border text-pista-dark font-semibold uppercase">
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-charcoal line-clamp-1">
                    {ticket.subject}
                  </div>
                  <div className="text-[11px] text-charcoal-subtle mt-1 flex items-center justify-between">
                    <span>{ticket.category}</span>
                    <span className="font-mono">{new Date(ticket.updatedAt).toLocaleDateString()}</span>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-charcoal-subtle">
              No tickets created yet. Click &quot;New Support Ticket&quot; to reach our team!
            </div>
          )}
        </div>

        {/* Message Thread Column */}
        <div className="lg:col-span-8 flex flex-col justify-between p-6">
          {selectedTicket ? (
            <>
              {/* Header */}
              <div className="pb-4 border-b border-charcoal-border flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-pista-dark">{selectedTicket.ticketNumber}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-pista-lighter text-pista-dark font-bold uppercase">
                      {selectedTicket.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-charcoal mt-1">{selectedTicket.subject}</h2>
                  {selectedTicket.orderId && (
                    <div className="text-[11px] text-charcoal-subtle mt-0.5">
                      Associated Order: <span className="font-mono font-semibold text-charcoal">{selectedTicket.orderId}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 py-4 overflow-y-auto space-y-4 max-h-[400px]">
                {selectedTicket.messages.map(msg => {
                  // Internal notes are invisible to customers
                  if (msg.isInternalNote) return null;

                  const isMe = msg.senderRole === 'CUSTOMER';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="text-[10px] text-charcoal-subtle mb-1 px-1">
                        <span className="font-semibold text-charcoal">{msg.senderName}</span> ·{' '}
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div
                        className={`p-3.5 rounded-xl max-w-[85%] text-xs leading-relaxed ${
                          isMe
                            ? 'bg-pista-dark text-white'
                            : 'bg-surface-bg text-charcoal border border-charcoal-border'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="pt-4 border-t border-charcoal-border flex gap-2">
                <input
                  type="text"
                  required
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Type your reply to the support desk..."
                  className="flex-1 text-xs px-3 py-2.5 border border-charcoal-border rounded-lg bg-surface-bg focus:bg-white focus:outline-none focus:border-pista-hover"
                />
                <button
                  type="submit"
                  disabled={replyLoading || !replyText.trim()}
                  className="px-4 py-2.5 bg-pista text-charcoal hover:bg-pista-hover text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{replyLoading ? 'Sending...' : 'Reply'}</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-charcoal-subtle">
              Select a ticket on the left to read conversation.
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {newModalOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-charcoal-border rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-muted">
              <h2 className="text-base font-bold text-charcoal">Open New Support Ticket</h2>
              <button onClick={() => setNewModalOpen(false)} className="text-charcoal-subtle hover:text-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-charcoal block mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  placeholder="e.g. Account replacement request / Key invalid"
                  className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg focus:bg-white focus:outline-none focus:border-pista-hover"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-charcoal block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg"
                  >
                    <option value="General Support">General Support</option>
                    <option value="Replacement Warranty">Replacement Warranty</option>
                    <option value="Billing / Invoice">Billing / Invoice</option>
                    <option value="Renewal Extension">Renewal Extension</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-charcoal block mb-1">Order Number (Optional)</label>
                  <input
                    type="text"
                    value={newOrderId}
                    onChange={e => setNewOrderId(e.target.value)}
                    placeholder="e.g. PK-84912"
                    className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-charcoal block mb-1">Message Description *</label>
                <textarea
                  rows={4}
                  required
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Describe your inquiry or the issue you are encountering..."
                  className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg focus:bg-white focus:outline-none focus:border-pista-hover"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-surface-muted">
                <button
                  type="button"
                  onClick={() => setNewModalOpen(false)}
                  className="px-4 py-2 border border-charcoal-border rounded-lg text-xs font-semibold text-charcoal-muted hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 bg-pista text-charcoal hover:bg-pista-hover text-xs font-bold rounded-lg"
                >
                  {createLoading ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
