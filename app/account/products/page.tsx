import React from 'react';
import { LocalTime } from '@/components/local-time';
import Link from 'next/link';
import { Boxes } from 'lucide-react';
import { db } from '@/lib/db';
import type { Order } from '@/lib/db/types';
import { DeliveryPanel } from '@/components/order/delivery-panel';
import { safe } from '@/app/_store/storefront';
import { requireAccountUser } from '../require-user';

export const dynamic = 'force-dynamic';

/** Every delivered access in one place, newest first. */
export default async function MyAccessPage() {
  const user = await requireAccountUser('/account/products');
  const orders = (await safe(() => db.getOrders({ customerId: user.id, status: 'completed', limit: 100 }), [] as Order[])).filter(o =>
    o.items.some(i => i.fulfillmentData && (i.fulfillmentData.fields?.length || i.fulfillmentData.credentials?.length || i.fulfillmentData.licenseKeys?.length || i.fulfillmentData.instructions)),
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">Delivered</div>
        <h1 className="text-2xl font-extrabold text-charcoal">My access</h1>
        <p className="text-sm text-charcoal-subtle mt-0.5">Login details, keys and codes from your delivered orders.</p>
      </div>

      {orders.length === 0 ? (
        <div className="p-10 text-center bg-white border border-charcoal-border rounded-2xl space-y-3">
          <Boxes className="w-10 h-10 text-pista-dark mx-auto" aria-hidden="true" />
          <p className="text-sm text-charcoal-subtle">Delivered access will appear here after your orders are approved.</p>
          <Link href="/account/orders" className="inline-flex items-center min-h-11 px-5 rounded-xl bg-pista text-charcoal text-sm font-bold">
            View my orders
          </Link>
        </div>
      ) : (
        <ul className="space-y-6">
          {orders.map(o => (
            <li key={o.id} className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <Link href={`/account/orders/${o.orderNumber}`} className="font-mono font-bold text-charcoal hover:text-pista-darker">
                  {o.orderNumber}
                </Link>
                <span className="text-xs text-charcoal-subtle">
                  Delivered <LocalTime iso={o.deliveredAt} format="date" empty="" />
                </span>
              </div>
              <DeliveryPanel items={o.items} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
