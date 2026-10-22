import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { heroHighlights } from '@/components/home/content';

const HERO_IMAGE = '/hero/soft4u-hero.png';

/**
 * Homepage hero: wide pistachio scene
 * (laptop + app icons) with the headline on the left.
 * - xl and up: the scene is the full-bleed background, copy sits on its empty left side.
 * - below xl: copy first, then the scene as its own block so text never overlaps the icons.
 */
export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-pista-50 border-b border-charcoal-border">
      <Image
        src={HERO_IMAGE}
        alt=""
        fill
        priority
        sizes="100vw"
        className="hidden xl:block -z-10 object-cover object-right animate-fade"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:min-h-[clamp(520px,calc(100svh_-_4rem),680px)] flex items-center pt-10 pb-4 sm:pt-14 xl:py-16">
        <div className="w-full max-w-2xl xl:max-w-[540px] animate-rise">
          <div className="inline-flex items-center gap-2.5 rounded-full px-4 py-2 bg-white/90 border border-charcoal-border text-sm font-semibold text-charcoal-muted shadow-sm">
            <span className="w-5 h-5 rounded-full inline-flex items-center justify-center bg-gradient-to-br from-pista-200 to-pista-500 text-white">
              <Sparkles className="w-3 h-3" aria-hidden="true" />
            </span>
            Instant delivery on email &amp; WhatsApp
          </div>

          <h1
            id="hero-title"
            className="mt-6 mb-4 text-[length:clamp(2.4rem,6vw,4.75rem)] leading-[0.98] tracking-[-0.05em] font-extrabold text-charcoal"
          >
            Premium Digital
            <br />
            Products, <span className="text-pista-dark">Instantly.</span>
          </h1>

          <p className="max-w-[520px] text-base sm:text-lg leading-relaxed text-charcoal-muted">
            Software licences, subscriptions, accounts and more, delivered quickly, safely and at the best prices.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 h-14 px-7 rounded-2xl bg-pista border border-pista-500 text-charcoal text-base font-bold shadow-[0_12px_26px_rgba(79,122,51,0.22)] hover:bg-pista-hover transition-colors"
            >
              Shop Now
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </Link>
            <Link
              href="/categories"
              className="inline-flex items-center justify-center h-14 px-7 rounded-2xl bg-white border border-charcoal-border-dark text-charcoal text-base font-bold hover:border-pista-500 hover:bg-pista-lighter transition-colors"
            >
              Explore Categories
            </Link>
          </div>

          <ul className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-charcoal-muted">
            {heroHighlights.map((item, idx) => (
              <li key={item} className="inline-flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-pista-500 animate-pulse' : 'bg-pista-300'}`}
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Scene block for screens below xl */}
      <div className="xl:hidden relative w-full aspect-[4/3] sm:aspect-[1801/873] animate-fade">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[85%_center] sm:object-center"
        />
      </div>
    </section>
  );
}
