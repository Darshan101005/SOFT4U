'use client';

import React from 'react';
import Link from 'next/link';
import { Product } from '@/lib/db/types';
import { Zap, Check, ShoppingCart } from 'lucide-react';
import { useCart } from '@/lib/context/cart-context';
import { formatPrice } from '@/app/_store/price';

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const lowestVariant = product.variants && product.variants.length > 0 ? product.variants[0] : null;
  const price = lowestVariant ? lowestVariant.price : product.price;
  const comparePrice = lowestVariant?.compareAtPrice || product.compareAtPrice;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (lowestVariant) {
      addItem(product, lowestVariant, 1);
    }
  };

  return (
    <div className="group bg-white border border-charcoal-border rounded-xl overflow-hidden hover:border-pista hover:shadow-lg transition-all flex flex-col justify-between">
      <div>
        {/* Card Header & Badge */}
        <div className="p-4 pb-0 flex items-center justify-between gap-2">
          {/* Crisp unboxed kicker */}
          <div className="text-[11px] font-bold text-pista-dark uppercase tracking-wider">
            {product.badge || (product.bestseller ? 'BEST SELLER' : 'VERIFIED')}
          </div>
          <div className="text-[11px] text-charcoal-subtle flex items-center gap-1 font-mono font-medium">
            <Zap className="w-3 h-3 text-pista-dark" />
            <span>Instant</span>
          </div>
        </div>

        {/* Product Title & Link */}
        <div className="p-4">
          <Link href={`/products/${product.slug}`} className="block group-hover:text-pista-darker transition-colors">
            <h3 className="text-base font-bold text-charcoal leading-snug line-clamp-1">
              {product.name}
            </h3>
          </Link>

          <p className="text-xs text-charcoal-muted mt-2 line-clamp-2 leading-relaxed">
            {product.shortDescription}
          </p>

          {/* Quick bullet points */}
          {product.features && product.features.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {product.features.slice(0, 2).map((feat, idx) => (
                <li key={idx} className="flex items-center gap-1.5 text-[11px] text-charcoal-muted">
                  <Check className="w-3.5 h-3.5 text-pista-dark flex-shrink-0" />
                  <span className="truncate">{feat}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Card Footer: Pricing & Action */}
      <div className="p-4 pt-3 border-t border-surface-muted bg-surface-bg flex items-center justify-between gap-2">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-extrabold text-charcoal font-mono">
              {formatPrice(price)}
            </span>
            {comparePrice && (
              <span className="text-xs text-charcoal-subtle line-through font-mono">
                {formatPrice(comparePrice)}
              </span>
            )}
          </div>
          <div className="text-[10px] text-charcoal-subtle font-medium">
            {lowestVariant?.name || 'Standard Plan'}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleQuickAdd}
            className="p-2 rounded-lg bg-white border border-charcoal-border hover:border-pista text-charcoal transition-colors hover:bg-pista-lighter hover:text-pista-darker"
            title="Quick add to cart"
            aria-label="Add to cart"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
          <Link
            href={`/products/${product.slug}`}
            className="px-3.5 py-2 bg-pista-dark text-white hover:bg-pista-darker text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-xs"
          >
            <span>View Plan</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
