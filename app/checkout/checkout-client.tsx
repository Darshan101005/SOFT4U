'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowRight, Loader2, Lock, ShieldCheck, ShoppingBag } from 'lucide-react';
import type { Currency } from '@/lib/db/types';
import { useCart } from '@/lib/context/cart-context';
import { useHydrated } from '@/hooks/use-hydrated';
import { useCartQuote } from '@/components/cart/use-cart-quote';
import { Checkbox } from '@/components/ui/checkbox';
import { PaymentDetails, PaymentLogo, type PaymentAccount } from '@/components/order/payment-details';
import { EMPTY_PROOF, ProofFields, proofPayload, proofProblem, type ProofValue } from '@/components/order/proof-fields';
import { PriceSkeleton } from '@/components/ui/loading-button';
import { formatPrice } from '@/app/_store/price';
import { convertPayAmount, formatGbp } from '@/lib/money';

function Bar({ className }: { className: string }) {
  return <div className={`rounded-lg soft4u-shimmer ${className}`} />;
}

/** Layout-matched placeholder while the cart loads from this browser. */
function CheckoutSkeleton() {
  return (
    <div role="status" aria-label="Loading checkout" aria-busy="true">
      <Bar className="h-3 w-40 mb-3" />
      <Bar className="h-8 w-56 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="lg:col-span-7 space-y-6">
          {[0, 1].map(k => (
            <div key={k} className="bg-surface-card border border-charcoal-border rounded-2xl p-4 sm:p-6 space-y-4">
              <Bar className="h-6 w-44" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[0, 1, 2, 3].map(i => (
                  <Bar key={i} className="h-11 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-5">
          <div className="bg-surface-card border border-charcoal-border rounded-2xl p-4 sm:p-6 space-y-4">
            <Bar className="h-6 w-36" />
            {[0, 1, 2].map(i => (
              <Bar key={i} className="h-5 w-full" />
            ))}
            <Bar className="h-12 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

const PHONE_RE = /^\+?[0-9 ()-]{7,20}$/;
const inputClass =
  'w-full min-h-11 text-base sm:text-sm px-3 border border-charcoal-border rounded-xl bg-surface-bg focus:bg-surface-card focus:outline-none focus:border-pista-500 focus:ring-2 focus:ring-pista-100 text-charcoal';

interface CheckoutUser {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  telegram: string;
  telegramLinked: boolean;
}

function Step({ n, title, id }: { n: number; title: string; id: string }) {
  return (
    <h2 id={id} className="flex items-center gap-2 text-base font-bold text-charcoal pb-3 border-b border-surface-muted">
      <span className="w-7 h-7 rounded-full bg-pista-dark text-white flex items-center justify-center text-xs">{n}</span>
      {title}
    </h2>
  );
}

export function CheckoutClient({
  currency,
  methods,
  user,
  requireWhatsapp,
  requirePhone,
  maintenance,
}: {
  currency: Currency;
  /** payRate: account-currency units per 1 order-currency unit (only for GBP accounts). */
  methods: Array<PaymentAccount & { payRate?: number }>;
  user: CheckoutUser;
  requireWhatsapp: boolean;
  requirePhone: boolean;
  maintenance: string;
}) {
  const router = useRouter();
  const mounted = useHydrated();
  const { items, appliedCoupon, clearCart } = useCart();
  const { quote, loading: quoteLoading, error: quoteError } = useCartQuote(items, currency, appliedCoupon?.code, mounted);

  const [name, setName] = useState(user.name);
  const [whatsapp, setWhatsapp] = useState(user.whatsapp);
  const [phone, setPhone] = useState(user.phone);
  const [telegram, setTelegram] = useState(user.telegram);
  const [sendWhatsapp, setSendWhatsapp] = useState(true);
  const [sendTelegram, setSendTelegram] = useState(user.telegramLinked);
  const [note, setNote] = useState('');
  const [methodKey, setMethodKey] = useState(methods[0]?.key || '');
  const [payLater, setPayLater] = useState(false);
  const [proof, setProof] = useState<ProofValue>(EMPTY_PROOF);
  const [agreed, setAgreed] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const method = methods.find(m => m.key === methodKey) || null;
  // A quote is only usable in the currency it was priced in; until the new one arrives the old one is faded.
  const fresh = Boolean(quote && quote.currency === currency);
  const qc = quote?.currency ?? currency;
  const stale = Boolean(quote) && (!fresh || quoteLoading);
  const total = quote?.total ?? 0;
  const totalLabel: React.ReactNode = quote ? (
    <span data-price data-price-stale={stale || undefined}>
      {formatPrice(total, qc)}
    </span>
  ) : (
    <PriceSkeleton className="w-24" />
  );
  const amountValue = fresh ? (currency === 'USD' ? total.toFixed(2) : String(Math.round(total))) : undefined;
  const sendAmount = fresh && method?.payRate ? convertPayAmount(total, method.payRate) : null;

  const place = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (name.trim().length < 2) return setErrorMsg('Enter your full name.');
    if (requireWhatsapp && !whatsapp.trim()) return setErrorMsg('Enter your WhatsApp number with country code, e.g. +92 300 1234567.');
    if (whatsapp.trim() && !PHONE_RE.test(whatsapp.trim())) return setErrorMsg('Enter a valid WhatsApp number with country code.');
    if (requirePhone && !phone.trim()) return setErrorMsg('Enter your mobile number.');
    if (phone.trim() && !PHONE_RE.test(phone.trim())) return setErrorMsg('Enter a valid mobile number.');
    if (!method) return setErrorMsg('Choose a payment method.');
    if (!quote || !fresh) return setErrorMsg('Prices are still updating. Please wait a moment.');
    if (!quote.allOk) return setErrorMsg('Some items in your cart are unavailable. Update your cart to continue.');
    if (!payLater) {
      const p = proofProblem(proof);
      if (p) return setErrorMsg(`${p}, or choose "I will pay later".`);
    }
    if (!agreed) return setErrorMsg('Please accept the Terms & Conditions, Refund Policy and Delivery Policy.');

    const channels = ['email', 'account'];
    if (sendWhatsapp && whatsapp.trim()) channels.push('whatsapp');
    if (sendTelegram) channels.push('telegram');

    setPlacing(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name.trim(),
          customerEmail: user.email,
          customerWhatsapp: whatsapp.trim() || undefined,
          customerPhone: phone.trim() || undefined,
          customerTelegram: telegram.trim() || undefined,
          items: items.map(i => ({ productId: i.product.id, variantId: i.variant.id, quantity: i.quantity })),
          couponCode: quote.couponCode || undefined,
          paymentMethod: method.key,
          currency,
          deliveryChannels: channels,
          customerNote: note.trim() || undefined,
          proof: payLater ? undefined : proofPayload(proof),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.push('/login?next=/checkout');
        return;
      }
      if (!res.ok || !data.orderNumber) throw new Error(data.error || 'We could not place your order. Please try again.');
      clearCart();
      const qs = new URLSearchParams({ order: data.orderNumber });
      if (data.proofError) qs.set('proofError', data.proofError);
      router.push(`/order-success?${qs.toString()}`);
    } catch (err) {
      setErrorMsg((err as Error).message);
      setPlacing(false);
    }
  };

  if (!mounted) return <CheckoutSkeleton />;

  if (items.length === 0 && !placing) {
    return (
      <div className="max-w-lg mx-auto p-10 text-center bg-surface-card border border-charcoal-border rounded-2xl space-y-4">
        <div className="w-16 h-16 rounded-full bg-pista-lighter text-pista-dark flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" aria-hidden="true" />
        </div>
        <h1 className="text-lg font-bold text-charcoal">Your cart is empty</h1>
        <p className="text-sm text-charcoal-subtle">Add a subscription to your cart to continue to checkout.</p>
        <Link href="/shop" className="inline-flex items-center gap-2 min-h-11 px-6 bg-pista-dark text-white hover:bg-pista-darker text-sm font-bold rounded-xl">
          Browse Products <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 sm:mb-8">
        <nav aria-label="Breadcrumb" className="text-xs text-charcoal-subtle mb-2">
          <Link href="/" className="hover:text-pista-dark">
            Home
          </Link>
          <span className="mx-1.5">/</span>
          <Link href="/cart" className="hover:text-pista-dark">
            Cart
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-charcoal-muted">Checkout</span>
        </nav>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal">Checkout</h1>
        <p className="text-sm text-charcoal-subtle mt-1">Pay by bank transfer or mobile wallet, upload the proof, and our team verifies it by hand.</p>
      </div>

      {maintenance && (
        <div role="alert" className="mb-6 p-4 bg-surface-card border-l-4 border-accent-amber text-sm text-charcoal rounded-r-xl">
          {maintenance}
        </div>
      )}

      <form onSubmit={place} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8" noValidate>
        <div className="lg:col-span-7 space-y-6 min-w-0">
          <section className="bg-surface-card border border-charcoal-border rounded-2xl p-4 sm:p-6 space-y-4" aria-labelledby="details-heading">
            <Step n={1} id="details-heading" title="Your details" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="co-name" className="text-sm font-semibold text-charcoal block mb-1">
                  Full name *
                </label>
                <input id="co-name" type="text" autoComplete="name" value={name} onChange={e => setName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="co-email" className="text-sm font-semibold text-charcoal block mb-1">
                  Email (from your account)
                </label>
                <input id="co-email" type="email" value={user.email} readOnly className={`${inputClass} bg-surface-muted text-charcoal-muted`} />
              </div>
              <div>
                <label htmlFor="co-whatsapp" className="text-sm font-semibold text-charcoal block mb-1">
                  WhatsApp number {requireWhatsapp ? '*' : <span className="font-normal text-charcoal-subtle">(optional)</span>}
                </label>
                <input
                  id="co-whatsapp"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+92 300 1234567"
                  required={requireWhatsapp}
                  aria-required={requireWhatsapp}
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="co-phone" className="text-sm font-semibold text-charcoal block mb-1">
                  Mobile number {requirePhone ? '*' : <span className="font-normal text-charcoal-subtle">(optional)</span>}
                </label>
                <input
                  id="co-phone"
                  type="tel"
                  placeholder="+92 300 1234567"
                  required={requirePhone}
                  aria-required={requirePhone}
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="co-telegram" className="text-sm font-semibold text-charcoal block mb-1">
                  Telegram username (optional)
                </label>
                <input id="co-telegram" type="text" placeholder="@username" value={telegram} onChange={e => setTelegram(e.target.value)} className={inputClass} />
              </div>
            </div>

            <fieldset className="pt-1">
              <legend className="text-sm font-semibold text-charcoal mb-1">Send my access by</legend>
              <p className="text-xs text-charcoal-subtle mb-1">Delivered access always appears on your order page, in your account and in your email.</p>
              <Checkbox checked onChange={() => {}} disabled>
                Email ({user.email})
                <span className="block text-xs font-normal text-charcoal-subtle">Always sent to your account email.</span>
              </Checkbox>
              <Checkbox checked={sendWhatsapp} onChange={setSendWhatsapp} disabled={!whatsapp.trim()}>
                WhatsApp {whatsapp.trim() ? `(${whatsapp.trim()})` : '(add your number above)'}
              </Checkbox>
              <Checkbox checked={sendTelegram} onChange={setSendTelegram} disabled={!user.telegramLinked}>
                Telegram bot{' '}
                {user.telegramLinked ? (
                  '(connected)'
                ) : (
                  <>
                    (
                    <Link href="/account/telegram" className="underline font-semibold text-pista-darker">
                      connect Telegram
                    </Link>{' '}
                    first)
                  </>
                )}
              </Checkbox>
            </fieldset>

            <div>
              <label htmlFor="co-note" className="text-sm font-semibold text-charcoal block mb-1">
                Note to our team (optional)
              </label>
              <textarea id="co-note" rows={2} maxLength={500} value={note} onChange={e => setNote(e.target.value)} className={`${inputClass} py-2.5`} placeholder="For example the email to activate on" />
            </div>
          </section>

          <section className="bg-surface-card border border-charcoal-border rounded-2xl p-4 sm:p-6 space-y-4" aria-labelledby="payment-heading">
            <Step n={2} id="payment-heading" title="Payment method" />
            {methods.length === 0 ? (
              <p className="p-4 rounded-xl bg-surface-muted text-sm text-charcoal">
                No payment method accepts {currency} right now. Switch the currency at the top of the page or contact us on WhatsApp.
              </p>
            ) : (
              <div role="radiogroup" aria-labelledby="payment-heading" className="space-y-3">
                {methods.map(m => {
                  const on = m.key === methodKey;
                  return (
                    <button
                      key={m.key}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setMethodKey(m.key)}
                      className={`w-full flex items-center gap-3 sm:gap-4 rounded-xl border p-3 sm:p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pista-500 ${
                        on ? 'border-pista-600 bg-pista-lighter ring-1 ring-pista-600' : 'border-charcoal-border hover:border-pista'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${on ? 'border-pista-600' : 'border-charcoal-border-dark'}`} aria-hidden="true">
                        {on && <span className="w-2.5 h-2.5 rounded-full bg-pista-600" />}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center gap-3 flex-wrap">
                          <PaymentLogo method={m} className="h-6 sm:h-7" />
                          {m.logo && <span className="text-sm font-bold text-charcoal">{m.name}</span>}
                        </span>
                        {m.description && <span className="block text-xs text-charcoal-subtle mt-1">{m.description}</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {method && (
              <PaymentDetails
                method={method}
                amountLabel={totalLabel}
                amountValue={amountValue}
                sendLabel={sendAmount !== null ? formatGbp(sendAmount) : undefined}
                sendValue={sendAmount !== null ? sendAmount.toFixed(2) : undefined}
              />
            )}
          </section>

          {method && (
            <section className="bg-surface-card border border-charcoal-border rounded-2xl p-4 sm:p-6 space-y-4" aria-labelledby="proof-heading">
              <Step n={3} id="proof-heading" title="Upload payment proof" />
              <div className="flex flex-col sm:flex-row gap-2" role="radiogroup" aria-label="When will you pay">
                {[
                  { v: false, label: 'I have paid, upload proof now' },
                  { v: true, label: 'I will pay later' },
                ].map(o => (
                  <button
                    key={String(o.v)}
                    type="button"
                    role="radio"
                    aria-checked={payLater === o.v}
                    onClick={() => setPayLater(o.v)}
                    className={`flex-1 min-h-11 px-3 rounded-xl border text-sm font-bold transition-colors ${
                      payLater === o.v ? 'border-pista-600 bg-pista-lighter text-pista-darker' : 'border-charcoal-border text-charcoal-muted hover:border-pista'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              {payLater ? (
                <p className="p-3 rounded-xl bg-surface-muted text-sm text-charcoal-muted leading-relaxed">
                  Your order is saved as <strong>Awaiting payment</strong>. Pay the exact total whenever you are ready, then upload the screenshot and transaction ID from your order page.
                </p>
              ) : (
                <ProofFields value={proof} onChange={setProof} idPrefix="co-proof" />
              )}
            </section>
          )}
        </div>

        <div className="lg:col-span-5">
          <section className="bg-surface-card border border-charcoal-border rounded-2xl p-4 sm:p-6 space-y-5 lg:sticky lg:top-24" aria-labelledby="summary-heading">
            <h2 id="summary-heading" className="text-base font-bold text-charcoal pb-3 border-b border-surface-muted flex items-center gap-2">
              Order summary ({items.length})
              {quoteLoading && <Loader2 className="w-4 h-4 text-pista-dark animate-spin" aria-label="Updating prices" />}
            </h2>

            <ul className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {items.map(i => {
                const line = quote?.lines.find(l => l.productId === i.product.id && l.variantId === i.variant.id);
                return (
                  <li key={i.id} className="flex items-start justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <div className="font-semibold text-charcoal line-clamp-2">{i.product.name}</div>
                      <div className="text-xs text-charcoal-subtle">
                        {i.variant.name} × {i.quantity}
                      </div>
                      {line && !line.ok && <div className="text-xs font-semibold text-accent-rose">{line.problem}</div>}
                    </div>
                    <div className="font-bold text-charcoal whitespace-nowrap">
                      {line ? (
                        <span data-price data-price-stale={stale || undefined}>
                          {formatPrice(line.price * i.quantity, qc)}
                        </span>
                      ) : (
                        <PriceSkeleton />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            <dl className="pt-4 border-t border-surface-muted space-y-2 text-sm">
              <div className="flex justify-between text-charcoal-muted">
                <dt>Subtotal</dt>
                <dd className="font-bold text-charcoal">
                  {quote ? (
                    <span data-price data-price-stale={stale || undefined}>
                      {formatPrice(quote.subtotal, qc)}
                    </span>
                  ) : (
                    <PriceSkeleton />
                  )}
                </dd>
              </div>
              {quote && quote.discount > 0 && (
                <div className="flex justify-between text-pista-darker">
                  <dt>Discount ({quote.couponCode})</dt>
                  <dd className="font-bold" data-price data-price-stale={stale || undefined}>
                    - {formatPrice(quote.discount, qc)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between text-charcoal-muted">
                <dt>Digital delivery</dt>
                <dd className="font-bold text-pista-darker">Free</dd>
              </div>
              <div className="pt-3 border-t border-surface-muted flex items-baseline justify-between gap-2">
                <dt className="text-base font-bold text-charcoal">Total</dt>
                <dd className="text-2xl font-extrabold text-charcoal whitespace-nowrap">{totalLabel}</dd>
              </div>
            </dl>
            {quote?.couponError && <p className="text-xs text-accent-rose">Coupon not applied: {quote.couponError}</p>}
            {quoteError && <p className="text-xs text-accent-rose">{quoteError}</p>}

            <div className="p-3 bg-pista-lighter rounded-xl border border-pista-light text-xs text-charcoal-muted flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-pista-dark flex-shrink-0" aria-hidden="true" />
              <span>Prices are confirmed by our server when you place the order. You pay exactly the total shown, in {currency}.</span>
            </div>

            <Checkbox checked={agreed} onChange={setAgreed}>
              I agree to the{' '}
              <Link href="/terms" className="underline hover:text-pista-darker">
                Terms &amp; Conditions
              </Link>
              ,{' '}
              <Link href="/refund-policy" className="underline hover:text-pista-darker">
                Refund Policy
              </Link>{' '}
              and{' '}
              <Link href="/delivery-policy" className="underline hover:text-pista-darker">
                Delivery Policy
              </Link>
              .
            </Checkbox>

            {errorMsg && (
              <div role="alert" className="p-3 bg-white border-l-4 border-accent-rose text-sm text-charcoal rounded-r-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-accent-rose flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={placing || Boolean(maintenance) || !fresh || methods.length === 0}
              aria-busy={placing || undefined}
              className="w-full min-h-12 px-4 bg-pista-dark text-white hover:bg-pista-darker text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {placing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>{payLater ? 'Placing your order...' : 'Uploading proof and placing order...'}</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" aria-hidden="true" />
                  <span>
                    {payLater ? 'Place order' : 'Submit payment'} · {totalLabel}
                  </span>
                </>
              )}
            </button>
          </section>
        </div>
      </form>
    </>
  );
}
