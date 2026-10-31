'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Ban,
  BadgeCheck,
  Calendar,
  ChevronRight,
  Clock,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Monitor,
  Pencil,
  Phone,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  ShoppingBag,
  Trash2,
  Unlink,
  Wifi,
} from 'lucide-react';
import type { ActivityEntry, Order, User } from '@/lib/db/types';
import { formatMoney } from '@/lib/money';
import { Badge, Button, Card, CopyButton, EmptyState, Field, Input, LoadingBlock, Modal, OrderStatusBadge, Stat, api, errMsg, toast, useDialog } from '../../_components/ui';
import { fmtDate, fmtDateTime, parseUserAgent, timeAgo } from '../../_components/format';

interface Overview {
  user: User;
  lastActivity: ActivityEntry | null;
  activity: ActivityEntry[];
  orders: Order[];
  telegram: { chatId: string; username?: string; linkedAt: string } | null;
  stats: { totalOrders: number; completedOrders: number; spentPkr: number };
  location: { latitude: number | null; longitude: number | null; postal: string | null; continent: string | null; callingCode: string | null; vpnService: string | null } | null;
}

function Row({ icon: Icon, label, value, copy }: { icon: React.ComponentType<{ className?: string }>; label: string; value?: React.ReactNode; copy?: string | null }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <Icon className="w-4 h-4 text-pista-dark shrink-0" />
      <span className="text-xs text-charcoal-subtle w-28 shrink-0">{label}</span>
      <span className="text-sm font-semibold text-charcoal min-w-0 break-all flex-1">{value}</span>
      {copy && <CopyButton value={copy} label={label} />}
    </div>
  );
}

const EVENT_LABELS: Record<string, string> = {
  signup: 'Sign up',
  email_verified: 'Email verified',
  login: 'Sign in',
  login_failed: 'Failed sign in',
  logout: 'Sign out',
  session: 'Visit',
  password_reset: 'Password reset',
  password_change: 'Password changed',
  '2fa_enabled': '2FA turned on',
  '2fa_disabled': '2FA turned off',
  order_placed: 'Order placed',
  payment_proof: 'Payment proof uploaded',
  telegram_linked: 'Telegram linked',
};

