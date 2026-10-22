import Link from 'next/link';
import { Star, Zap, Clock } from 'lucide-react';
import type { Category, Product } from '@/lib/db/types';
import { ProductImage } from '@/components/brand/product-image';
import { formatPKR, getProductStock } from '@/data/products';
import { MOCK_RATING } from '@/components/home/content';

/** Product card: logo tile, discount, category, delivery, rating, stock, price. */
export function HomeProductCard({ product, category }: { product: Product; category?: Category }) {
  const stock = getProductStock(product);
  const instant = product.deliveryTime.toLowerCase().startsWith('instant');
  const tag = product.isNew ? 'NEW' : product.badge;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col h-full bg-white border border-charcoal-border rounded-2xl overflow-hidden hover:border-pista hover:shadow-[0_14px_30px_rgba(79,122,51,0.12)] transition-all"
    >
      <div className="relative">
        <ProductImage
          src={product.images[0]}
          name={product.name}
          className="aspect-[16/10] w-full"
          imgClassName="p-5 sm:p-8 group-hover:scale-[1.03] transition-transform duration-300"
        />
        {product.discount > 0 && (
          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-pista-700 text-white text-[11px] font-bold">
            -{product.discount}%
          </span>
        )}
        {tag && (
          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-white/95 border border-pista-200 text-pista-darker text-[10px] sm:text-[11px] font-bold">
            {tag}
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2 text-[11px] sm:text-xs">
          <span className="text-charcoal-subtle truncate">{category?.name}</span>
          <span className="inline-flex items-center gap-1 font-semibold text-pista-dark shrink-0">
            {instant ? <Zap className="w-3 h-3" aria-hidden="true" /> : <Clock className="w-3 h-3" aria-hidden="true" />}
            {instant ? 'Instant' : product.deliveryTime}
          </span>
        </div>

        <h3 className="mt-1.5 text-sm sm:text-base font-bold leading-snug text-charcoal group-hover:text-pista-darker line-clamp-2">
          {product.name}
        </h3>

        <div className="mt-1 flex items-center gap-1.5 text-[11px] sm:text-xs text-charcoal-subtle">
          <Star className="w-3.5 h-3.5 fill-accent-amber text-accent-amber" aria-hidden="true" />
          <span className="font-semibold text-charcoal">{MOCK_RATING.toFixed(1)}</span>
          <span aria-hidden="true">&middot;</span>
          <span>{stock > 0 ? `${stock} available` : 'Out of stock'}</span>
        </div>

        <p className="hidden sm:block mt-2 text-xs leading-relaxed text-charcoal-muted line-clamp-2">
          {product.shortDescription}
        </p>

        <div className="mt-auto pt-3 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] sm:text-[11px] text-charcoal-subtle">From</div>
            <div className="flex flex-wrap items-baseline gap-x-1.5">
              <span className="text-base sm:text-lg font-extrabold text-charcoal">{formatPKR(product.price)}</span>
              {product.compareAtPrice && (
                <span className="text-[11px] sm:text-xs text-charcoal-subtle line-through">
                  {formatPKR(product.compareAtPrice)}
                </span>
              )}
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center px-3 py-2 rounded-xl bg-pista-lighter text-pista-darker text-xs font-bold group-hover:bg-pista group-hover:text-charcoal transition-colors shrink-0">
            View plans
          </span>
        </div>
      </div>
    </Link>
  );
}
