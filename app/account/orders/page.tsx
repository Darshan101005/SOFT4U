import React from 'react';
import Link from 'next/link';
import { AccountLayout } from '@/components/account-layout';
import { db } from '@/lib/db';
import { Package, Zap, ArrowRight, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AccountOrdersPage() {
  const orders = await db.getOrders();

  return (
    <AccountLayout>
      <div className="space-y-6">
        <div>
          <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">
            PURCHASE HISTORY
          </div>
          <h1 className="text-2xl font-extrabold text-charcoal">Your Orders & Invoices</h1>
          <p className="text-xs text-charcoal-subtle mt-0.5">
            Click into any order to reveal login credentials, private PINs, license keys, and warranty information.
          </p>
        </div>

        <div className="bg-white border border-charcoal-border rounded-2xl p-6 shadow-xs space-y-4">
          {orders.map(order => (
            <div
              key={order.id}
              className="p-5 bg-surface-bg border border-charcoal-border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-charcoal">{order.orderNumber}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-pista-lighter text-pista-dark font-bold font-mono uppercase">
                    {order.paymentStatus}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-pista-light text-pista-darker font-bold font-mono uppercase">
                    {order.fulfillmentStatus}
                  </span>
                </div>

                <div className="text-xs font-bold text-charcoal">
                  {order.items.map(i => `${i.productName} (${i.variantName})`).join(' · ')}
                </div>

                <div className="text-[11px] text-charcoal-subtle">
                  Purchased {new Date(order.createdAt).toLocaleDateString()} · Paid via {order.paymentMethod} · Total: ${order.total.toFixed(2)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/account/orders/${order.orderNumber}`}
                  className="px-3.5 py-2 bg-pista-dark text-white hover:bg-pista-darker text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-pista-dark" />
                  <span>Reveal Vault Details</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AccountLayout>
  );
}
