import React from 'react';
import Link from 'next/link';
import { ChevronRight, Package } from 'lucide-react';
import { db } from '@/lib/db';
import type { Order } from '@/lib/db/types';
import { formatMoney } from '@/lib/money';
import { StatusBadge } from '@/components/order/order-view';
import { safe } from '@/app/_store/storefront';
import { requireAccountUser } from '../require-user';

export const dynamic = 'force-dynamic';

export default async function AccountOrdersPage() {
  const user = await requireAccountUser('/account/orders');
  const orders = await safe(() => db.getOrders({ customerId: user.id, limit: 200 }), [] as Order[]);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">Orders</div>
        <h1 className="text-2xl font-extrabold text-charcoal">My orders</h1>
        <p className="text-sm text-charcoal-subtle mt-0.5">Open an order to pay, upload proof, or see your delivered access.</p>
      </div>

      {orders.length === 0 ? (
        <div className="p-10 text-center bg-white border border-charcoal-border rounded-2xl space-y-3">
          <Package className="w-10 h-10 text-pista-dark mx-auto" aria-hidden="true" />
          <p className="text-sm text-charcoal-subtle">You have not placed any orders yet.</p>
          <Link href="/shop" className="inline-flex items-center min-h-11 px-5 rounded-xl bg-pista text-charcoal text-sm font-bold">
            Browse products
          </Link>
        </div>
      ) : (
        <ul className="bg-white border border-charcoal-border rounded-2xl divide-y divide-surface-muted overflow-hidden">
          {orders.map(o => (
            <li key={o.id}>
              <Link href={`/account/orders/${o.orderNumber}`} className="p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-pista-50">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm text-charcoal">{o.orderNumber}</span>
                    <StatusBadge status={o.orderStatus} />
                  </div>
                  <div className="text-sm text-charcoal truncate">{o.items.map(i => `${i.productName} (${i.variantName}) × ${i.quantity}`).join(', ')}</div>
                  <div className="text-xs text-charcoal-subtle">
                    {new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · {o.paymentMethodName || o.paymentMethod}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm sm:text-base font-extrabold text-charcoal whitespace-nowrap">{formatMoney(o.total, o.currency)}</span>
                  <ChevronRight className="w-4 h-4 text-charcoal-subtle" aria-hidden="true" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
