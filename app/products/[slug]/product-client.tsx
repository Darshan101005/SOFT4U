'use client';

import React, { useState } from 'react';
import { LocalTime } from '@/components/local-time';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, ChevronDown, ChevronRight, Clock, Info, MessageCircle, Minus, Plus, ShieldCheck, ShoppingCart, Star, Zap } from 'lucide-react';
import type { Category, Product, ProductVariant, Review } from '@/lib/db/types';
import { useCart } from '@/lib/context/cart-context';
import { useAuth } from '@/lib/context/auth-context';
import { ProductCard, type RatingSummary } from '@/components/product-card';
import { ProductImage } from '@/components/brand/product-image';
import { LoadingButton } from '@/components/ui/loading-button';
import { startRouteProgress } from '@/components/route-progress';
import { activeVariants, compareAtOf, discountPercent, formatPrice, isInstant, isOrderable, maxQuantity, priceOf, variantStock, type Pricing } from '@/app/_store/price';

type Tab = 'description' | 'activation' | 'warranty' | 'reviews';

export function ProductClient({
  product,
  category,
  related,
  pricing,
  rating,
  reviews,
  faqs,
  ratings,
  categoryNames,
  whatsappHref,
  storeName,
}: {
  product: Product;
  category: Category | null;
  related: Product[];
  pricing: Pricing;
  rating?: RatingSummary;
  reviews: Review[];
  faqs: Array<{ id: string; question: string; answer: string }>;
  ratings: Record<string, RatingSummary>;
  categoryNames: Record<string, string>;
  whatsappHref: string;
  storeName: string;
}) {
  const router = useRouter();
  const { addItem } = useCart();
  const variants = activeVariants(product);
  const firstOrderable = variants.find(isOrderable) || variants[0] || null;
  const [selectedId, setSelectedId] = useState<string | null>(firstOrderable?.id || null);
  const selected: ProductVariant | null = variants.find(v => v.id === selectedId) || firstOrderable;
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<Tab>('description');
  const [addedNotice, setAddedNotice] = useState(false);
  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);

  const price = selected ? priceOf(selected, pricing) : 0;
  const compareAt = selected ? compareAtOf(selected, pricing) : undefined;
  const pct = discountPercent(price, compareAt);
  const stock = selected ? variantStock(selected) : null;
  const canBuy = Boolean(selected && isOrderable(selected));
  const maxQty = selected ? Math.max(1, maxQuantity(selected)) : 1;
  const qty = Math.min(quantity, maxQty);
  const instant = isInstant(product, selected);

  const handleAddToCart = () => {
    if (!selected || !canBuy) return;
    setAdding(true);
    addItem(product, selected, qty);
    setTimeout(() => {
      setAdding(false);
      setAddedNotice(true);
    }, 300);
    setTimeout(() => setAddedNotice(false), 3800);
  };

  const handleBuyNow = () => {
    if (!selected || !canBuy) return;
    setBuying(true);
    addItem(product, selected, qty);
    startRouteProgress();
    router.push('/checkout');
  };

  const whatsappText = encodeURIComponent(`Hello ${storeName}, I want to order ${product.name}${selected ? ` (${selected.name})` : ''}.`);
  const features = selected?.features?.length ? selected.features : product.features;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'description', label: 'Description' },
    { id: 'activation', label: 'How to activate' },
    { id: 'warranty', label: 'Warranty & refund' },
    { id: 'reviews', label: `Reviews (${reviews.length})` },
  ];

  return (
    <div className="space-y-8 sm:space-y-10">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-charcoal-subtle flex-wrap">
        <Link href="/" className="hover:text-pista-dark">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        <Link href="/shop" className="hover:text-pista-dark">
          Shop
        </Link>
        <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        {category && (
          <>
            <Link href={`/categories/${category.slug}`} className="hover:text-pista-dark">
              {category.name}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </>
        )}
        <span className="text-charcoal-muted font-semibold truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 bg-surface-card border border-charcoal-border rounded-2xl p-4 sm:p-8">
        <div className="lg:col-span-5 space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-charcoal-border">
            <ProductImage src={product.logo || product.images[0]} name={product.name} className="aspect-[4/3] sm:aspect-square" imgClassName="p-10 sm:p-12" />
            {pct > 0 && <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-pista-700 text-white text-xs font-bold">-{pct}%</span>}
            {product.badge && (
              <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-surface-card text-pista-darker text-xs font-bold border border-pista-light">{product.badge}</span>
            )}
          </div>

          <dl className="p-4 bg-surface-muted rounded-xl space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-1.5 text-charcoal-muted">
                <Clock className="w-4 h-4 text-pista-dark" aria-hidden="true" /> Delivery time
              </dt>
              <dd className="font-semibold text-charcoal text-right">{selected?.deliveryTime || product.deliveryTime}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-1.5 text-charcoal-muted">
                <Zap className="w-4 h-4 text-pista-dark" aria-hidden="true" /> Delivered via
              </dt>
              <dd className="font-semibold text-charcoal text-right">{selected?.deliveryMethod || product.deliveryMethod}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-1.5 text-charcoal-muted">
                <ShieldCheck className="w-4 h-4 text-pista-dark" aria-hidden="true" /> Warranty
              </dt>
              <dd className="font-semibold text-charcoal text-right">Full plan duration</dd>
            </div>
          </dl>
        </div>

        <div className="lg:col-span-7 flex flex-col gap-5 sm:gap-6 min-w-0">
          <div>
            <div className="text-xs text-charcoal-subtle mb-1 flex items-center gap-2 flex-wrap">
              <span>{category?.name || product.productType}</span>
              {product.brand && (
                <>
                  <span aria-hidden="true">&middot;</span>
                  <span>{product.brand}</span>
                </>
              )}
              {instant && (
                <span className="inline-flex items-center gap-1 text-pista-dark font-semibold">
                  <Zap className="w-3 h-3" aria-hidden="true" /> Instant
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal break-words">{product.name}</h1>
            {rating && rating.count > 0 && (
              <button type="button" onClick={() => setActiveTab('reviews')} className="mt-2 inline-flex items-center gap-1.5 min-h-9 text-sm text-charcoal-muted hover:text-charcoal">
                <Star className="w-4 h-4 fill-accent-amber text-accent-amber" aria-hidden="true" />
                <span className="font-bold text-charcoal">{rating.average.toFixed(1)}</span>
                <span>
                  ({rating.count} review{rating.count === 1 ? '' : 's'})
                </span>
              </button>
            )}
            <p className="text-sm text-charcoal-muted mt-3 leading-relaxed">{product.shortDescription}</p>
          </div>

          <div className="p-4 bg-pista-lighter border border-pista-light rounded-xl flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="text-3xl font-extrabold text-charcoal whitespace-nowrap" data-price>{formatPrice(price * qty, pricing.currency)}</div>
              {compareAt && <div className="text-sm text-charcoal-subtle line-through whitespace-nowrap" data-price>{formatPrice(compareAt * qty, pricing.currency)}</div>}
              {compareAt && <div className="text-xs text-pista-darker font-semibold mt-0.5" data-price>You save {formatPrice((compareAt - price) * qty, pricing.currency)}</div>}
              {qty > 1 && (
                <div className="text-xs text-charcoal-subtle mt-0.5" data-price>
                  {formatPrice(price, pricing.currency)} each × {qty}
                </div>
              )}
            </div>
            {stock && (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-card ${stock.kind === 'out' ? 'text-accent-rose' : 'text-pista-darker'}`}
              >
                {stock.kind !== 'out' && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
                {stock.label}
              </span>
            )}
          </div>

          {variants.length > 0 && (
            <fieldset>
              <legend className="text-sm font-bold text-charcoal mb-2">Choose your plan</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
                {variants.map(v => {
                  const isSelected = selected?.id === v.id;
                  const vs = variantStock(v);
                  const vCompare = compareAtOf(v, pricing);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(v.id);
                        setQuantity(1);
                      }}
                      aria-pressed={isSelected}
                      className={`min-h-11 p-3 rounded-xl border text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pista-500 ${
                        isSelected ? 'border-pista-dark bg-pista-lighter ring-1 ring-pista-dark' : 'border-charcoal-border hover:border-pista'
                      } ${vs.kind === 'out' ? 'opacity-60' : ''}`}
                    >
                      <div className="text-sm font-bold text-charcoal">{v.name}</div>
                      <div className="mt-1 flex items-baseline gap-2 flex-wrap">
                        <span className="text-base font-extrabold text-charcoal whitespace-nowrap" data-price>{formatPrice(priceOf(v, pricing), pricing.currency)}</span>
                        {vCompare && <span className="text-xs text-charcoal-subtle line-through whitespace-nowrap" data-price>{formatPrice(vCompare, pricing.currency)}</span>}
                      </div>
                      <div className={`text-[11px] mt-0.5 ${vs.kind === 'out' ? 'text-accent-rose font-semibold' : 'text-charcoal-subtle'}`}>{vs.label}</div>
                    </button>
                  );
                })}
              </div>
              {selected?.description && <p className="mt-2 text-xs text-charcoal-muted leading-relaxed">{selected.description}</p>}
            </fieldset>
          )}

          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-charcoal" id="qty-label">
              Quantity
            </span>
            <div className="flex items-center border border-charcoal-border rounded-xl overflow-hidden" role="group" aria-labelledby="qty-label">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, qty - 1))}
                disabled={qty <= 1}
                className="w-11 h-11 inline-flex items-center justify-center text-charcoal hover:bg-surface-muted disabled:opacity-40"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" aria-hidden="true" />
              </button>
              <span className="w-10 text-center text-sm font-bold text-charcoal" aria-live="polite">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(maxQty, qty + 1))}
                disabled={qty >= maxQty}
                className="w-11 h-11 inline-flex items-center justify-center text-charcoal hover:bg-surface-muted disabled:opacity-40"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-surface-muted">
            {addedNotice && (
              <div role="status" className="p-3 bg-pista-lighter border border-pista-light rounded-xl text-sm text-pista-darker font-semibold flex items-center justify-between gap-3">
                <span className="min-w-0">
                  Added to cart: {product.name} ({selected?.name})
                </span>
                <Link href="/cart" className="inline-flex items-center min-h-11 underline font-bold whitespace-nowrap">
                  View cart
                </Link>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <LoadingButton
                loading={adding}
                onClick={handleAddToCart}
                disabled={!canBuy}
                className="w-full min-h-12 px-3 bg-surface-card border-2 border-pista-dark text-pista-darker hover:bg-pista-lighter text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ShoppingCart className="w-4 h-4" aria-hidden="true" />
                Add to Cart
              </LoadingButton>
              <LoadingButton
                loading={buying}
                onClick={handleBuyNow}
                disabled={!canBuy}
                className="w-full min-h-12 px-3 bg-pista-dark text-white hover:bg-pista-darker text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                Buy Now
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </LoadingButton>
            </div>
            {!canBuy && <p className="text-xs text-accent-rose font-semibold">This plan is out of stock. Choose another plan or ask us on WhatsApp.</p>}
            <a
              href={`${whatsappHref}?text=${whatsappText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-11 px-4 border border-charcoal-border hover:border-pista text-charcoal text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-pista-dark" aria-hidden="true" />
              Ask on WhatsApp
            </a>
            <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-charcoal-subtle pt-1">
              <li className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-pista-dark" aria-hidden="true" /> Verified payment
              </li>
              <li className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-pista-dark" aria-hidden="true" /> Private delivery
              </li>
              <li className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-pista-dark" aria-hidden="true" /> Replacement warranty
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-surface-card border border-charcoal-border rounded-2xl overflow-hidden">
        <div role="tablist" aria-label="Product information" className="flex border-b border-charcoal-border bg-surface-muted overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              role="tab"
              type="button"
              id={`tab-${t.id}`}
              aria-selected={activeTab === t.id}
              aria-controls={`panel-${t.id}`}
              onClick={() => setActiveTab(t.id)}
              className={`min-h-12 px-4 sm:px-5 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === t.id ? 'border-pista-dark text-charcoal bg-surface-card' : 'border-transparent text-charcoal-subtle hover:text-charcoal'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`} className="p-5 sm:p-8">
          {activeTab === 'description' && (
            <div className="space-y-5">
              <p className="text-sm text-charcoal-muted leading-relaxed whitespace-pre-line">{product.longDescription || product.shortDescription}</p>
              {features.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 bg-surface-muted rounded-lg text-sm text-charcoal">
                      <Check className="w-4 h-4 text-pista-dark flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'activation' && (
            <div className="space-y-5">
              {product.requirements.length > 0 && (
                <div>
                  <h2 className="text-base font-bold text-charcoal mb-2">Requirements</h2>
                  <ul className="space-y-2">
                    {product.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-charcoal-muted">
                        <Info className="w-4 h-4 text-pista-dark mt-0.5 shrink-0" aria-hidden="true" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <h2 className="text-base font-bold text-charcoal mb-2">How to activate</h2>
                <p className="p-4 bg-surface-muted rounded-xl text-sm text-charcoal leading-relaxed whitespace-pre-line">
                  {product.usageInstructions || 'Your access details and simple steps are shown on your order page and sent to you after delivery.'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'warranty' && (
            <div className="space-y-4 max-w-3xl">
              {product.refundInfo && <p className="text-sm text-charcoal-muted leading-relaxed whitespace-pre-line">{product.refundInfo}</p>}
              <div className="p-4 bg-pista-lighter border border-pista-light rounded-xl text-sm text-charcoal space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-pista-darker">
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                  {storeName} replacement warranty
                </div>
                <p>
                  If your access stops working during the plan you paid for, contact us and we will replace it at no extra cost. Read the full{' '}
                  <Link href="/refund-policy" className="underline font-semibold">
                    Refund Policy
                  </Link>
                  .
                </p>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && <ReviewsPanel productId={product.id} reviews={reviews} />}
        </div>
      </div>

      {faqs.length > 0 && (
        <section aria-labelledby="product-faq" className="space-y-3">
          <h2 id="product-faq" className="text-xl font-bold text-charcoal">
            Questions about {product.name}
          </h2>
          {faqs.map(f => (
            <details key={f.id} className="group rounded-2xl border border-charcoal-border bg-white open:border-pista-200">
              <summary className="flex items-center justify-between gap-4 min-h-14 px-5 py-3 cursor-pointer list-none text-sm font-semibold text-charcoal">
                <span>{f.question}</span>
                <ChevronDown className="w-5 h-5 shrink-0 text-pista-dark transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <p className="px-5 pb-5 text-sm leading-relaxed text-charcoal-muted whitespace-pre-line">{f.answer}</p>
            </details>
          ))}
        </section>
      )}

      {related.length > 0 && (
        <section className="space-y-5" aria-labelledby="related-heading">
          <h2 id="related-heading" className="text-xl font-bold text-charcoal">
            You may also like
          </h2>
          <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {related.map(p => (
              <li key={p.id}>
                <ProductCard product={p} pricing={pricing} categoryName={categoryNames[p.categoryId]} rating={ratings[p.id]} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ReviewsPanel({ productId, reviews }: { productId: string; reviews: Review[] }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [state, setState] = useState<{ status: 'idle' | 'sending' | 'done' | 'error'; message?: string }>({ status: 'idle' });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setState({ status: 'sending' });
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, rating, title, comment }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not send your review');
      setState({ status: 'done' });
      setTitle('');
      setComment('');
    } catch (err) {
      setState({ status: 'error', message: (err as Error).message });
    }
  };

  return (
    <div className="space-y-6">
      {reviews.length === 0 ? (
        <p className="text-sm text-charcoal-subtle">No reviews yet.</p>
      ) : (
        <ul className="space-y-4">
          {reviews.map(r => (
            <li key={r.id} className="p-4 rounded-xl border border-charcoal-border">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-0.5" aria-label={`${r.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} aria-hidden="true" className={`w-4 h-4 ${i < r.rating ? 'fill-accent-amber text-accent-amber' : 'text-charcoal-border-dark'}`} />
                  ))}
                </div>
                <span className="text-xs text-charcoal-subtle"><LocalTime iso={r.createdAt} format="date" /></span>
              </div>
              {r.title && <p className="mt-2 text-sm font-bold text-charcoal">{r.title}</p>}
              <p className="mt-1 text-sm text-charcoal-muted leading-relaxed">{r.comment}</p>
              <p className="mt-2 text-xs text-charcoal-subtle">
                {r.customerName}
                {r.verifiedPurchase ? ' · Verified purchase' : ''}
              </p>
            </li>
          ))}
        </ul>
      )}

      <div className="pt-5 border-t border-surface-muted">
        <h2 className="text-base font-bold text-charcoal mb-3">Write a review</h2>
        {!user ? (
          <p className="text-sm text-charcoal-muted">
            <Link href="/login" className="font-bold text-pista-darker underline">
              Sign in
            </Link>{' '}
            to review this product.
          </p>
        ) : state.status === 'done' ? (
          <p role="status" className="p-3 rounded-xl bg-pista-lighter border border-pista-light text-sm text-pista-darker font-semibold">
            Thank you. Your review will appear after our team checks it.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-3 max-w-xl">
            <div className="flex items-center gap-1" role="radiogroup" aria-label="Your rating">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} star${n === 1 ? '' : 's'}`}
                  onClick={() => setRating(n)}
                  className="w-11 h-11 inline-flex items-center justify-center rounded-lg hover:bg-pista-50"
                >
                  <Star className={`w-6 h-6 ${n <= rating ? 'fill-accent-amber text-accent-amber' : 'text-charcoal-border-dark'}`} aria-hidden="true" />
                </button>
              ))}
            </div>
            <label className="block">
              <span className="text-sm font-semibold text-charcoal">Title (optional)</span>
              <input value={title} onChange={e => setTitle(e.target.value)} maxLength={120} className="mt-1 w-full min-h-11 px-3 rounded-xl border border-charcoal-border bg-surface-bg text-base sm:text-sm focus:outline-none focus:border-pista-500 focus:bg-white" />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-charcoal">Your review</span>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                required
                maxLength={2000}
                rows={4}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-charcoal-border bg-surface-bg text-base sm:text-sm focus:outline-none focus:border-pista-500 focus:bg-white"
              />
            </label>
            {state.status === 'error' && (
              <p role="alert" className="text-sm text-accent-rose">
                {state.message}
              </p>
            )}
            <button type="submit" disabled={state.status === 'sending' || !comment.trim()} className="min-h-11 px-5 rounded-xl bg-pista-dark text-white text-sm font-bold disabled:opacity-50">
              {state.status === 'sending' ? 'Sending...' : 'Submit review'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
