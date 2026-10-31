'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, LifeBuoy, Lock, Send } from 'lucide-react';
import type { SupportTicket } from '@/lib/db/types';
import { Badge, Button, Card, Checkbox, EmptyState, SearchInput, SegmentChips, Select, Textarea, api, cx, errMsg, toast, PageHeader } from '../_components/ui';
import { fmtDateTime, timeAgo } from '../_components/format';

const STATUS_LABELS: Record<SupportTicket['status'], string> = {
  open: 'Open',
  pending: 'Pending',
  waiting_customer: 'Waiting for customer',
  resolved: 'Resolved',
  closed: 'Closed',
};
const STATUS_TONES: Record<SupportTicket['status'], 'amber' | 'blue' | 'gray' | 'green'> = {
  open: 'amber',
  pending: 'amber',
  waiting_customer: 'blue',
  resolved: 'green',
  closed: 'gray',
};

type Filter = 'active' | 'all' | SupportTicket['status'];

export function AdminSupportClient({ initialTickets }: { initialTickets: SupportTicket[] }) {
  const [tickets, setTickets] = useState(initialTickets);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('active');
  const [search, setSearch] = useState('');
  const [reply, setReply] = useState('');
  const [internal, setInternal] = useState(false);
  const [sending, setSending] = useState(false);

  const selected = tickets.find(t => t.id === selectedId) || null;
  const count = (f: Filter) => tickets.filter(t => (f === 'all' ? true : f === 'active' ? ['open', 'pending', 'waiting_customer'].includes(t.status) : t.status === f)).length;
  const list = tickets
    .filter(t => (filter === 'all' ? true : filter === 'active' ? ['open', 'pending', 'waiting_customer'].includes(t.status) : t.status === filter))
    .filter(t => {
      const q = search.trim().toLowerCase();
      return !q || [t.ticketNumber, t.subject, t.customerName, t.customerEmail].some(s => s.toLowerCase().includes(q));
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const replace = (t: SupportTicket | null) => {
    if (t) setTickets(prev => prev.map(x => (x.id === t.id ? t : x)));
  };

  const post = async (body: Record<string, unknown>) => {
    if (!selected) return null;
    const res = await api<{ ticket: SupportTicket }>(`/api/admin/support/${selected.id}`, { body });
    replace(res.ticket);
    return res.ticket;
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      await post({ action: 'reply', message: reply, isInternalNote: internal });
      setReply('');
      toast.success(internal ? 'Internal note added' : 'Reply sent. The customer was emailed.');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSending(false);
    }
  };

  const change = async (action: 'status' | 'priority', value: string) => {
    try {
      await post({ action, [action]: value });
      toast.success(action === 'status' ? 'Status updated' : 'Priority updated');
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <div>
      <PageHeader kicker="Operations" title="Support tickets" description="Tickets customers open from their account. Replies are emailed to the customer and sent on Telegram if they linked the bot." />
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className={cx('space-y-3', selected && 'hidden lg:block')}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search tickets" />
          <SegmentChips
            options={(['active', 'resolved', 'closed', 'all'] as Filter[]).map(k => ({ key: k, label: k === 'active' ? 'Needs reply' : k === 'all' ? 'All' : STATUS_LABELS[k as SupportTicket['status']], count: count(k) }))}
            value={filter}
            onChange={setFilter}
          />
          <Card bodyClassName="p-0">
            {list.length === 0 ? (
              <EmptyState icon={LifeBuoy} title="No tickets here" />
            ) : (
              <div className="divide-y divide-surface-muted max-h-[70vh] overflow-y-auto">
                {list.map(t => (
                  <button key={t.id} type="button" onClick={() => setSelectedId(t.id)} className={cx('w-full text-left px-4 py-3', t.id === selectedId ? 'bg-pista-lighter' : 'hover:bg-surface-bg')}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-bold text-charcoal-subtle">{t.ticketNumber}</span>
                      <Badge tone={STATUS_TONES[t.status]}>{STATUS_LABELS[t.status]}</Badge>
                    </div>
                    <div className="font-bold text-sm text-charcoal truncate mt-1">{t.subject}</div>
                    <div className="text-xs text-charcoal-subtle truncate">
                      {t.customerName} · {timeAgo(t.updatedAt)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className={cx(!selected && 'hidden lg:block')}>
          {!selected ? (
            <Card>
              <EmptyState icon={LifeBuoy} title="Choose a ticket" description="Select a ticket on the left to read and reply." />
            </Card>
          ) : (
            <Card bodyClassName="p-0">
              <div className="px-5 py-4 border-b border-surface-muted space-y-3">
                <button type="button" onClick={() => setSelectedId(null)} className="lg:hidden inline-flex items-center gap-1 text-xs font-bold text-pista-dark">
                  <ArrowLeft className="w-3.5 h-3.5" /> Tickets
                </button>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-xs text-charcoal-subtle">{selected.ticketNumber} · {selected.category}</div>
                    <h2 className="text-lg font-extrabold text-charcoal">{selected.subject}</h2>
                    <div className="text-xs text-charcoal-subtle">
                      {selected.customerName} · {selected.customerEmail}
                      {selected.customerId && (
                        <>
                          {' · '}
                          <Link href={`/admin/customers/${selected.customerId}`} className="text-pista-dark font-bold hover:underline">
                            Profile
                          </Link>
                        </>
                      )}
                      {selected.orderId && (
                        <>
                          {' · '}
                          <Link href={`/admin/orders/${selected.orderId}`} className="text-pista-dark font-bold hover:underline">
                            Order
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 w-full sm:w-80">
                    <Select size="sm" value={selected.status} onChange={v => void change('status', v)} options={Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))} />
                    <Select
                      size="sm"
                      value={selected.priority}
                      onChange={v => void change('priority', v)}
                      options={[
                        { value: 'low', label: 'Low priority' },
                        { value: 'medium', label: 'Medium priority' },
                        { value: 'high', label: 'High priority' },
                        { value: 'urgent', label: 'Urgent' },
                      ]}
                    />
                  </div>
                </div>
              </div>
              <div className="px-5 py-4 space-y-3 max-h-[55vh] overflow-y-auto bg-surface-bg/50">
                {selected.messages.map(m => (
                  <div key={m.id} className={cx('flex flex-col', m.senderRole === 'ADMIN' ? 'items-end' : 'items-start')}>
                    <div
                      className={cx(
                        'max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed',
                        m.isInternalNote ? 'bg-accent-amber/10 border border-accent-amber/30' : m.senderRole === 'ADMIN' ? 'bg-pista-light' : 'bg-white border border-charcoal-border',
                      )}
                    >
                      {m.isInternalNote && (
                        <div className="text-[10px] font-bold text-[#9a6514] uppercase mb-1 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Internal note
                        </div>
                      )}
                      {m.message}
                    </div>
                    <div className="text-[10px] text-charcoal-subtle mt-1">
                      {m.senderName} · {fmtDateTime(m.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={send} className="px-5 py-4 border-t border-surface-muted space-y-3">
                <Textarea rows={4} value={reply} onChange={e => setReply(e.target.value)} placeholder={internal ? 'Private note for other admins' : 'Write your reply to the customer'} />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Checkbox checked={internal} onChange={setInternal} label="Internal note (customer does not see it)" />
                  <Button type="submit" icon={Send} loading={sending} disabled={!reply.trim()}>
                    {internal ? 'Add note' : 'Send reply'}
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