export function CustomerDetailClient({ userId }: { userId: string }) {
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ name: string; phone: string; whatsapp: string; telegram: string } | null>(null);
  const { confirm, prompt, dialog } = useDialog();

  const [version, setVersion] = useState(0);
  const load = useCallback(async () => setVersion(v => v + 1), []);

  useEffect(() => {
    let alive = true;
    api<Overview>(`/api/admin/customers/${encodeURIComponent(userId)}`)
      .then(d => {
        if (alive) setData(d);
      })
      .catch(err => {
        if (!alive) return;
        if ((err as { status?: number }).status === 404) setMissing(true);
        else toast.error(errMsg(err));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [userId, version]);

  const action = async (name: string, body: Record<string, unknown>, ok: string) => {
    setBusy(name);
    try {
      await api(`/api/admin/customers/${encodeURIComponent(userId)}`, { body });
      toast.success(ok);
      await load();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <LoadingBlock />;
  if (missing || !data) {
    return (
      <Card>
        <EmptyState icon={ShoppingBag} title="Customer not found" action={<Link href="/admin/customers" className="text-sm font-bold text-pista-dark hover:underline">All customers</Link>} />
      </Card>
    );
  }

  const { user: u, lastActivity: a, orders, stats, telegram, location } = data;
  const ua = parseUserAgent(a?.userAgent);
  const hasCoords = typeof location?.latitude === 'number' && typeof location?.longitude === 'number' && !(location.latitude === 0 && location.longitude === 0);
  const lat = Number(location?.latitude ?? 0);
  const lon = Number(location?.longitude ?? 0);
  const d = 0.05;
  const mapSrc = hasCoords ? `https://www.openstreetmap.org/export/embed.html?bbox=${lon - d}%2C${lat - d}%2C${lon + d}%2C${lat + d}&layer=mapnik&marker=${lat}%2C${lon}` : '';
  const place = a ? [a.city, a.region, a.country].filter(Boolean).join(', ') : '';
  const risky = Boolean(a && (a.isVpn || a.isProxy || a.isTor));

  const block = async () => {
    const reason = await prompt({
      title: `Block ${u.name}?`,
      message: 'They are signed out at once and cannot sign in until you unblock them. Their orders stay.',
      inputLabel: 'Reason (internal)',
      placeholder: 'e.g. Chargeback / fake payment proofs',
      confirmLabel: 'Block customer',
      danger: true,
    });
    if (reason !== null) await action('block', { action: 'block', reason }, 'Customer blocked');
  };

  const remove = async () => {
    const ok = await confirm({
      title: `Delete ${u.name}?`,
      message: 'This permanently removes the login, profile, sessions and Telegram link. Orders stay in the admin panel, and their delivered details are no longer shown on the website. This cannot be undone.',
      confirmLabel: 'Delete customer',
      danger: true,
    });
    if (!ok) return;
    setBusy('delete');
    try {
      await api(`/api/admin/customers/${encodeURIComponent(userId)}`, { method: 'DELETE' });
      toast.success('Customer deleted');
      router.push('/admin/customers');
    } catch (err) {
      toast.error(errMsg(err));
      setBusy(null);
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    setBusy('edit');
    try {
      await api(`/api/admin/customers/${encodeURIComponent(userId)}`, { method: 'PATCH', body: editing });
      setEditing(null);
      toast.success('Customer updated');
      await load();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <Link href="/admin/customers" className="inline-flex items-center gap-1.5 text-xs font-bold text-pista-dark hover:underline mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> All customers
      </Link>

      <div className="bg-white border border-charcoal-border rounded-2xl p-5 mb-6 flex flex-col md:flex-row md:items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-pista text-charcoal flex items-center justify-center text-2xl font-extrabold shrink-0">{(u.name || u.email).charAt(0).toUpperCase()}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-extrabold text-charcoal">{u.name}</h1>
            {u.emailVerified ? (
              <Badge tone="green">
                <BadgeCheck className="w-3 h-3" />
                Verified
              </Badge>
            ) : (
              <Badge tone="gray">Email not verified</Badge>
            )}
            {u.status === 'suspended' && (
              <Badge tone="rose">
                <Ban className="w-3 h-3" />
                Blocked
              </Badge>
            )}
            {u.twoFactorEnabled && (
              <Badge tone="blue">
                <ShieldCheck className="w-3 h-3" />
                2FA on
              </Badge>
            )}
          </div>
          <p className="text-sm text-charcoal-subtle mt-0.5">
            {u.email} · Member since {fmtDate(u.createdAt)} · Last seen {timeAgo(u.lastSeenAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={Pencil} onClick={() => setEditing({ name: u.name, phone: u.phone || '', whatsapp: u.whatsapp || '', telegram: u.telegram || '' })}>
            Edit
          </Button>
          {u.status === 'suspended' ? (
            <Button variant="secondary" icon={ShieldCheck} loading={busy === 'unblock'} onClick={() => action('unblock', { action: 'unblock' }, 'Customer unblocked')}>
              Unblock
            </Button>
          ) : (
            <Button variant="secondary" icon={Ban} loading={busy === 'block'} onClick={() => void block()}>
              Block
            </Button>
          )}
          <Button variant="outline-danger" icon={Trash2} loading={busy === 'delete'} onClick={() => void remove()}>
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Total orders" value={stats.totalOrders} icon={ShoppingBag} />
        <Stat label="Delivered orders" value={stats.completedOrders} icon={BadgeCheck} />
        <Stat label="Lifetime spend" value={formatMoney(stats.spentPkr, 'PKR')} hint="Delivered orders, PKR" />
        <Stat label="Telegram bot" value={telegram ? 'Linked' : 'Not linked'} hint={telegram ? <>Since {fmtDate(telegram.linkedAt)}</> : 'Customer links from their account'} icon={MessageCircle} />
      </div>

      <div className="columns-1 lg:columns-2 gap-6 [&>*]:mb-6 [&>*]:break-inside-avoid">
        <Card title="Profile & contact" bodyClassName="p-0 divide-y divide-surface-muted">
          <Row icon={Mail} label="Email" value={u.email} copy={u.email} />
          <Row icon={Phone} label="Mobile" value={u.phone} copy={u.phone} />
          <Row
            icon={MessageCircle}
            label="WhatsApp"
            value={
              u.whatsapp ? (
                <a href={`https://wa.me/${u.whatsapp.replace(/\D/g, '').replace(/^0/, '92')}`} target="_blank" rel="noopener noreferrer" className="text-pista-dark hover:underline">
                  {u.whatsapp}
                </a>
              ) : undefined
            }
            copy={u.whatsapp}
          />
          <Row icon={MessageCircle} label="Telegram" value={u.telegram ? `@${u.telegram}` : undefined} copy={u.telegram} />
          <Row icon={MessageCircle} label="Bot account" value={telegram ? <>{telegram.username ? `@${telegram.username}` : `Chat ${telegram.chatId}`} · linked {fmtDate(telegram.linkedAt)}</> : undefined} />
          <Row icon={Clock} label="Last sign-in" value={u.lastLoginAt ? fmtDateTime(u.lastLoginAt) : undefined} />
          <Row icon={Calendar} label="Joined" value={fmtDateTime(u.createdAt)} />
          {u.status === 'suspended' && <Row icon={Ban} label="Block reason" value={u.suspendedReason || 'Blocked by admin'} />}
          <div className="px-5 py-3 flex flex-wrap gap-2">
            {u.twoFactorEnabled && (
              <Button
                size="sm"
                variant="secondary"
                icon={ShieldOff}
                loading={busy === '2fa'}
                onClick={async () => {
                  if (await confirm({ title: 'Reset two-factor?', message: 'Use this only if the customer lost their phone and you verified who they are.', confirmLabel: 'Reset 2FA', danger: true }))
                    await action('2fa', { action: 'reset_2fa' }, 'Two-factor removed');
                }}
              >
                Reset 2FA
              </Button>
            )}
            {telegram && (
              <Button size="sm" variant="secondary" icon={Unlink} loading={busy === 'tg'} onClick={() => action('tg', { action: 'unlink_telegram' }, 'Telegram unlinked')}>
                Unlink Telegram
              </Button>
            )}
          </div>
        </Card>

        <Card title="Latest session & device" bodyClassName="p-0 divide-y divide-surface-muted">
          {a ? (
            <>
              {ua && <Row icon={Monitor} label="Device" value={`${ua.device} · ${ua.os} · ${ua.browser}`} />}
              <Row icon={Wifi} label="IP (v4)" value={a.ipv4} copy={a.ipv4} />
              <Row icon={Wifi} label="IP (v6)" value={a.ipv6} copy={a.ipv6} />
              <Row icon={Globe} label="ISP" value={a.isp} />
              <Row icon={Globe} label="Network" value={a.org} />
              <Row icon={Clock} label="Timezone" value={a.timezoneId} />
              <Row icon={Calendar} label="Recorded" value={<>{EVENT_LABELS[a.eventType] || a.eventType.replace(/_/g, ' ')} · {fmtDateTime(a.createdAt)} ({timeAgo(a.createdAt)})</>} />
              <div className="px-5 py-3 flex flex-wrap gap-1.5">
                <Badge tone={a.isVpn ? 'rose' : 'gray'}>VPN {a.isVpn ? 'yes' : 'no'}</Badge>
                <Badge tone={a.isProxy ? 'rose' : 'gray'}>Proxy {a.isProxy ? 'yes' : 'no'}</Badge>
                <Badge tone={a.isTor ? 'rose' : 'gray'}>Tor {a.isTor ? 'yes' : 'no'}</Badge>
                <Badge tone={a.isDatacenter ? 'amber' : 'gray'}>Datacenter {a.isDatacenter ? 'yes' : 'no'}</Badge>
                <Badge tone="gray">Mobile network {a.isMobile ? 'yes' : 'no'}</Badge>
              </div>
              {risky && (
                <div className="flex items-center gap-2 px-5 py-3 bg-accent-amber/10">
                  <ShieldAlert className="w-4 h-4 text-accent-amber shrink-0" />
                  <span className="text-xs font-semibold text-[#9a6514]">
                    {[a.isVpn && 'VPN', a.isProxy && 'Proxy', a.isTor && 'Tor'].filter(Boolean).join(' · ')} detected{location?.vpnService ? ` (${location.vpnService})` : ''}. Check payments from this customer carefully.
                  </span>
                </div>
              )}
            </>
          ) : (
            <p className="px-5 py-6 text-center text-xs text-charcoal-subtle">No session activity in the last 7 days.</p>
          )}
        </Card>

        {a && (place || hasCoords) && (
          <Card title="Location" bodyClassName="p-0">
            <div className="divide-y divide-surface-muted">
              <Row icon={MapPin} label="Place" value={[a.flagEmoji, place].filter(Boolean).join(' ')} />
              <Row icon={MapPin} label="Postal" value={location?.postal} />
              {hasCoords && <Row icon={MapPin} label="Coordinates" value={`${lat.toFixed(4)}, ${lon.toFixed(4)}`} copy={`${lat},${lon}`} />}
            </div>
            {hasCoords && (
              <div className="p-4">
                <div className="rounded-xl overflow-hidden border border-charcoal-border">
                  <iframe title="Customer location" src={mapSrc} className="w-full h-56 block" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                </div>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=12/${lat}/${lon}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-xs font-bold text-pista-dark hover:underline"
                >
                  Open larger map →
                </a>
                <p className="text-[11px] text-charcoal-subtle mt-1">Approximate, based on the IP address.</p>
              </div>
            )}
          </Card>
        )}

        <Card title={`Orders (${stats.totalOrders})`} bodyClassName="p-0">
          {orders.length === 0 ? (
            <p className="px-5 py-6 text-center text-xs text-charcoal-subtle">No orders yet. This customer is a lead.</p>
          ) : (
            <div className="divide-y divide-surface-muted">
              {orders.map(o => (
                <Link key={o.id} href={`/admin/orders/${o.orderNumber}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-bg">
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-xs font-bold">{o.orderNumber}</div>
                    <div className="text-xs text-charcoal-subtle truncate">{o.items.map(i => `${i.productName} (${i.variantName})`).join(', ')}</div>
                    <div className="text-[11px] text-charcoal-subtle">{fmtDateTime(o.createdAt)}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold whitespace-nowrap">{formatMoney(o.total, o.currency)}</div>
                    <OrderStatusBadge status={o.orderStatus} />
                  </div>
                  <ChevronRight className="w-4 h-4 text-charcoal-subtle shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </Card>

        {data.activity.length > 1 && (
          <Card title="Recent activity (7 days)" bodyClassName="p-0">
            <div className="divide-y divide-surface-muted max-h-96 overflow-y-auto">
              {data.activity.map(ev => {
                const dev = parseUserAgent(ev.userAgent);
                return (
                  <div key={ev.id} className="px-5 py-2.5 text-xs flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-bold text-charcoal">{EVENT_LABELS[ev.eventType] || ev.eventType.replace(/_/g, ' ')}</div>
                      <div className="text-charcoal-subtle truncate">
                        {[ev.ipv4 || ev.ipv6, [ev.city, ev.country].filter(Boolean).join(', '), dev ? `${dev.os} · ${dev.browser}` : null].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <div className="text-charcoal-subtle whitespace-nowrap text-right">
                      {fmtDateTime(ev.createdAt)}
                      {(ev.isVpn || ev.isProxy || ev.isTor) && <div className="text-accent-rose font-bold">VPN/Proxy</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Edit customer"
        description="The email address can only be changed by the customer."
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveEdit} loading={busy === 'edit'}>Save</Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-3">
            <Field label="Name" required>
              <Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
            </Field>
            <Field label="Mobile number">
              <Input value={editing.phone} onChange={e => setEditing({ ...editing, phone: e.target.value })} />
            </Field>
            <Field label="WhatsApp number">
              <Input value={editing.whatsapp} onChange={e => setEditing({ ...editing, whatsapp: e.target.value })} />
            </Field>
            <Field label="Telegram username">
              <Input value={editing.telegram} onChange={e => setEditing({ ...editing, telegram: e.target.value })} placeholder="without @" />
            </Field>
          </div>
        )}
      </Modal>
      {dialog}
    </div>
  );
}
