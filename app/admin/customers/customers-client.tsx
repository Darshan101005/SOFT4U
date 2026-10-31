'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ban, BadgeCheck, ChevronRight, MessageCircle, Users } from 'lucide-react';
import { formatMoney } from '@/lib/money';
import { Badge, Card, EmptyState, LoadingBlock, PageHeader, Pager, SearchInput, SegmentChips, Table, api, errMsg, toast } from '../_components/ui';
import { fmtDate, timeAgo } from '../_components/format';

interface Row {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  telegram: string | null;
  telegramLinked: boolean;
  status: 'active' | 'suspended';
  emailVerified: boolean;
  lastSeenAt: string | null;
  createdAt: string | null;
  orderCount: number;
  spendPkr: number;
}

type Segment = 'all' | 'leads' | 'customers' | 'active' | 'dormant' | 'blocked' | 'new' | 'unverified';

const SEGMENTS: Array<{ key: Segment; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'leads', label: 'Leads (no order)' },
  { key: 'customers', label: 'Customers' },
  { key: 'active', label: 'Active 30d' },
  { key: 'dormant', label: 'Dormant' },
  { key: 'new', label: 'New 7d' },
  { key: 'unverified', label: 'Unverified' },
  { key: 'blocked', label: 'Blocked' },
];

export function CustomersClient() {
  const router = useRouter();
  const [segment, setSegment] = useState<Segment>('all');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ customers: Row[]; total: number; counts: Record<string, number>; limit: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let alive = true;
    const params = new URLSearchParams({ segment, page: String(page), limit: '25' });
    if (debounced) params.set('search', debounced);
    api<{ customers: Row[]; total: number; counts: Record<string, number>; limit: number }>(`/api/admin/customers?${params}`)
      .then(d => {
        if (alive) setData(d);
      })
      .catch(err => toast.error(errMsg(err)))
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [segment, page, debounced]);

  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div>
      <PageHeader kicker="Operations" title="Customers" description="Registered accounts with their orders, spend, contact channels and latest session." />
      <div className="flex flex-col gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={v => {
            setSearch(v);
            setPage(1);
            setLoading(true);
          }}
          placeholder="Search name, email, phone, WhatsApp or Telegram"
          className="max-w-md"
        />
        <SegmentChips
          options={SEGMENTS.map(s => ({ ...s, count: data?.counts?.[s.key] }))}
          value={segment}
          onChange={k => {
            setSegment(k);
            setPage(1);
            setLoading(true);
          }}
        />
      </div>
      <Card bodyClassName="p-0">
        {loading && !data ? (
          <LoadingBlock />
        ) : !data || data.customers.length === 0 ? (
          <EmptyState icon={Users} title="No customers in this view" description="Customers appear here after they sign up." />
        ) : (
          <>
            <div className={loading ? 'opacity-60' : ''}>
              <Table head={['Customer', 'Contact', 'Last seen', 'Orders', 'Spend', 'Status', '']}>
                {data.customers.map(c => (
                  <tr key={c.id} onClick={() => router.push(`/admin/customers/${c.id}`)} className="hover:bg-surface-bg/60 cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-full bg-pista text-charcoal font-extrabold flex items-center justify-center shrink-0">{(c.name || c.email).charAt(0).toUpperCase()}</span>
                        <div className="min-w-0">
                          <div className="font-bold text-charcoal truncate">{c.name}</div>
                          <div className="text-xs text-charcoal-subtle truncate">{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-charcoal-muted">
                      {c.whatsapp && <div>WA {c.whatsapp}</div>}
                      {c.phone && c.phone !== c.whatsapp && <div>{c.phone}</div>}
                      {c.telegram && <div>@{c.telegram}</div>}
                      {c.telegramLinked && (
                        <Badge tone="blue" className="mt-0.5">
                          <MessageCircle className="w-3 h-3" />
                          Bot linked
                        </Badge>
                      )}
                      {!c.whatsapp && !c.phone && !c.telegram && !c.telegramLinked && '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-charcoal-subtle whitespace-nowrap">
                      {timeAgo(c.lastSeenAt)}
                      <div>Joined {fmtDate(c.createdAt)}</div>
                    </td>
                    <td className="px-4 py-3 font-bold">{c.orderCount}</td>
                    <td className="px-4 py-3 font-bold whitespace-nowrap">{formatMoney(c.spendPkr, 'PKR')}</td>
                    <td className="px-4 py-3">
                      {c.status === 'suspended' ? (
                        <Badge tone="rose">
                          <Ban className="w-3 h-3" />
                          Blocked
                        </Badge>
                      ) : c.emailVerified ? (
                        <Badge tone="green">
                          <BadgeCheck className="w-3 h-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge tone="gray">Unverified</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ChevronRight className="w-4 h-4 text-charcoal-subtle inline" />
                    </td>
                  </tr>
                ))}
              </Table>
            </div>
            <Pager
              page={page}
              pages={pages}
              total={data.total}
              noun="customers"
              onPage={p => {
                setPage(p);
                setLoading(true);
              }}
            />
          </>
        )}
      </Card>
    </div>
  );
}
