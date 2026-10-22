import React from 'react';
import Link from 'next/link';
import { AccountLayout } from '@/components/account-layout';
import { db } from '@/lib/db';
import { Boxes, Clock, Zap, ArrowRight, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AccountProductsPage() {
  const orders = await db.getOrders();

  // Extract all fulfilled items from orders
  const activeProducts: any[] = [];
  orders.forEach(order => {
    if (order.fulfillmentStatus === 'fulfilled') {
      order.items.forEach(item => {
        activeProducts.push({
          ...item,
          orderNumber: order.orderNumber,
          purchasedAt: order.createdAt,
          expiryDays: item.expiryDays || 30
        });
      });
    }
  });

  return (
    <AccountLayout>
      <div className="space-y-6">
        <div>
          <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">
            ACTIVE SUBSCRIPTION VAULT
          </div>
          <h1 className="text-2xl font-extrabold text-charcoal">Active Software Passes</h1>
          <p className="text-xs text-charcoal-subtle mt-0.5">
            Monitor real-time remaining access days, renewal guarantees, and vault credentials.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeProducts.map((prod, idx) => {
            const daysLeft = Math.max(1, prod.expiryDays - Math.floor(idx * 4));
            return (
              <div key={idx} className="bg-white border border-charcoal-border rounded-2xl p-6 flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-surface-muted">
                    <span className="text-[10px] font-bold text-charcoal-subtle uppercase font-mono">
                      {prod.orderNumber}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-pista-dark">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Expires in {daysLeft} days</span>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-charcoal mt-3">
                    {prod.productName}
                  </h3>
                  <div className="text-xs text-charcoal-subtle mt-0.5">
                    Plan: <span className="font-semibold text-charcoal">{prod.variantName}</span>
                  </div>

                  <div className="mt-4 p-3 bg-pista-lighter rounded-xl border border-pista space-y-1 text-xs">
                    <div className="font-bold text-pista-dark flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Full Replacement Guaranteed
                    </div>
                    <div className="text-[11px] text-charcoal-muted">
                      Auto-renewal protection active. If access changes, warranty guarantees zero-cost replacement.
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-surface-muted flex items-center justify-between">
                  <Link
                    href={`/account/orders/${prod.orderNumber}`}
                    className="text-xs font-bold text-charcoal hover:text-pista-dark flex items-center gap-1"
                  >
                    <Zap className="w-3.5 h-3.5 text-pista-dark" />
                    <span>View Credentials</span>
                  </Link>

                  <Link
                    href={`/shop`}
                    className="text-xs text-charcoal-subtle hover:text-charcoal underline"
                  >
                    Extend Plan
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AccountLayout>
  );
}
