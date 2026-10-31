import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ChevronDown, MessageCircle, Search, Star } from 'lucide-react';
import { iconFor } from '@/components/icon-map';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Hero, type HeroSettings } from '@/components/home/hero';
import { SectionHeading } from '@/components/home/section-heading';
import { ProductCard } from '@/components/product-card';
import { CategoryTile } from '@/components/category-tile';
import { db } from '@/lib/db';
import type { Category, HomepageSection, Product } from '@/lib/db/types';
import { getPricing, getSettings, getStoreInfo, safe } from '@/app/_store/storefront';
import { siteConfig } from '@/lib/site-config';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const title = s?.seoDefaults?.title || `${siteConfig.name} – Digital Subscriptions, OTT & Software`;
  const description = s?.seoDefaults?.description || s?.description || siteConfig.description;
  return {
    title: { absolute: title },
    description,
    keywords: s?.seoDefaults?.keywords,
    alternates: { canonical: '/' },
    openGraph: { title, description, url: '/', type: 'website', images: [{ url: s?.seoDefaults?.ogImage || '/hero/soft4u-hero.png', alt: `${siteConfig.name} digital store` }] },
    twitter: { card: 'summary_large_image', title, description, images: [s?.seoDefaults?.ogImage || '/hero/soft4u-hero.png'] },
  };
}

const DEFAULT_SECTIONS: HomepageSection[] = [
  { id: 'd_hero', type: 'hero', name: 'Hero', enabled: true, order: 1, settings: {} },
  { id: 'd_cat', type: 'categories', name: 'Categories', enabled: true, order: 2, settings: { title: 'Shop by category' } },
  { id: 'd_new', type: 'new_arrivals', name: 'Newly added', enabled: true, order: 3, settings: { title: 'Newly added', limit: 8 } },
  { id: 'd_all', type: 'all_products', name: 'All', enabled: true, order: 4, settings: { title: 'All digital access', subtitle: 'Explore the complete collection.' } },
  { id: 'd_faq', type: 'faq', name: 'FAQ', enabled: true, order: 5, settings: { title: 'Frequently asked questions', limit: 6 } },
];

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' && v.trim() ? v : fallback;
}

function limitOf(s: HomepageSection, fallback: number): number {
  const n = Number(s.settings?.limit);
  return Number.isFinite(n) && n > 0 ? Math.min(24, n) : fallback;
}

