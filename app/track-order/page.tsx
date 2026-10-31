import React from 'react';
import Link from 'next/link';
import { Package, Search } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { OrderView } from '@/components/order/order-view';
import { loadOrderForViewer, toPublicOrder, type PublicOrder } from '@/lib/order-access';
import { normalizeEmail } from '@/lib/password-policy';
import { getStoreInfo, safe } from '@/app/_store/storefront';
import { FormSubmitButton } from '@/components/ui/loading-button';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function one(v: string | string[] | undefined): string {
  return ((Array.isArray(v) ? v[0] : v) || '').trim();
}

/**
 * Order status by Order ID + email. The signed-in owner can open their order by ID alone;
 * everyone else must also enter the email used on the order.
 */
export default async function TrackOrderPage({ searchParams }: Props) {
  const sp = await searchParams;
  const orderNumber = (one(sp.order) || one(sp.orderId)).toUpperCase().slice(0, 40);
  const email = normalizeEmail(one(sp.email)).slice(0, 120);
  const store = await getStoreInfo();

  let order: PublicOrder | null = null;
  let error = '';
  let needEmail = false;
  if (orderNumber) {
    const found = await safe(() => loadOrderForViewer(orderNumber), null);
    if (found && (found.isOwner || (email && normalizeEmail(found.order.customerEmail) === email))) {
      order = await toPublicOrder(found.order, found.canSeeDelivery);
    } else if (found && !email) {
      needEmail = true;
    } else {
      error = 'We could not find an order with that Order ID and email. Check both and try again.';
    }
  }

  const inputCls = 'w-full min-h-11 text-base sm:text-sm px-3 border border-charcoal-border rounded-xl bg-surface-bg focus:bg-surface-card focus:outline-none focus:border-pista-500';

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-10 space-y-6">
        <div className="text-center space-y-3 bg-surface-card border border-charcoal-border rounded-2xl p-5 sm:p-8">
          <div className="w-12 h-12 rounded-full bg-pista-lighter text-pista-dark flex items-center justify-center mx-auto">
            <Package className="w-6 h-6" aria-hidden="true" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal">Track Your Order</h1>
          <p className="text-sm text-charcoal-muted max-w-md mx-auto">Enter the Order ID from your confirmation email and the email address you ordered with.</p>

          <form action="/track-order" method="get" className="max-w-md mx-auto pt-3 space-y-3 text-left">
            <div>
              <label htmlFor="track-order-id" className="text-sm font-semibold text-charcoal block mb-1">
                Order ID *
              </label>
              <input id="track-order-id" name="order" type="text" required defaultValue={orderNumber} placeholder="e.g. S4U-AB12CD34EF" autoComplete="off" className={`${inputCls} font-mono uppercase`} />
            </div>
            <div>
              <label htmlFor="track-email" className="text-sm font-semibold text-charcoal block mb-1">
                Email address *
              </label>
              <input id="track-email" name="email" type="email" required defaultValue={email} autoComplete="email" className={inputCls} />
            </div>
            <FormSubmitButton className="w-full min-h-12 bg-pista-dark text-white hover:bg-pista-darker text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
              <Search className="w-4 h-4" aria-hidden="true" />
              Track Order
            </FormSubmitButton>
          </form>

          {(error || needEmail) && (
            <p role="alert" className="text-sm text-charcoal bg-surface-muted p-3 rounded-xl max-w-md mx-auto">
              {needEmail ? 'Enter the email address used on this order to see its status.' : error}
            </p>
          )}
        </div>

        {order && <OrderView initial={order} whatsappHref={store.whatsappHref} storeName={store.name} signInHref={`/login?next=${encodeURIComponent(`/account/orders/${order.orderNumber}`)}`} />}

        <p className="text-center text-xs text-charcoal-subtle">
          Signed in? See every order in{' '}
          <Link href="/account/orders" className="underline hover:text-pista-darker">
            My orders
          </Link>
          . Lost your Order ID?{' '}
          <Link href="/contact" className="underline hover:text-pista-darker">
            Contact us
          </Link>{' '}
          with your email address.
        </p>
      </main>
      <Footer />
    </div>
  );
}
