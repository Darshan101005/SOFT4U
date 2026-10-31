'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Clock, ShoppingCart, Star, Zap } from 'lucide-react';
import type { Product } from '@/lib/db/types';
import { useCart } from '@/lib/context/cart-context';
import { ProductImage } from '@/components/brand/product-image';
import { activeVariants, discountPercent, formatPrice, fromPrice, isInstant, isOrderable, priceOf, productStock, type Pricing } from '@/app/_store/price';

export interface RatingSummary {
  average: number;
  count: number;
}

/**
 * Product card used on the homepage, /shop, category pages and related products.
 * Price sits on one line; the action row never wraps (full-width "View plans" + a 44px cart button).
 */
export function ProductCard({
  product,
  pricing,
  categoryName,
  rating,
}: {
  product: Product;
  pricing: Pricing;
  categoryName?: string;
  rating?: RatingSummary;
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const { price, compareAt } = fromPrice(product, pricing);
  const pct = discountPercent(price, compareAt);
  const stock = productStock(product);
  const orderable = activeVariants(product).filter(isOrderable);
  const quickVariant = orderable.length ? orderable.reduce((a, b) => (priceOf(b, pricing) < priceOf(a, pricing) ? b : a)) : null;
  const instant = isInstant(product, quickVariant);
  const tag = product.isNew ? 'NEW' : product.badge || (product.bestseller ? 'Best seller' : '');
  const href = `/products/${product.slug}`;

  const quickAdd = () => {
    if (!quickVariant) return;
    addItem(product, quickVariant, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <article className="group flex flex-col h-full bg-white border border-charcoal-border rounded-2xl overflow-hidden hover:border-pista hover:shadow-[0_14px_30px_rgba(79,122,51,0.12)] transition-all">
      <Link href={href} className="relative block" tabIndex={-1} aria-hidden="true">
        <ProductImage
          src={product.logo || product.images[0]}
          name={product.name}
          className="aspect-[16/10] w-full"
          imgClassName="p-5 sm:p-7 group-hover:scale-[1.03] transition-transform duration-300"
        />
        {pct > 0 && <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-pista-700 text-white text-[11px] font-bold">-{pct}%</span>}
        {tag && (
          <span className="absolute top-2.5 right-2.5 max-w-[60%] truncate px-2 py-0.5 rounded-full bg-white/95 border border-pista-200 text-pista-darker text-[10px] sm:text-[11px] font-bold">
            {tag}
          </span>
        )}
      </Link>

      <div className="flex flex-col flex-1 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2 text-[11px] sm:text-xs">
          <span className="text-charcoal-subtle truncate">{categoryName || product.brand || product.productType}</span>
          <span className="inline-flex items-center gap-1 font-semibold text-pista-dark shrink-0">
            {instant ? <Zap className="w-3 h-3" aria-hidden="true" /> : <Clock className="w-3 h-3" aria-hidden="true" />}
            <span className="truncate max-w-[90px]">{instant ? 'Instant' : product.deliveryTime}</span>
          </span>
        </div>

        <h3 className="mt-1.5 text-sm sm:text-base font-bold leading-snug text-charcoal line-clamp-2">
          <Link href={href} className="hover:text-pista-darker focus-visible:underline">
            {product.name}
          </Link>
        </h3>

        <div className="mt-1 flex items-center gap-1.5 text-[11px] sm:text-xs text-charcoal-subtle flex-wrap">
          {rating && rating.count > 0 && (
            <>
              <Star className="w-3.5 h-3.5 fill-accent-amber text-accent-amber" aria-hidden="true" />
              <span className="font-semibold text-charcoal">{rating.average.toFixed(1)}</span>
              <span>({rating.count})</span>
              <span aria-hidden="true">&middot;</span>
            </>
          )}
          <span className={stock.kind === 'out' ? 'text-accent-rose font-semibold' : ''}>{stock.label}</span>
        </div>

        <p className="hidden sm:block mt-2 text-xs leading-relaxed text-charcoal-muted line-clamp-2">{product.shortDescription}</p>

        <div className="mt-auto pt-3">
          <div className="text-[10px] sm:text-[11px] text-charcoal-subtle">From</div>
          <div className="text-base sm:text-lg font-extrabold text-charcoal whitespace-nowrap leading-tight">{formatPrice(price, pricing.currency)}</div>
          {compareAt && <div className="text-[11px] sm:text-xs text-charcoal-subtle line-through whitespace-nowrap">{formatPrice(compareAt, pricing.currency)}</div>}

          <div className="mt-3 flex items-center gap-2">
            <Link
              href={href}
              className="flex-1 min-w-0 inline-flex items-center justify-center min-h-11 px-3 rounded-xl bg-pista-lighter text-pista-darker text-xs sm:text-sm font-bold whitespace-nowrap group-hover:bg-pista group-hover:text-charcoal transition-colors"
            >
              View plans
            </Link>
            <button
              type="button"
              onClick={quickAdd}
              disabled={!quickVariant}
              className="shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-xl border border-charcoal-border bg-white text-charcoal hover:border-pista hover:bg-pista-lighter hover:text-pista-darker transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label={quickVariant ? `Add ${product.name} (${quickVariant.name}) to cart` : `${product.name} is out of stock`}
              title={quickVariant ? `Add ${quickVariant.name} to cart` : 'Out of stock'}
            >
              {added ? <Check className="w-4 h-4 text-pista-dark" aria-hidden="true" /> : <ShoppingCart className="w-4 h-4" aria-hidden="true" />}
            </button>
          </div>
          <span className="sr-only" role="status" aria-live="polite">
            {added ? `${product.name} added to cart` : ''}
          </span>
        </div>
      </div>
    </article>
  );
}

/** Loading placeholder with the same footprint as ProductCard. */
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col h-full bg-white border border-charcoal-border rounded-2xl overflow-hidden" aria-hidden="true">
      <div className="aspect-[16/10] w-full bg-pista-50 animate-pulse" />
      <div className="p-3 sm:p-4 space-y-2">
        <div className="h-3 w-1/2 rounded bg-pista-50 animate-pulse" />
        <div className="h-4 w-4/5 rounded bg-pista-100 animate-pulse" />
        <div className="h-3 w-1/3 rounded bg-pista-50 animate-pulse" />
        <div className="h-5 w-2/5 rounded bg-pista-100 animate-pulse mt-4" />
        <div className="h-11 w-full rounded-xl bg-pista-50 animate-pulse" />
      </div>
    </div>
  );
}
