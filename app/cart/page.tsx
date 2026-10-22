'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useCart } from '@/lib/context/cart-context';
import { useHydrated } from '@/hooks/use-hydrated';
import { formatPrice } from '@/app/_store/price';
import { Trash2, ArrowRight, ShieldCheck, Tag, Zap, ShoppingBag, Check, Minus, Plus } from 'lucide-react';

export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    subtotal,
    discount,
    total,
    itemCount,
    clearCart,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  // The cart is restored from localStorage, so wait for the client before rendering it.
  const mounted = useHydrated();

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    setCouponLoading(true);
    const res = await applyCoupon(couponInput);
    if (!res.success) {
      setCouponError(res.error || 'This coupon could not be applied');
    } else {
      setCouponInput('');
    }
    setCouponLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <nav aria-label="Breadcrumb" className="text-xs text-charcoal-subtle mb-2">
              <Link href="/" className="hover:text-pista-dark">Home</Link>
              <span className="mx-1.5">/</span>
              <span className="text-charcoal-muted">Cart</span>
            </nav>
            <h1 className="text-3xl font-extrabold text-charcoal">Your Cart</h1>
            {mounted && items.length > 0 && (
              <p className="text-sm text-charcoal-subtle mt-1">{itemCount} item{itemCount === 1 ? '' : 's'} in your cart</p>
            )}
          </div>
          {mounted && items.length > 0 && (
            <button onClick={clearCart} className="text-sm text-charcoal-subtle hover:text-pista-darker underline">
              Clear cart
            </button>
          )}
        </div>

        {!mounted ? (
          <div className="py-20 text-center text-sm text-charcoal-subtle">Loading your cart...</div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-4">
              <ul className="bg-surface-card border border-charcoal-border rounded-2xl overflow-hidden divide-y divide-surface-muted">
                {items.map(item => (
                  <li key={item.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-16 h-16 rounded-xl bg-surface-muted border border-charcoal-border overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {item.product.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag className="w-6 h-6 text-pista-dark" aria-hidden="true" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link href={`/products/${item.product.slug}`} className="text-sm font-bold text-charcoal hover:text-pista-dark line-clamp-2">
                          {item.product.name}
                        </Link>
                        <div className="text-xs text-charcoal-subtle mt-0.5">
                          Plan: <span className="font-semibold text-charcoal-muted">{item.variant.name}</span>
                        </div>
                        <div className="text-xs text-pista-dark font-medium flex items-center gap-1 mt-1">
                          <Zap className="w-3 h-3" aria-hidden="true" />
                          <span>Instant digital delivery</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto">
                      <div className="flex items-center border border-charcoal-border rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-2 text-charcoal hover:bg-surface-muted"
                          aria-label={`Decrease quantity of ${item.product.name}`}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-sm font-bold text-charcoal" aria-live="polite">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-2 text-charcoal hover:bg-surface-muted"
                          aria-label={`Increase quantity of ${item.product.name}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right min-w-[90px]">
                        <div className="text-base font-extrabold text-charcoal">{formatPrice(item.variant.price * item.quantity)}</div>
                        <div className="text-xs text-charcoal-subtle">{formatPrice(item.variant.price)} each</div>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-charcoal-subtle hover:text-accent-rose p-1.5 transition-colors"
                        aria-label={`Remove ${item.product.name} from cart`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="p-4 bg-pista-lighter border border-pista-light rounded-xl flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-charcoal-muted">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-pista-dark" aria-hidden="true" />
                  Replacement warranty on every plan
                </span>
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-pista-dark" aria-hidden="true" />
                  Delivered to your email & WhatsApp
                </span>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="bg-surface-card border border-charcoal-border rounded-2xl p-6 space-y-5 lg:sticky lg:top-24">
                <h2 className="text-base font-bold text-charcoal">Order Summary</h2>

                <dl className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-charcoal-muted">
                    <dt>Subtotal</dt>
                    <dd className="font-bold text-charcoal">{formatPrice(subtotal)}</dd>
                  </div>
                  {discount > 0 && (
                    <div className="flex items-center justify-between text-pista-darker">
                      <dt className="flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" aria-hidden="true" />
                        Discount ({appliedCoupon?.code})
                      </dt>
                      <dd className="font-bold">- {formatPrice(discount)}</dd>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-charcoal-muted">
                    <dt>Delivery</dt>
                    <dd className="font-bold text-pista-darker">Free</dd>
                  </div>
                  <div className="pt-3 border-t border-surface-muted flex items-baseline justify-between">
                    <dt className="text-base font-bold text-charcoal">Total</dt>
                    <dd className="text-2xl font-extrabold text-charcoal">{formatPrice(total)}</dd>
                  </div>
                </dl>

                <div className="pt-4 border-t border-surface-muted">
                  {appliedCoupon ? (
                    <div className="p-3 bg-pista-lighter border border-pista-light rounded-lg text-sm flex items-center justify-between">
                      <span className="font-bold text-pista-darker flex items-center gap-1">
                        <Check className="w-4 h-4" aria-hidden="true" />
                        {appliedCoupon.code} applied
                      </span>
                      <button onClick={removeCoupon} className="text-xs text-charcoal-subtle hover:text-charcoal font-semibold underline">
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="space-y-2">
                      <label htmlFor="coupon" className="text-sm font-semibold text-charcoal block">Coupon code</label>
                      <div className="flex gap-2">
                        <input
                          id="coupon"
                          type="text"
                          value={couponInput}
                          onChange={e => setCouponInput(e.target.value)}
                          placeholder="Enter code"
                          className="flex-1 min-w-0 text-sm px-3 py-2 border border-charcoal-border rounded-lg uppercase bg-surface-bg focus:bg-surface-card focus:outline-none focus:border-pista"
                        />
                        <button
                          type="submit"
                          disabled={!couponInput.trim() || couponLoading}
                          className="px-4 py-2 border border-pista text-pista-darker hover:bg-pista-lighter text-sm font-semibold rounded-lg disabled:opacity-50"
                        >
                          {couponLoading ? '...' : 'Apply'}
                        </button>
                      </div>
                      {couponError && <p role="alert" className="text-xs text-accent-rose">{couponError}</p>}
                    </form>
                  )}
                </div>

                <Link
                  href="/checkout"
                  className="w-full py-3.5 px-4 bg-pista-dark text-white hover:bg-pista-darker text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
                <div className="text-center">
                  <Link href="/shop" className="text-sm text-charcoal-subtle hover:text-pista-dark hover:underline">
                    Continue shopping
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 sm:p-16 text-center bg-surface-card border border-charcoal-border rounded-2xl max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-pista-lighter text-pista-dark flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-bold text-charcoal">Your cart is empty</h2>
            <p className="text-sm text-charcoal-subtle">Browse our subscriptions and add a plan to get started.</p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-pista-dark text-white hover:bg-pista-darker text-sm font-bold rounded-lg"
            >
              <span>Browse Products</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
