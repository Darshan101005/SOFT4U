'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight, Check, Loader2, Minus, Plus, ShieldCheck, ShoppingBag, Tag, Trash2, Zap } from 'lucide-react';
import type { Currency } from '@/lib/db/types';
import { useCart } from '@/lib/context/cart-context';
import { useHydrated } from '@/hooks/use-hydrated';
import { ProductImage } from '@/components/brand/product-image';
import { useCartQuote } from '@/components/cart/use-cart-quote';
import { formatPrice } from '@/app/_store/price';

export function CartView({ currency }: { currency: Currency }) {
  const { items, removeItem, updateQuantity, appliedCoupon, applyCoupon, removeCoupon, itemCount, clearCart } = useCart();
  const mounted = useHydrated();
  const { quote, loading, error, lineFor } = useCartQuote(items, currency, appliedCoupon?.code, mounted);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    setCouponLoading(true);
    const res = await applyCoupon(couponInput);
    if (!res.success) setCouponError(res.error || 'This coupon could not be applied');
    else setCouponInput('');
    setCouponLoading(false);
  };

  const blocked = quote ? !quote.allOk : true;

  return (
    <>
      <div className="mb-6 sm:mb-8 flex items-end justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="text-xs text-charcoal-subtle mb-2">
            <Link href="/" className="hover:text-pista-dark">
              Home
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-charcoal-muted">Cart</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal">Your Cart</h1>
          {mounted && items.length > 0 && (
            <p className="text-sm text-charcoal-subtle mt-1">
              {itemCount} item{itemCount === 1 ? '' : 's'} in your cart
            </p>
          )}
        </div>
        {mounted && items.length > 0 && (
          <button type="button" onClick={clearCart} className="min-h-11 px-2 text-sm text-charcoal-subtle hover:text-pista-darker underline">
            Clear cart
          </button>
        )}
      </div>

      {!mounted ? (
        <div className="py-20 text-center text-sm text-charcoal-subtle">Loading your cart...</div>
      ) : items.length === 0 ? (
        <div className="p-10 sm:p-16 text-center bg-surface-card border border-charcoal-border rounded-2xl max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-pista-lighter text-pista-dark flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-bold text-charcoal">Your cart is empty</h2>
          <p className="text-sm text-charcoal-subtle">Browse our subscriptions and add a plan to get started.</p>
          <Link href="/shop" className="inline-flex items-center gap-2 min-h-11 px-6 bg-pista-dark text-white hover:bg-pista-darker text-sm font-bold rounded-xl">
            Browse Products
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-8 space-y-4 min-w-0">
            <ul className="bg-surface-card border border-charcoal-border rounded-2xl overflow-hidden divide-y divide-surface-muted">
              {items.map(item => {
                const line = lineFor(item);
                const unit = line?.price;
                const max = line ? Math.max(1, line.maxQuantity) : 10;
                return (
                  <li key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                      <ProductImage src={item.product.logo || item.product.images?.[0]} name={item.product.name} className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border border-charcoal-border shrink-0" imgClassName="p-1.5" />
                      <div className="min-w-0">
                        <Link href={`/products/${item.product.slug}`} className="text-sm font-bold text-charcoal hover:text-pista-dark line-clamp-2">
                          {item.product.name}
                        </Link>
                        <div className="text-xs text-charcoal-subtle mt-0.5">
                          Plan: <span className="font-semibold text-charcoal-muted">{item.variant.name}</span>
                        </div>
                        <div className="text-xs text-pista-dark font-medium flex items-center gap-1 mt-1">
                          <Zap className="w-3 h-3" aria-hidden="true" />
                          <span>{line?.deliveryTime || item.variant.deliveryTime || item.product.deliveryTime || 'Digital delivery'}</span>
                        </div>
                        {line && !line.ok && (
                          <p className="mt-1 text-xs font-semibold text-accent-rose flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                            {line.problem}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-5 w-full sm:w-auto">
                      <div className="flex items-center border border-charcoal-border rounded-xl overflow-hidden" role="group" aria-label={`Quantity of ${item.product.name}`}>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-11 h-11 inline-flex items-center justify-center text-charcoal hover:bg-surface-muted"
                          aria-label={`Decrease quantity of ${item.product.name}`}
                        >
                          <Minus className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <span className="w-9 text-center text-sm font-bold text-charcoal" aria-live="polite">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          disabled={item.quantity >= max}
                          className="w-11 h-11 inline-flex items-center justify-center text-charcoal hover:bg-surface-muted disabled:opacity-40"
                          aria-label={`Increase quantity of ${item.product.name}`}
                        >
                          <Plus className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>

                      <div className="text-right min-w-[92px]">
                        {unit === undefined ? (
                          <div className="h-5 w-20 ml-auto rounded bg-pista-50 animate-pulse" aria-label="Loading price" />
                        ) : (
                          <>
                            <div className="text-base font-extrabold text-charcoal whitespace-nowrap">{formatPrice(unit * item.quantity, currency)}</div>
                            <div className="text-xs text-charcoal-subtle whitespace-nowrap">{formatPrice(unit, currency)} each</div>
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="w-11 h-11 inline-flex items-center justify-center rounded-xl text-charcoal-subtle hover:text-accent-rose hover:bg-surface-muted transition-colors"
                        aria-label={`Remove ${item.product.name} from cart`}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="p-4 bg-pista-lighter border border-pista-light rounded-xl flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-charcoal-muted">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-pista-dark" aria-hidden="true" />
                Replacement warranty on every plan
              </span>
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-pista-dark" aria-hidden="true" />
                Delivered to your account and email
              </span>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="bg-surface-card border border-charcoal-border rounded-2xl p-5 sm:p-6 space-y-5 lg:sticky lg:top-24">
              <h2 className="text-base font-bold text-charcoal flex items-center gap-2">
                Order Summary
                {loading && <Loader2 className="w-4 h-4 text-pista-dark animate-spin" aria-label="Updating prices" />}
              </h2>

              <dl className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-charcoal-muted">
                  <dt>Subtotal</dt>
                  <dd className="font-bold text-charcoal">{quote ? formatPrice(quote.subtotal, currency) : '…'}</dd>
                </div>
                {quote && quote.discount > 0 && (
                  <div className="flex items-center justify-between text-pista-darker">
                    <dt className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" aria-hidden="true" />
                      Discount ({quote.couponCode})
                    </dt>
                    <dd className="font-bold">- {formatPrice(quote.discount, currency)}</dd>
                  </div>
                )}
                <div className="flex items-center justify-between text-charcoal-muted">
                  <dt>Delivery</dt>
                  <dd className="font-bold text-pista-darker">Free</dd>
                </div>
                <div className="pt-3 border-t border-surface-muted flex items-baseline justify-between">
                  <dt className="text-base font-bold text-charcoal">Total</dt>
                  <dd className="text-2xl font-extrabold text-charcoal">{quote ? formatPrice(quote.total, currency) : '…'}</dd>
                </div>
              </dl>
              {error && (
                <p role="alert" className="text-xs text-accent-rose">
                  {error}
                </p>
              )}

              <div className="pt-4 border-t border-surface-muted">
                {appliedCoupon ? (
                  <div className="space-y-1.5">
                    <div className="p-3 bg-pista-lighter border border-pista-light rounded-xl text-sm flex items-center justify-between gap-2">
                      <span className="font-bold text-pista-darker flex items-center gap-1">
                        <Check className="w-4 h-4" aria-hidden="true" />
                        {appliedCoupon.code} {quote?.couponError ? 'entered' : 'applied'}
                      </span>
                      <button type="button" onClick={removeCoupon} className="min-h-11 px-2 text-xs text-charcoal-subtle hover:text-charcoal font-semibold underline">
                        Remove
                      </button>
                    </div>
                    {quote?.couponError && (
                      <p role="alert" className="text-xs text-accent-rose">
                        {quote.couponError}
                      </p>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="space-y-2">
                    <label htmlFor="coupon" className="text-sm font-semibold text-charcoal block">
                      Coupon code
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="coupon"
                        type="text"
                        value={couponInput}
                        onChange={e => setCouponInput(e.target.value)}
                        placeholder="Enter code"
                        autoComplete="off"
                        className="flex-1 min-w-0 min-h-11 text-base sm:text-sm px-3 border border-charcoal-border rounded-xl uppercase bg-surface-bg focus:bg-surface-card focus:outline-none focus:border-pista"
                      />
                      <button
                        type="submit"
                        disabled={!couponInput.trim() || couponLoading}
                        className="min-h-11 px-4 border border-pista text-pista-darker hover:bg-pista-lighter text-sm font-semibold rounded-xl disabled:opacity-50"
                      >
                        {couponLoading ? '...' : 'Apply'}
                      </button>
                    </div>
                    {couponError && (
                      <p role="alert" className="text-xs text-accent-rose">
                        {couponError}
                      </p>
                    )}
                  </form>
                )}
              </div>

              {blocked && quote && (
                <p className="text-xs text-accent-rose font-semibold">Remove or change the items marked above to continue.</p>
              )}
              <Link
                href="/checkout"
                aria-disabled={blocked}
                onClick={e => blocked && e.preventDefault()}
                className={`w-full min-h-12 px-4 text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 ${
                  blocked ? 'bg-charcoal-border text-charcoal-subtle cursor-not-allowed' : 'bg-pista-dark text-white hover:bg-pista-darker'
                }`}
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <div className="text-center">
                <Link href="/shop" className="inline-flex items-center min-h-11 text-sm text-charcoal-subtle hover:text-pista-dark hover:underline">
                  Continue shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
