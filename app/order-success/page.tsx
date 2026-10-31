import React from 'react';
import Link from 'next/link';
import { CheckCircle2, Package, ArrowRight } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { OrderView } from '@/components/order/order-view';
import { loadOrderForViewer, toPublicOrder } from '@/lib/order-access';
import { getStoreInfo, safe } from '@/app/_store/storefront';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function one(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) || '';
}

export default async function OrderSuccessPage({ searchParams }: Props) {
  const sp = await searchParams;
  const orderNumber = one(sp.order) || one(sp.orderId);
  const proofError = one(sp.proofError).slice(0, 300);
  const [found, store] = await Promise.all([orderNumber ? safe(() => loadOrderForViewer(orderNumber), null) : Promise.resolve(null), getStoreInfo()]);
  const order = found?.isOwner ? await toPublicOrder(found.order, found.canSeeDelivery) : null;

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-10 space-y-6">
        {!order ? (
          <div className="p-8 sm:p-10 text-center bg-surface-card border border-charcoal-border rounded-2xl space-y-4">
            <h1 className="text-xl font-bold text-charcoal">No recent order found</h1>
            <p className="text-sm text-charcoal-subtle">Sign in to see your orders, or look one up with its Order ID.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/account/orders" className="inline-flex items-center min-h-11 px-5 bg-pista-dark text-white hover:bg-pista-darker text-sm font-bold rounded-xl">
                My orders
              </Link>
              <Link href="/track-order" className="inline-flex items-center min-h-11 px-5 border border-pista-light text-pista-darker hover:border-pista text-sm font-semibold rounded-xl">
                Track an order
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center space-y-3 bg-surface-card border border-charcoal-border rounded-2xl p-6 sm:p-10">
              <div className="w-16 h-16 rounded-full bg-pista-lighter text-pista-dark flex items-center justify-center mx-auto border border-pista-light">
                <CheckCircle2 className="w-9 h-9" aria-hidden="true" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal">
                {order.orderStatus === 'under_review' ? 'Thank you! Your payment is under review' : 'Thank you! Your order is placed'}
              </h1>
              <p className="text-sm text-charcoal-muted">
                We sent the details to <span className="font-semibold text-charcoal break-all">{order.customerEmail}</span>.
                {order.orderStatus === 'pending' ? ' Pay the exact total below and upload your proof to continue.' : ' We will email you as soon as it is approved.'}
              </p>
            </div>
            <OrderView
              initial={order}
              whatsappHref={store.whatsappHref}
              storeName={store.name}
              notice={proofError ? `Your order is saved, but the payment proof did not upload: ${proofError} Please upload it again below.` : undefined}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link href="/account/orders" className="min-h-12 px-4 bg-surface-card border border-charcoal-border hover:border-pista rounded-xl flex items-center justify-between text-sm font-semibold text-charcoal">
                <span className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-pista-dark" aria-hidden="true" /> All my orders
                </span>
                <ArrowRight className="w-4 h-4 text-charcoal-subtle" aria-hidden="true" />
              </Link>
              <Link href="/shop" className="min-h-12 px-4 bg-surface-card border border-charcoal-border hover:border-pista rounded-xl flex items-center justify-between text-sm font-semibold text-charcoal">
                <span>Continue shopping</span>
                <ArrowRight className="w-4 h-4 text-charcoal-subtle" aria-hidden="true" />
              </Link>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
