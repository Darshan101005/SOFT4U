'use client';

import { useEffect, useState } from 'react';
import type { Currency } from '@/lib/db/types';
import type { CartItem } from '@/lib/context/cart-context';

export interface QuoteLine {
  productId: string;
  variantId: string;
  quantity: number;
  ok: boolean;
  problem?: string;
  price: number;
  compareAt?: number;
  maxQuantity: number;
  productName?: string;
  variantName?: string;
  slug?: string;
  image?: string;
  deliveryTime?: string;
  stockMode?: string;
}

export interface CartQuote {
  currency: Currency;
  lines: QuoteLine[];
  subtotal: number;
  discount: number;
  total: number;
  couponCode?: string;
  couponError?: string;
  allOk: boolean;
}

/** Server-priced view of the cart (POST /api/cart/quote); re-runs whenever items, currency or coupon change. */
export function useCartQuote(items: CartItem[], currency: Currency, couponCode: string | undefined, enabled = true) {
  const [quote, setQuote] = useState<CartQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const key = JSON.stringify([items.map(i => [i.product.id, i.variant.id, i.quantity]), currency, couponCode || '']);

  useEffect(() => {
    if (!enabled || items.length === 0) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/cart/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: ctrl.signal,
          body: JSON.stringify({
            currency,
            couponCode: couponCode || undefined,
            items: items.map(i => ({ productId: i.product.id, variantId: i.variant.id, quantity: i.quantity })),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not update prices');
        setQuote(data);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setError((err as Error).message || 'Could not update prices');
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 120);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
    // `key` captures items, currency and coupon.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  const lineFor = (item: CartItem) => quote?.lines.find(l => l.productId === item.product.id && l.variantId === item.variant.id);
  return { quote: items.length ? quote : null, loading, error, lineFor };
}