export default async function HomePage() {
  const [sectionsRaw, products, categories, ratings, faqs, testimonials, reviews, banners, pricing, store] = await Promise.all([
    safe(() => db.getHomepageSections(), []),
    safe(() => db.getProducts(true), [] as Product[]),
    safe(() => db.getCategories(true), [] as Category[]),
    safe(() => db.getRatingSummaries(), {} as Record<string, { average: number; count: number }>),
    safe(() => db.getFAQs(true), []),
    safe(() => db.getTestimonials(true), []),
    safe(() => db.getReviews(), []),
    safe(() => db.getBanners(true), []),
    getPricing(),
    getStoreInfo(),
  ]);

  const sections = (sectionsRaw.length ? sectionsRaw : DEFAULT_SECTIONS).filter(s => s.enabled).sort((a, b) => a.order - b.order);
  const activeCategories = [...categories].sort((a, b) => a.displayOrder - b.displayOrder);
  const catName = new Map(activeCategories.map(c => [c.id, c.name]));
  const countByCat = new Map<string, number>();
  for (const p of products) countByCat.set(p.categoryId, (countByCat.get(p.categoryId) || 0) + 1);
  const ordered = [...products].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  const grid = (list: Product[]) => (
    <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
      {list.map(product => (
        <li key={product.id}>
          <ProductCard product={product} pricing={pricing} categoryName={catName.get(product.categoryId)} rating={ratings[product.id]} />
        </li>
      ))}
    </ul>
  );

  const productSection = (s: HomepageSection, list: Product[], kicker: string, action: { label: string; href: string }, tinted: boolean) => {
    if (list.length === 0) return null;
    return (
      <section key={s.id} aria-labelledby={`${s.id}-title`} className={`py-12 sm:py-16 px-4 sm:px-6 lg:px-8 ${tinted ? 'bg-pista-50 border-y border-charcoal-border' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          <SectionHeading id={`${s.id}-title`} kicker={kicker} title={str(s.settings?.title, s.name)} subtitle={str(s.settings?.subtitle) || undefined} action={action} />
          {grid(list)}
        </div>
      </section>
    );
  };

  // Alternate white / tinted backgrounds between content sections.
  const TINTABLE = new Set(['categories', 'new_arrivals', 'featured_products', 'bestsellers', 'all_products', 'how_it_works', 'benefits', 'reviews', 'testimonials']);
  const tintOf = new Map<string, boolean>();
  let flip = false;
  for (const s of sections) {
    if (!TINTABLE.has(s.type)) continue;
    flip = !flip;
    tintOf.set(s.id, flip);
  }

  const rendered = sections.map(s => {
    const settings = s.settings || {};
    const tint = tintOf.get(s.id) ?? false;
    switch (s.type) {
      case 'hero':
        return <Hero key={s.id} settings={settings as HeroSettings} />;

      case 'trust_bar': {
        const items: Array<{ icon?: string; title: string; desc?: string }> = Array.isArray(settings.items) ? settings.items : [];
        if (!items.length) return null;
        return (
          <section key={s.id} aria-label="Why shop with us" className="bg-white border-b border-charcoal-border px-4 sm:px-6 lg:px-8 py-5">
            <ul className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
              {items.map(item => {
                const Icon = iconFor(item.icon);
                return (
                  <li key={item.title} className="flex items-start gap-3 min-w-0">
                    <span className="w-10 h-10 shrink-0 rounded-xl bg-pista-100 text-pista-dark flex items-center justify-center">
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-charcoal">{item.title}</div>
                      {item.desc && <div className="text-xs text-charcoal-subtle break-words">{item.desc}</div>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      }

      case 'categories': {
        if (!activeCategories.length) return null;
        return (
          <section key={s.id} aria-labelledby={`${s.id}-title`} className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-white">
            <div className="max-w-7xl mx-auto">
              <SectionHeading
                id={`${s.id}-title`}
                kicker="Shop by category"
                title={str(settings.title, 'All Subscriptions at One Place')}
                subtitle={str(settings.subtitle) || undefined}
                action={{ label: 'View all categories', href: '/categories' }}
              />
              <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                {activeCategories.map(cat => (
                  <li key={cat.id}>
                    <CategoryTile category={cat} count={countByCat.get(cat.id) || 0} />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        );
      }

      case 'new_arrivals':
        return productSection(s, ordered.filter(p => p.isNew).slice(0, limitOf(s, 8)), 'Newly added', { label: 'See new access', href: '/shop?new=1' }, tint);

      case 'featured_products':
        return productSection(s, ordered.filter(p => p.featured).slice(0, limitOf(s, 8)), 'Featured', { label: 'See featured', href: '/shop?featured=1' }, tint);

      case 'bestsellers':
        return productSection(s, ordered.filter(p => p.bestseller).slice(0, limitOf(s, 8)), 'Best sellers', { label: 'See best sellers', href: '/shop?sort=best_selling' }, tint);

      case 'all_products': {
        if (!ordered.length) return null;
        const list = [...ordered.filter(p => p.bestseller || p.featured), ...ordered.filter(p => !p.bestseller && !p.featured)].slice(0, limitOf(s, 8));
        return (
          <section key={s.id} aria-labelledby={`${s.id}-title`} className={`py-12 sm:py-16 px-4 sm:px-6 lg:px-8 ${tint ? 'bg-pista-50 border-y border-charcoal-border' : 'bg-white'}`}>
            <div className="max-w-7xl mx-auto">
              <div className="mb-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-pista-dark mb-2">{str(settings.title, 'All digital access')}</p>
                  <h2 id={`${s.id}-title`} className="text-2xl sm:text-3xl font-extrabold tracking-tight text-charcoal">
                    {str(settings.subtitle, 'Explore the complete collection')}
                  </h2>
                  <p className="mt-2 text-sm sm:text-base text-charcoal-muted">{ordered.length} available</p>
                </div>
                <form action="/shop" method="get" role="search" className="w-full lg:w-80">
                  <label htmlFor="home-search" className="sr-only">
                    Search products
                  </label>
                  <div className="flex items-center gap-2 h-12 px-4 rounded-2xl border border-charcoal-border-dark bg-white focus-within:border-pista-500">
                    <Search className="w-4 h-4 text-charcoal-subtle shrink-0" aria-hidden="true" />
                    <input id="home-search" name="q" type="search" placeholder="Search products" className="flex-1 min-w-0 h-full bg-transparent text-base sm:text-sm outline-none text-charcoal placeholder:text-charcoal-subtle" />
                  </div>
                </form>
              </div>
              {grid(list)}
              <div className="mt-10 flex justify-center">
                <Link href="/shop" className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-2xl bg-pista border border-pista-500 text-charcoal text-sm font-bold hover:bg-pista-hover transition-colors">
                  View all {ordered.length} products
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </section>
        );
      }

      case 'banner': {
        const list = banners.filter(b => !b.position || b.position.includes('home')).slice(0, 2);
        if (!list.length) return null;
        return (
          <section key={s.id} aria-label="Offers" className="px-4 sm:px-6 lg:px-8 py-8 bg-white">
            <div className={`max-w-7xl mx-auto grid gap-4 ${list.length > 1 ? 'md:grid-cols-2' : ''}`}>
              {list.map(b => {
                const inner = (
                  <div className="relative overflow-hidden rounded-3xl border border-pista-200 bg-pista-100 min-h-40">
                    <picture>
                      {b.mobileImage && <source media="(max-width: 640px)" srcSet={b.mobileImage} />}
                        <img src={b.image} alt={b.title} loading="lazy" className="w-full h-full object-cover" />
                    </picture>
                    {(b.ctaText || b.subtitle) && (
                      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-night/70 to-transparent text-white">
                        <div className="text-base font-bold">{b.title}</div>
                        {b.subtitle && <div className="text-xs opacity-90">{b.subtitle}</div>}
                        {b.ctaText && <span className="mt-2 inline-flex min-h-11 items-center px-4 rounded-xl bg-pista text-charcoal text-sm font-bold">{b.ctaText}</span>}
                      </div>
                    )}
                  </div>
                );
                return b.url ? (
                  <Link key={b.id} href={b.url}>
                    {inner}
                  </Link>
                ) : (
                  <div key={b.id}>{inner}</div>
                );
              })}
            </div>
          </section>
        );
      }

      case 'how_it_works': {
        const steps: Array<{ step?: string; title: string; desc: string }> = Array.isArray(settings.steps) ? settings.steps : [];
        if (!steps.length) return null;
        return (
          <section key={s.id} aria-labelledby={`${s.id}-title`} className={`py-12 sm:py-16 px-4 sm:px-6 lg:px-8 ${tint ? 'bg-pista-50 border-y border-charcoal-border' : 'bg-white'}`}>
            <div className="max-w-7xl mx-auto">
              <SectionHeading id={`${s.id}-title`} kicker="How it works" title={str(settings.title, 'How ordering works')} subtitle={str(settings.subtitle) || undefined} align="center" />
              <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {steps.map((step, i) => (
                  <li key={step.title} className="rounded-2xl border border-charcoal-border bg-white p-6">
                    <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-pista-100 text-pista-darker text-sm font-extrabold">
                      {step.step || String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="mt-4 text-base font-bold text-charcoal">{step.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-charcoal-muted">{step.desc}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        );
      }

      case 'benefits': {
        const items: Array<{ icon?: string; title: string; desc: string }> = Array.isArray(settings.items) ? settings.items : [];
        if (!items.length) return null;
        return (
          <section key={s.id} aria-labelledby={`${s.id}-title`} className={`py-12 sm:py-16 px-4 sm:px-6 lg:px-8 ${tint ? 'bg-pista-50 border-y border-charcoal-border' : 'bg-white'}`}>
            <div className="max-w-7xl mx-auto">
              <SectionHeading id={`${s.id}-title`} kicker={`Why ${store.name}`} title={str(settings.title, 'Why customers choose us')} subtitle={str(settings.subtitle) || undefined} align="center" />
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {items.map(item => {
                  const Icon = iconFor(item.icon);
                  return (
                    <li key={item.title} className="flex items-start gap-4 rounded-2xl border border-charcoal-border bg-white p-5 sm:p-6">
                      <span className="w-11 h-11 shrink-0 rounded-xl bg-pista-50 border border-pista-200 text-pista-dark flex items-center justify-center">
                        <Icon className="w-5 h-5" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-charcoal">{item.title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-charcoal-muted">{item.desc}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        );
      }

      case 'reviews': {
        const list = reviews.filter(r => r.status === 'approved').sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.createdAt.localeCompare(a.createdAt)).slice(0, limitOf(s, 6));
        if (!list.length) return null;
        const productName = new Map(products.map(p => [p.id, p.name]));
        return (
          <section key={s.id} aria-labelledby={`${s.id}-title`} className={`py-12 sm:py-16 px-4 sm:px-6 lg:px-8 ${tint ? 'bg-pista-50 border-y border-charcoal-border' : 'bg-white'}`}>
            <div className="max-w-7xl mx-auto">
              <SectionHeading id={`${s.id}-title`} kicker="Reviews" title={str(settings.title, 'What customers say')} subtitle={str(settings.subtitle) || undefined} align="center" />
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {list.map(review => (
                  <li key={review.id} className="flex flex-col rounded-2xl border border-charcoal-border bg-white p-6">
                    <Stars rating={review.rating} />
                    {review.title && <p className="mt-3 text-sm font-bold text-charcoal">{review.title}</p>}
                    <p className="mt-1 text-sm leading-relaxed text-charcoal">&ldquo;{review.comment}&rdquo;</p>
                    <div className="mt-auto pt-4 flex items-center gap-3">
                      <span className="w-10 h-10 rounded-full bg-pista-100 text-pista-darker flex items-center justify-center text-sm font-bold">{review.customerName.charAt(0)}</span>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-charcoal">{review.customerName}</div>
                        <div className="text-xs text-charcoal-subtle truncate">
                          {productName.get(review.productId) || ''}
                          {review.verifiedPurchase ? ' · Verified purchase' : ''}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        );
      }

      case 'testimonials': {
        const list = testimonials.sort((a, b) => a.displayOrder - b.displayOrder).slice(0, limitOf(s, 6));
        if (!list.length) return null;
        return (
          <section key={s.id} aria-labelledby={`${s.id}-title`} className={`py-12 sm:py-16 px-4 sm:px-6 lg:px-8 ${tint ? 'bg-pista-50 border-y border-charcoal-border' : 'bg-white'}`}>
            <div className="max-w-7xl mx-auto">
              <SectionHeading id={`${s.id}-title`} kicker="Testimonials" title={str(settings.title, 'Loved by our customers')} subtitle={str(settings.subtitle) || undefined} align="center" />
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {list.map(t => (
                  <li key={t.id} className="flex flex-col rounded-2xl border border-charcoal-border bg-white p-6">
                    <Stars rating={t.rating} />
                    <p className="mt-3 text-sm leading-relaxed text-charcoal">&ldquo;{t.content}&rdquo;</p>
                    <div className="mt-auto pt-4">
                      <div className="text-sm font-bold text-charcoal">{t.name}</div>
                      {t.roleOrCompany && <div className="text-xs text-charcoal-subtle">{t.roleOrCompany}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        );
      }

      case 'faq': {
        const list = faqs.filter(f => !f.productId).sort((a, b) => a.displayOrder - b.displayOrder).slice(0, limitOf(s, 6));
        if (!list.length) return null;
        return (
          <section key={s.id} aria-labelledby={`${s.id}-title`} className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-white">
            <div className="max-w-3xl mx-auto">
              <SectionHeading id={`${s.id}-title`} kicker="FAQ" title={str(settings.title, 'Frequently asked questions')} subtitle={str(settings.subtitle) || undefined} align="center" />
              <div className="space-y-3">
                {list.map(faq => (
                  <details key={faq.id} className="group rounded-2xl border border-charcoal-border bg-pista-50 open:bg-white open:border-pista-200 transition-colors">
                    <summary className="flex items-center justify-between gap-4 min-h-14 px-5 py-3 cursor-pointer list-none text-sm sm:text-base font-semibold text-charcoal">
                      <span>{faq.question}</span>
                      <ChevronDown className="w-5 h-5 shrink-0 text-pista-dark transition-transform group-open:rotate-180" aria-hidden="true" />
                    </summary>
                    <p className="px-5 pb-5 text-sm leading-relaxed text-charcoal-muted whitespace-pre-line">{faq.answer}</p>
                  </details>
                ))}
              </div>
              <div className="mt-8 text-center">
                <Link href="/faq" className="inline-flex items-center gap-1.5 min-h-11 text-sm font-semibold text-pista-dark hover:text-pista-darker">
                  See all FAQs
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </section>
        );
      }

      case 'cta':
        return (
          <section key={s.id} aria-labelledby={`${s.id}-title`} className="px-4 sm:px-6 lg:px-8 py-12 sm:pb-16 bg-white">
            <div className="max-w-7xl mx-auto rounded-3xl border border-pista-200 bg-gradient-to-br from-pista-100 via-pista-50 to-pista-accent px-5 py-10 sm:px-12 sm:py-12 text-center">
              <h2 id={`${s.id}-title`} className="text-2xl sm:text-3xl font-extrabold tracking-tight text-charcoal">
                {str(settings.title, 'Ready to order?')}
              </h2>
              <p className="mt-3 text-sm sm:text-base text-charcoal-muted max-w-xl mx-auto">{str(settings.subtitle, 'Browse the catalogue and get your access today.')}</p>
              <div className="mt-8 grid grid-cols-1 sm:flex items-center justify-center gap-3">
                <Link
                  href={str(settings.ctaUrl, '/shop')}
                  className="inline-flex items-center justify-center gap-2 h-12 sm:h-14 px-7 rounded-2xl bg-pista border border-pista-500 text-charcoal text-base font-bold hover:bg-pista-hover transition-colors"
                >
                  {str(settings.ctaText, 'Browse products')}
                  <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </Link>
                <a
                  href={store.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 h-12 sm:h-14 px-7 rounded-2xl bg-white border border-charcoal-border-dark text-charcoal text-base font-bold hover:border-pista-500 transition-colors"
                >
                  <MessageCircle className="w-5 h-5 text-pista-dark" aria-hidden="true" />
                  WhatsApp us
                </a>
              </div>
            </div>
          </section>
        );

      default:
        return null;
    }
  });

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg text-charcoal">
      <Header />
      <main className="flex-1">{rendered}</main>
      <Footer />
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} aria-hidden="true" className={`w-4 h-4 ${i < Math.round(rating) ? 'fill-accent-amber text-accent-amber' : 'text-charcoal-border-dark'}`} />
      ))}
    </div>
  );
}
