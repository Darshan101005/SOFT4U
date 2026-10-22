import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  Lock,
  MessageCircle,
  RefreshCw,
  Search,
  Star,
  Wallet,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Hero } from '@/components/home/hero';
import { SectionHeading } from '@/components/home/section-heading';
import { HomeProductCard } from '@/components/home/home-product-card';
import { ProductImage } from '@/components/brand/product-image';
import { howItWorks, whyChooseUs, reviews, homeFaqs } from '@/components/home/content';
import { categories, getCategoryById } from '@/data/categories';
import { products, getProductsByCategory } from '@/data/products';
import { siteConfig } from '@/lib/site-config';

const whyIcons: Record<string, LucideIcon> = {
  Zap,
  BadgeCheck,
  Wallet,
  RefreshCw,
  Lock,
  MessageCircle,
};

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default function HomePage() {
  const activeProducts = products.filter(p => p.status === 'active');
  const activeCategories = categories
    .filter(c => c.status === 'active')
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const newlyAdded = activeProducts.filter(p => p.isNew).slice(0, 4);
  const bestSelling = [
    ...activeProducts.filter(p => p.bestseller || p.featured),
    ...activeProducts.filter(p => !p.bestseller && !p.featured),
  ].slice(0, 8);

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg text-charcoal">
      <Header />

      <main className="flex-1">
        <Hero />

        {/* Categories */}
        <section aria-labelledby="categories-title" className="py-14 sm:py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <SectionHeading
              id="categories-title"
              kicker="Shop by category"
              title="All Subscriptions at One Place"
              subtitle="Streaming, music, AI, VPN, antivirus and creative software in one store."
              action={{ label: 'View all categories', href: '/categories' }}
            />
            <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {activeCategories.map(cat => {
                const count = getProductsByCategory(cat.id).length;
                return (
                  <li key={cat.id}>
                    <Link
                      href={`/categories/${cat.slug}`}
                      className="group flex flex-col h-full rounded-2xl border border-charcoal-border bg-pista-50 hover:bg-pista-lighter hover:border-pista transition-colors overflow-hidden"
                    >
                      <ProductImage
                        src={cat.image}
                        name={cat.name}
                        className="aspect-[16/9] w-full"
                        imgClassName="p-5 sm:p-6"
                      />
                      <div className="p-3 sm:p-4">
                        <h3 className="text-sm font-bold text-charcoal group-hover:text-pista-darker">{cat.name}</h3>
                        <p className="mt-0.5 text-xs text-charcoal-subtle">
                          {count} {count === 1 ? 'product' : 'products'}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Newly added */}
        {newlyAdded.length > 0 && (
          <section aria-labelledby="new-title" className="py-14 sm:py-16 px-4 sm:px-6 lg:px-8 bg-pista-50 border-y border-charcoal-border">
            <div className="max-w-7xl mx-auto">
              <SectionHeading
                id="new-title"
                kicker="Newly added"
                title="Fresh access this week"
                action={{ label: 'See new access', href: '/shop' }}
              />
              <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
                {newlyAdded.map(product => (
                  <li key={product.id}>
                    <HomeProductCard product={product} category={getCategoryById(product.categoryId)} />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* All digital access / best selling */}
        <section aria-labelledby="all-title" className="py-14 sm:py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-pista-dark mb-2">All digital access</p>
                <h2 id="all-title" className="text-2xl sm:text-3xl font-extrabold tracking-tight text-charcoal">
                  Explore the complete collection
                </h2>
                <p className="mt-2 text-sm sm:text-base text-charcoal-muted">
                  Best-selling plans &middot; {activeProducts.length} available
                </p>
              </div>
              <form action="/shop" method="get" role="search" className="w-full lg:w-80">
                <label htmlFor="home-search" className="sr-only">
                  Search products
                </label>
                <div className="flex items-center gap-2 h-12 px-4 rounded-2xl border border-charcoal-border-dark bg-white focus-within:border-pista-500">
                  <Search className="w-4 h-4 text-charcoal-subtle shrink-0" aria-hidden="true" />
                  <input
                    id="home-search"
                    name="q"
                    type="search"
                    placeholder="Search products"
                    className="flex-1 min-w-0 h-full bg-transparent text-base sm:text-sm outline-none text-charcoal placeholder:text-charcoal-subtle"
                  />
                </div>
              </form>
            </div>

            <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {bestSelling.map(product => (
                <li key={product.id}>
                  <HomeProductCard product={product} category={getCategoryById(product.categoryId)} />
                </li>
              ))}
            </ul>

            <div className="mt-10 flex justify-center">
              <Link
                href="/shop"
                className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-2xl bg-pista border border-pista-500 text-charcoal text-sm font-bold hover:bg-pista-hover transition-colors"
              >
                View all {activeProducts.length} products
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section aria-labelledby="how-title" className="py-14 sm:py-16 px-4 sm:px-6 lg:px-8 bg-pista-50 border-y border-charcoal-border">
          <div className="max-w-7xl mx-auto">
            <SectionHeading
              id="how-title"
              kicker="How it works"
              title="Get your subscription in 4 simple steps"
              subtitle="From checkout to access in minutes."
              align="center"
            />
            <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {howItWorks.map(step => (
                <li key={step.step} className="rounded-2xl border border-charcoal-border bg-white p-6">
                  <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-pista-100 text-pista-darker text-sm font-extrabold">
                    {step.step}
                  </span>
                  <h3 className="mt-4 text-base font-bold text-charcoal">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-charcoal-muted">{step.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Why choose us */}
        <section aria-labelledby="why-title" className="py-14 sm:py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <SectionHeading
              id="why-title"
              kicker={`Why ${siteConfig.name}`}
              title="Why customers choose us"
              align="center"
            />
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {whyChooseUs.map(item => {
                const Icon = whyIcons[item.icon] ?? BadgeCheck;
                return (
                  <li key={item.title} className="flex items-start gap-4 rounded-2xl border border-charcoal-border bg-pista-50 p-5 sm:p-6">
                    <span className="w-11 h-11 shrink-0 rounded-xl bg-white border border-pista-200 text-pista-dark flex items-center justify-center">
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

        {/* Reviews */}
        <section aria-labelledby="reviews-title" className="py-14 sm:py-16 px-4 sm:px-6 lg:px-8 bg-pista-50 border-y border-charcoal-border">
          <div className="max-w-7xl mx-auto">
            <SectionHeading
              id="reviews-title"
              kicker="Reviews"
              title="What our customers say"
              align="center"
            />
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {reviews.map(review => (
                <li key={review.name} className="flex flex-col rounded-2xl border border-charcoal-border bg-white p-6">
                  <div className="flex items-center gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        aria-hidden="true"
                        className={`w-4 h-4 ${
                          i < review.rating ? 'fill-accent-amber text-accent-amber' : 'text-charcoal-border-dark'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-charcoal">&ldquo;{review.text}&rdquo;</p>
                  <div className="mt-auto pt-4 flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-pista-100 text-pista-darker flex items-center justify-center text-sm font-bold">
                      {review.name.charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-charcoal">{review.name}</div>
                      <div className="text-xs text-charcoal-subtle truncate">
                        {review.city} &middot; {review.product}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq-title" className="py-14 sm:py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-3xl mx-auto">
            <SectionHeading
              id="faq-title"
              kicker="FAQ"
              title="Frequently asked questions"
              align="center"
            />
            <div className="space-y-3">
              {homeFaqs.map(faq => (
                <details
                  key={faq.q}
                  className="group rounded-2xl border border-charcoal-border bg-pista-50 open:bg-white open:border-pista-200 transition-colors"
                >
                  <summary className="flex items-center justify-between gap-4 min-h-14 px-5 py-3 cursor-pointer list-none text-sm sm:text-base font-semibold text-charcoal">
                    <span>{faq.q}</span>
                    <ChevronDown
                      className="w-5 h-5 shrink-0 text-pista-dark transition-transform group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <p className="px-5 pb-5 text-sm leading-relaxed text-charcoal-muted">{faq.a}</p>
                </details>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                href="/faq"
                className="inline-flex items-center gap-1.5 min-h-11 text-sm font-semibold text-pista-dark hover:text-pista-darker"
              >
                See all FAQs
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section aria-labelledby="cta-title" className="px-4 sm:px-6 lg:px-8 pb-16 bg-white">
          <div className="max-w-7xl mx-auto rounded-3xl border border-pista-200 bg-gradient-to-br from-pista-100 via-pista-50 to-pista-accent px-6 py-12 sm:px-12 text-center">
            <h2 id="cta-title" className="text-2xl sm:text-3xl font-extrabold tracking-tight text-charcoal">
              Ready to get your subscription?
            </h2>
            <p className="mt-3 text-sm sm:text-base text-charcoal-muted max-w-xl mx-auto">
              Browse plans in {siteConfig.currency} and get instant delivery on email and WhatsApp. Need help choosing? Message us.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/shop"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-14 px-7 rounded-2xl bg-pista border border-pista-500 text-charcoal text-base font-bold hover:bg-pista-hover transition-colors"
              >
                Shop Now
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </Link>
              <a
                href={siteConfig.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-14 px-7 rounded-2xl bg-white border border-charcoal-border-dark text-charcoal text-base font-bold hover:border-pista-500 transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-pista-dark" aria-hidden="true" />
                WhatsApp us
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
