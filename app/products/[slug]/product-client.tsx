'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product, ProductVariant, Category } from '@/lib/db/types';
import { useCart } from '@/lib/context/cart-context';
import { ProductCard } from '@/components/product-card';
import { ProductImage } from '@/components/brand/product-image';
import { siteConfig } from '@/lib/site-config';
import { formatPrice } from '@/app/_store/price';
import { Zap, ShieldCheck, Check, ShoppingCart, ArrowRight, ChevronRight, Info, Clock, Minus, Plus, MessageCircle } from 'lucide-react';

type Tab = 'description' | 'activation' | 'warranty';

export function ProductClient({
  product,
  category,
  relatedProducts,
}: {
  product: Product;
  category: Category | null;
  relatedProducts: Product[];
}) {
  const router = useRouter();
  const { addItem } = useCart();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    product.variants[0] || {
      id: `${product.id}_default`,
      productId: product.id,
      name: 'Standard Plan',
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      sku: product.sku,
      stock: 1,
      status: 'active',
    }
  );
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<Tab>('description');
  const [addedNotice, setAddedNotice] = useState(false);

  const price = selectedVariant.price;
  const comparePrice = selectedVariant.compareAtPrice;
  const savingsPct = comparePrice && comparePrice > price ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0;
  const inStock = selectedVariant.stock > 0;

  const handleAddToCart = () => {
    addItem(product, selectedVariant, quantity);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 3000);
  };

  const handleBuyNow = () => {
    addItem(product, selectedVariant, quantity);
    router.push('/checkout');
  };

  const whatsappText = encodeURIComponent(
    `Hello ${siteConfig.name}, I want to order ${product.name} (${selectedVariant.name}).`
  );

  const tabs: { id: Tab; label: string }[] = [
    { id: 'description', label: 'Description' },
    { id: 'activation', label: 'How to activate' },
    { id: 'warranty', label: 'Warranty & refund' },
  ];

  return (
    <div className="space-y-10">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-charcoal-subtle flex-wrap">
        <Link href="/" className="hover:text-pista-dark">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        <Link href="/shop" className="hover:text-pista-dark">Shop</Link>
        <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        {category && (
          <>
            <Link href={`/categories/${category.slug}`} className="hover:text-pista-dark">{category.name}</Link>
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </>
        )}
        <span className="text-charcoal-muted font-semibold truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 bg-surface-card border border-charcoal-border rounded-2xl p-5 sm:p-8">
        <div className="lg:col-span-5 space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-charcoal-border">
            <ProductImage src={product.images[0]} name={product.name} className="aspect-square" imgClassName="p-12" />
            {savingsPct > 0 && (
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-accent-rose text-white text-xs font-bold">-{savingsPct}%</span>
            )}
            {product.badge && (
              <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-surface-card text-pista-darker text-xs font-bold border border-pista-light">
                {product.badge}
              </span>
            )}
          </div>

          <dl className="p-4 bg-surface-muted rounded-xl space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-1.5 text-charcoal-muted"><Clock className="w-4 h-4 text-pista-dark" aria-hidden="true" /> Delivery time</dt>
              <dd className="font-semibold text-charcoal">{selectedVariant.deliveryTime || product.deliveryTime}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-1.5 text-charcoal-muted"><Zap className="w-4 h-4 text-pista-dark" aria-hidden="true" /> Delivered via</dt>
              <dd className="font-semibold text-charcoal">{product.deliveryMethod}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-1.5 text-charcoal-muted"><ShieldCheck className="w-4 h-4 text-pista-dark" aria-hidden="true" /> Warranty</dt>
              <dd className="font-semibold text-charcoal">Full plan duration</dd>
            </div>
          </dl>
        </div>

        <div className="lg:col-span-7 flex flex-col gap-6">
          <div>
            <div className="text-xs text-charcoal-subtle mb-1">
              {category?.name || product.productType}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal">{product.name}</h1>
            <p className="text-sm text-charcoal-muted mt-3 leading-relaxed">{product.shortDescription}</p>
          </div>

          <div className="p-4 bg-pista-lighter border border-pista-light rounded-xl flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-charcoal">{formatPrice(price)}</span>
                {comparePrice && comparePrice > price && (
                  <span className="text-sm text-charcoal-subtle line-through">{formatPrice(comparePrice)}</span>
                )}
              </div>
              {comparePrice && comparePrice > price && (
                <div className="text-xs text-pista-darker font-semibold mt-0.5">You save {formatPrice(comparePrice - price)}</div>
              )}
            </div>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${inStock ? 'bg-surface-card text-pista-darker' : 'bg-surface-card text-accent-rose'}`}>
              {inStock ? <><Check className="w-3.5 h-3.5" aria-hidden="true" /> {selectedVariant.stock} available</> : 'Out of stock'}
            </span>
          </div>

          <fieldset>
            <legend className="text-sm font-bold text-charcoal mb-2">Choose your plan</legend>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {product.variants.map(v => {
                const isSelected = selectedVariant.id === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    aria-pressed={isSelected}
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      isSelected ? 'border-pista-dark bg-pista-lighter ring-1 ring-pista-dark' : 'border-charcoal-border hover:border-pista'
                    }`}
                  >
                    <div className="text-sm font-bold text-charcoal">{v.name}</div>
                    <div className="text-base font-extrabold text-charcoal mt-1">{formatPrice(v.price)}</div>
                    {v.compareAtPrice && v.compareAtPrice > v.price && (
                      <div className="text-xs text-charcoal-subtle line-through">{formatPrice(v.compareAtPrice)}</div>
                    )}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-charcoal" id="qty-label">Quantity</span>
            <div className="flex items-center border border-charcoal-border rounded-lg overflow-hidden" role="group" aria-labelledby="qty-label">
              <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2.5 text-charcoal hover:bg-surface-muted" aria-label="Decrease quantity">
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 text-sm font-bold text-charcoal" aria-live="polite">{quantity}</span>
              <button type="button" onClick={() => setQuantity(quantity + 1)} className="p-2.5 text-charcoal hover:bg-surface-muted" aria-label="Increase quantity">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-surface-muted">
            {addedNotice && (
              <div role="status" className="p-3 bg-pista-lighter border border-pista-light rounded-lg text-sm text-pista-darker font-semibold flex items-center justify-between gap-3">
                <span>Added to cart: {product.name} ({selectedVariant.name})</span>
                <Link href="/cart" className="underline font-bold whitespace-nowrap">View cart</Link>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!inStock}
                className="w-full py-3.5 px-4 bg-surface-card border-2 border-pista-dark text-pista-darker hover:bg-pista-lighter text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ShoppingCart className="w-4 h-4" aria-hidden="true" />
                Add to Cart
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!inStock}
                className="w-full py-3.5 px-4 bg-pista-dark text-white hover:bg-pista-darker text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                Buy Now
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <a
              href={`${siteConfig.whatsappHref}?text=${whatsappText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 border border-charcoal-border hover:border-pista text-charcoal text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-pista-dark" aria-hidden="true" />
              Order on WhatsApp
            </a>
            <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-charcoal-subtle pt-1">
              <li className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-pista-dark" aria-hidden="true" /> Protected checkout</li>
              <li className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-pista-dark" aria-hidden="true" /> Private delivery</li>
              <li className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-pista-dark" aria-hidden="true" /> Replacement warranty</li>
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
              id={`tab-${t.id}`}
              aria-selected={activeTab === t.id}
              aria-controls={`panel-${t.id}`}
              onClick={() => setActiveTab(t.id)}
              className={`px-5 py-3.5 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === t.id ? 'border-pista-dark text-charcoal bg-surface-card' : 'border-transparent text-charcoal-subtle hover:text-charcoal'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`} className="p-6 sm:p-8">
          {activeTab === 'description' && (
            <div className="space-y-5">
              <p className="text-sm text-charcoal-muted leading-relaxed">{product.longDescription}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {product.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-3 bg-surface-muted rounded-lg text-sm text-charcoal">
                    <Check className="w-4 h-4 text-pista-dark flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'activation' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-charcoal mb-2">Requirements</h2>
                <ul className="space-y-2">
                  {product.requirements.map((req, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-charcoal-muted">
                      <Info className="w-4 h-4 text-pista-dark" aria-hidden="true" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="text-base font-bold text-charcoal mb-2">How to activate</h2>
                <p className="p-4 bg-surface-muted rounded-xl text-sm text-charcoal leading-relaxed">{product.usageInstructions}</p>
              </div>
            </div>
          )}

          {activeTab === 'warranty' && (
            <div className="space-y-4 max-w-3xl">
              <p className="text-sm text-charcoal-muted leading-relaxed">{product.refundInfo}</p>
              <div className="p-4 bg-pista-lighter border border-pista-light rounded-xl text-sm text-charcoal space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-pista-darker">
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                  {siteConfig.name} replacement warranty
                </div>
                <p>
                  If your access stops working during the plan you paid for, contact us and we will replace it at no extra cost.
                  Read the full <Link href="/refund-policy" className="underline font-semibold">Refund Policy</Link>.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section className="space-y-5" aria-labelledby="related-heading">
          <h2 id="related-heading" className="text-xl font-bold text-charcoal">You may also like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
