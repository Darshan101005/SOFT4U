import React from 'react';
import Link from 'next/link';
import { ArrowRight, Boxes, CircleAlert, Clock, Package, Send, ShieldCheck, Smartphone } from 'lucide-react';
import { db } from '@/lib/db';
import type { Order } from '@/lib/db/types';
import { formatMoney } from '@/lib/money';
import { StatusBadge } from '@/components/order/order-view';
import { safe } from '@/app/_store/storefront';
import { requireAccountUser } from './require-user';

export const dynamic = 'force-dynamic';

export default async function AccountOverviewPage() {
  const user = await requireAccountUser('/account');
  const orders = await safe(() => db.getOrders({ customerId: user.id, limit: 100 }), [] as Order[]);
  const awaiting = orders.filter(o => o.orderStatus === 'pending' || o.orderStatus === 'rejected');
  const inReview = orders.filter(o => o.orderStatus === 'under_review' || o.orderStatus === 'processing');
  const delivered = orders.filter(o => o.orderStatus === 'completed');

  const todo: Array<{ icon: typeof Smartphone; text: string; href: string; cta: string }> = [];
  if (!user.whatsapp) todo.push({ icon: Smartphone, text: 'Add your WhatsApp number so we can reach you about orders.', href: '/account/profile', cta: 'Add number' });
  if (!user.telegramLinked) todo.push({ icon: Send, text: 'Connect the Telegram bot to get deliveries and order updates in Telegram.', href: '/account/telegram', cta: 'Connect' });
  if (!user.twoFactorEnabled) todo.push({ icon: ShieldCheck, text: 'Turn on two-factor authentication to protect your account.', href: '/account/security', cta: 'Turn on' });

  const stats = [
    { label: 'Awaiting payment', value: awaiting.length, icon: CircleAlert },
    { label: 'In review', value: inReview.length, icon: Clock },
    { label: 'Delivered', value: delivered.length, icon: Boxes },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">My account</div>
        <h1 className="text-2xl font-extrabold text-charcoal">Welcome, {user.name.split(' ')[0]}</h1>
        <p className="text-sm text-charcoal-subtle mt-0.5">Track your orders, open delivered access and manage your account.</p>
      </div>

      <ul className="grid grid-cols-3 gap-3">
        {stats.map(s => (
          <li key={s.label} className="p-3 sm:p-4 bg-white border border-charcoal-border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-[10px] sm:text-[11px] text-charcoal-subtle uppercase font-bold tracking-wider">{s.label}</div>
              <div className="text-2xl font-bold text-charcoal mt-1">{s.value}</div>
            </div>
            <span className="hidden sm:flex p-2.5 rounded-lg bg-pista-lighter text-pista-dark">
              <s.icon className="w-5 h-5" aria-hidden="true" />
            </span>
          </li>
        ))}
      </ul>

      {awaiting.length > 0 && (
        <div className="p-4 rounded-2xl bg-accent-amber/10 border border-accent-amber/30 text-sm text-charcoal flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span>
            {awaiting.length === 1 ? 'One order is' : `${awaiting.length} orders are`} waiting for your payment proof.
          </span>
          <Link href={`/account/orders/${awaiting[0].orderNumber}`} className="inline-flex items-center justify-center min-h-11 px-4 rounded-xl bg-pista-dark text-white font-bold whitespace-nowrap">
            Upload proof
          </Link>
        </div>
      )}

      {todo.length > 0 && (
        <ul className="space-y-2">
          {todo.map(t => (
            <li key={t.href} className="p-3 sm:p-4 bg-white border border-charcoal-border rounded-xl flex items-center justify-between gap-3">
              <span className="flex items-start gap-3 text-sm text-charcoal-muted min-w-0">
                <t.icon className="w-5 h-5 text-pista-dark shrink-0" aria-hidden="true" />
                {t.text}
              </span>
              <Link href={t.href} className="inline-flex items-center min-h-11 px-3 rounded-xl bg-pista-lighter text-pista-darker text-sm font-bold whitespace-nowrap">
                {t.cta}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <section className="bg-white border border-charcoal-border rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-surface-muted">
          <h2 className="text-sm font-bold text-charcoal uppercase tracking-wider">Recent orders</h2>
          <Link href="/account/orders" className="inline-flex items-center gap-1 min-h-11 text-sm font-semibold text-pista-dark hover:underline">
            View all <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
        {orders.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <Package className="w-10 h-10 text-pista-dark mx-auto" aria-hidden="true" />
            <p className="text-sm text-charcoal-subtle">You have no orders yet.</p>
            <Link href="/shop" className="inline-flex items-center min-h-11 px-5 rounded-xl bg-pista text-charcoal text-sm font-bold">
              Browse products
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {orders.slice(0, 4).map(o => (
              <li key={o.id}>
                <Link href={`/account/orders/${o.orderNumber}`} className="p-4 bg-surface-bg border border-charcoal-border hover:border-pista rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-sm text-charcoal">{o.orderNumber}</span>
                      <StatusBadge status={o.orderStatus} />
                    </div>
                    <div className="text-sm text-charcoal mt-1 truncate">{o.items.map(i => `${i.productName} (${i.variantName})`).join(', ')}</div>
                    <div className="text-xs text-charcoal-subtle mt-0.5">{new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  </div>
                  <div className="text-base font-extrabold text-charcoal whitespace-nowrap">{formatMoney(o.total, o.currency)}</div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
