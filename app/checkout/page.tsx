'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useCart } from '@/lib/context/cart-context';
import { useHydrated } from '@/hooks/use-hydrated';
import { siteConfig } from '@/lib/site-config';
import { formatPrice } from '@/app/_store/price';
import { LAST_ORDER_KEY, type LastOrderSummary } from '@/app/_store/last-order';
import { ShieldCheck, CreditCard, Landmark, Lock, ArrowRight, AlertCircle, ShoppingBag } from 'lucide-react';

const paymentOptions = [
  {
    id: 'card',
    label: 'Debit / Credit Card (Premier)',
    desc: 'Visa, Mastercard and UnionPay cards issued in Pakistan.',
    icon: CreditCard,
  },
  {
    id: 'bank',
    label: 'Bank Account / Internet Banking (Premier)',
    desc: 'Pay directly from your Pakistani bank account.',
    icon: Landmark,
  },
];

const inputClass =
  'w-full text-sm px-3 py-2.5 border border-charcoal-border rounded-lg bg-surface-bg focus:bg-surface-card focus:outline-none focus:border-pista text-charcoal';

// Mock data until integration: order numbers are generated in the browser when the order API is unavailable.
function mockOrderNumber() {
  return `PK-${Math.floor(10000 + Math.random() * 90000)}`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, subtotal, discount, appliedCoupon, clearCart } = useCart();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(paymentOptions[0].label);
  const [agreed, setAgreed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  // The cart is restored from localStorage, so wait for the client before rendering it.
  const mounted = useHydrated();

  const handleCompleteOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !email.trim() || !whatsapp.trim()) {
      setErrorMsg('Please enter your full name, email address and WhatsApp number.');
      return;
    }
    if (!agreed) {
      setErrorMsg('Please accept the Terms & Conditions and Refund Policy to continue.');
      return;
    }

    setIsProcessing(true);

    // Mock data until integration: the existing /api/checkout route stays in the codebase and is
    // wired in here once the Premier gateway is live. Until then the order is confirmed on WhatsApp.
    const orderNumber = mockOrderNumber();

    const summary: LastOrderSummary = {
      orderNumber,
      name,
      email,
      phone: phone || undefined,
      whatsapp,
      paymentMethod,
      items: items.map(i => ({
        name: i.product.name,
        variant: i.variant.name,
        quantity: i.quantity,
        price: i.variant.price,
      })),
      subtotal,
      discount,
      total,
      createdAt: new Date().toISOString(),
    };

    try {
      sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(summary));
    } catch {
      // Ignore storage errors (private mode); the success page still shows the order number.
    }

    clearCart();
    router.push(`/order-success?orderId=${encodeURIComponent(orderNumber)}`);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-bg">
        <Header />
        <main className="flex-1 py-20 text-center text-sm text-charcoal-subtle">Loading checkout...</main>
        <Footer />
      </div>
    );
  }

  if (items.length === 0 && !isProcessing) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-bg">
        <Header />
        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-16">
          <div className="p-12 text-center bg-surface-card border border-charcoal-border rounded-2xl space-y-4">
            <div className="w-16 h-16 rounded-full bg-pista-lighter text-pista-dark flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8" aria-hidden="true" />
            </div>
            <h1 className="text-lg font-bold text-charcoal">Your cart is empty</h1>
            <p className="text-sm text-charcoal-subtle">Add a subscription to your cart to continue to checkout.</p>
            <Link href="/shop" className="inline-flex items-center gap-2 px-6 py-3 bg-pista-dark text-white hover:bg-pista-darker text-sm font-bold rounded-lg">
              Browse Products <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <nav aria-label="Breadcrumb" className="text-xs text-charcoal-subtle mb-2">
            <Link href="/" className="hover:text-pista-dark">Home</Link>
            <span className="mx-1.5">/</span>
            <Link href="/cart" className="hover:text-pista-dark">Cart</Link>
            <span className="mx-1.5">/</span>
            <span className="text-charcoal-muted">Checkout</span>
          </nav>
          <h1 className="text-3xl font-extrabold text-charcoal">Checkout</h1>
        </div>

        {errorMsg && (
          <div role="alert" className="mb-6 p-4 bg-surface-card border-l-4 border-accent-rose text-sm text-charcoal rounded-r-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-accent-rose flex-shrink-0" aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleCompleteOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <section className="bg-surface-card border border-charcoal-border rounded-2xl p-6 space-y-4" aria-labelledby="details-heading">
              <h2 id="details-heading" className="flex items-center gap-2 text-base font-bold text-charcoal pb-3 border-b border-surface-muted">
                <span className="w-6 h-6 rounded-full bg-pista-dark text-white flex items-center justify-center text-xs">1</span>
                Your details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="co-name" className="text-sm font-semibold text-charcoal block mb-1">Full name *</label>
                  <input id="co-name" type="text" required autoComplete="name" value={name} onChange={e => setName(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="co-email" className="text-sm font-semibold text-charcoal block mb-1">Email address *</label>
                  <input id="co-email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="co-whatsapp" className="text-sm font-semibold text-charcoal block mb-1">WhatsApp number *</label>
                  <input id="co-whatsapp" type="tel" required autoComplete="tel" placeholder="03XX XXXXXXX" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="co-phone" className="text-sm font-semibold text-charcoal block mb-1">Phone (optional)</label>
                  <input id="co-phone" type="tel" placeholder="03XX XXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} />
                </div>
              </div>
              <p className="text-xs text-charcoal-subtle">Your access details will be delivered to this email and WhatsApp number.</p>
            </section>

            <section className="bg-surface-card border border-charcoal-border rounded-2xl p-6 space-y-4" aria-labelledby="payment-heading">
              <h2 id="payment-heading" className="flex items-center gap-2 text-base font-bold text-charcoal pb-3 border-b border-surface-muted">
                <span className="w-6 h-6 rounded-full bg-pista-dark text-white flex items-center justify-center text-xs">2</span>
                Payment method
              </h2>

              <fieldset className="space-y-3">
                <legend className="sr-only">Choose a payment method</legend>
                {paymentOptions.map(opt => {
                  const isSelected = paymentMethod === opt.label;
                  return (
                    <label
                      key={opt.id}
                      className={`flex items-start justify-between gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                        isSelected ? 'border-pista bg-pista-lighter' : 'border-charcoal-border hover:border-pista'
                      }`}
                    >
                      <span className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={opt.label}
                          checked={isSelected}
                          onChange={() => setPaymentMethod(opt.label)}
                          className="mt-1 accent-pista-dark"
                        />
                        <span>
                          <span className="text-sm font-bold text-charcoal flex flex-wrap items-center gap-2">
                            {opt.label}
                            <span className="px-2 py-0.5 rounded-full bg-accent-amber/15 text-[11px] font-semibold text-charcoal-muted">
                              Coming soon
                            </span>
                          </span>
                          <span className="block text-xs text-charcoal-subtle mt-0.5">{opt.desc}</span>
                        </span>
                      </span>
                      <opt.icon className="w-5 h-5 text-pista-dark flex-shrink-0" aria-hidden="true" />
                    </label>
                  );
                })}
              </fieldset>

              <div className="p-3 bg-surface-muted rounded-lg text-xs text-charcoal-muted leading-relaxed">
                Online card and bank payments through Premier are coming soon. For now, place your order and our team
                will contact you on WhatsApp ({siteConfig.whatsapp}) to complete payment and deliver your product.
              </div>
              <div className="flex items-center gap-2 text-xs text-charcoal-subtle">
                <Lock className="w-4 h-4 text-pista-dark" aria-hidden="true" />
                <span>Secure checkout. Card details are entered only on the payment partner&apos;s protected page.</span>
              </div>
            </section>
          </div>

          <div className="lg:col-span-5">
            <section className="bg-surface-card border border-charcoal-border rounded-2xl p-6 space-y-5 lg:sticky lg:top-24" aria-labelledby="summary-heading">
              <h2 id="summary-heading" className="text-base font-bold text-charcoal pb-3 border-b border-surface-muted">
                Order summary ({items.length})
              </h2>

              <ul className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {items.map(i => (
                  <li key={i.id} className="flex items-start justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <div className="font-semibold text-charcoal line-clamp-2">{i.product.name}</div>
                      <div className="text-xs text-charcoal-subtle">{i.variant.name} × {i.quantity}</div>
                    </div>
                    <div className="font-bold text-charcoal whitespace-nowrap">{formatPrice(i.variant.price * i.quantity)}</div>
                  </li>
                ))}
              </ul>

              <dl className="pt-4 border-t border-surface-muted space-y-2 text-sm">
                <div className="flex justify-between text-charcoal-muted">
                  <dt>Subtotal</dt>
                  <dd className="font-bold text-charcoal">{formatPrice(subtotal)}</dd>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-pista-darker">
                    <dt>Discount ({appliedCoupon?.code})</dt>
                    <dd className="font-bold">- {formatPrice(discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between text-charcoal-muted">
                  <dt>Digital delivery</dt>
                  <dd className="font-bold text-pista-darker">Free</dd>
                </div>
                <div className="pt-3 border-t border-surface-muted flex items-baseline justify-between">
                  <dt className="text-base font-bold text-charcoal">Total ({siteConfig.currency})</dt>
                  <dd className="text-2xl font-extrabold text-charcoal">{formatPrice(total)}</dd>
                </div>
              </dl>

              <div className="p-3 bg-pista-lighter rounded-xl border border-pista-light text-xs text-charcoal-muted flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-pista-dark flex-shrink-0" aria-hidden="true" />
                <span>Instant digital delivery, replacement warranty for the full plan and real human support.</span>
              </div>

              <label className="flex items-start gap-2 text-xs text-charcoal-muted cursor-pointer">
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-0.5 accent-pista-dark" />
                <span>
                  I agree to the{' '}
                  <Link href="/terms" className="underline hover:text-pista-darker">Terms & Conditions</Link>,{' '}
                  <Link href="/refund-policy" className="underline hover:text-pista-darker">Refund Policy</Link> and{' '}
                  <Link href="/delivery-policy" className="underline hover:text-pista-darker">Delivery Policy</Link>.
                </span>
              </label>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-4 px-4 bg-pista-dark text-white hover:bg-pista-darker text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isProcessing ? (
                  <span>Placing your order...</span>
                ) : (
                  <>
                    <span>Place Order · {formatPrice(total)}</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </section>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}
