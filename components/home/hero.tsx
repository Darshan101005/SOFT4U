import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

const HERO_IMAGE = '/hero/soft4u-hero.png';

export interface HeroSettings {
  kicker?: string;
  headline?: string;
  subheadline?: string;
  primaryCtaText?: string;
  primaryCtaUrl?: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
  highlights?: string[];
  image?: string;
}

/**
 * Homepage hero (copy from Admin → Homepage → Hero).
 * - xl and up: the scene is the full-bleed background, copy sits on its empty left side.
 * - below xl: a compact scene block sits ABOVE the headline so the image is visible in the
 *   first phone viewport; the two buttons sit side by side.
 */
export function Hero({ settings = {} }: { settings?: HeroSettings }) {
  // next/image only accepts local files and the configured Cloudinary account.
  const custom = settings.image || '';
  const image = custom.startsWith('/') || custom.startsWith('https://res.cloudinary.com/qvjuu1ao/') ? custom : HERO_IMAGE;
  const headline = (settings.headline || 'Premium Digital Products, Instantly.').trim();
  const words = headline.split(' ');
  const lead = words.length > 2 ? words.slice(0, -2).join(' ') : '';
  const tail = words.length > 2 ? words.slice(-2).join(' ') : headline;
  const sub = settings.subheadline || 'Software licences, subscriptions, accounts and more, delivered quickly, safely and at the best prices.';
  const primary = { text: settings.primaryCtaText || 'Shop Now', url: settings.primaryCtaUrl || '/shop' };
  const secondary = { text: settings.secondaryCtaText || 'Explore Categories', url: settings.secondaryCtaUrl || '/categories' };
  const highlights = Array.isArray(settings.highlights) && settings.highlights.length ? settings.highlights : ['Store live', 'Verified payments', 'Private delivery'];

  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-pista-50 border-b border-charcoal-border">
      <Image src={image} alt="" fill priority sizes="100vw" className="hidden xl:block -z-10 object-cover object-right animate-fade" />

      {/* Compact scene for screens below xl, shown first */}
      <div className="xl:hidden relative w-full aspect-[16/9] sm:aspect-[1801/873] max-h-[46svh] sm:max-h-none animate-fade">
        <Image src={image} alt="" fill priority sizes="100vw" className="object-cover object-[85%_center] sm:object-center" />
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-pista-50 to-transparent" aria-hidden="true" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:min-h-[clamp(520px,calc(100svh_-_4rem),680px)] flex items-center pt-2 pb-8 sm:pt-8 sm:pb-10 xl:py-16">
        <div className="w-full max-w-2xl xl:max-w-[540px] animate-rise">
          {(

            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 bg-white/90 border border-charcoal-border text-xs sm:text-sm font-semibold text-charcoal-muted shadow-sm">
              <span className="w-5 h-5 rounded-full inline-flex items-center justify-center bg-gradient-to-br from-pista-200 to-pista-500 text-white">
                <Sparkles className="w-3 h-3" aria-hidden="true" />
              </span>
              {settings.kicker || 'Private delivery after payment verification'}
            </div>
          )}

          <h1
            id="hero-title"
            className="mt-4 sm:mt-6 mb-3 sm:mb-4 text-[length:clamp(2rem,7.5vw,4.75rem)] leading-[1.02] tracking-[-0.04em] font-extrabold text-charcoal"
          >
            {lead && (
              <>
                {lead}
                <br className="hidden sm:block" />{' '}
              </>
            )}
            <span className="text-pista-dark">{tail}</span>
          </h1>

          <p className="max-w-[520px] text-sm sm:text-lg leading-relaxed text-charcoal-muted">{sub}</p>

          <div className="mt-5 sm:mt-8 grid grid-cols-2 sm:flex sm:flex-row gap-2.5 sm:gap-4">
            <Link
              href={primary.url}
              className="inline-flex items-center justify-center gap-1.5 sm:gap-2 h-12 sm:h-14 px-3 sm:px-7 rounded-2xl bg-pista border border-pista-500 text-charcoal text-sm sm:text-base font-bold shadow-[0_12px_26px_rgba(79,122,51,0.22)] hover:bg-pista-hover transition-colors"
            >
              <span className="truncate">{primary.text}</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" aria-hidden="true" />
            </Link>
            <Link
              href={secondary.url}
              className="inline-flex items-center justify-center h-12 sm:h-14 px-3 sm:px-7 rounded-2xl bg-white border border-charcoal-border-dark text-charcoal text-sm sm:text-base font-bold hover:border-pista-500 hover:bg-pista-lighter transition-colors"
            >
              <span className="truncate">{secondary.text}</span>
            </Link>
          </div>

          <ul className="mt-5 sm:mt-7 flex flex-wrap items-center gap-x-4 sm:gap-x-5 gap-y-2 text-xs sm:text-sm text-charcoal-muted">
            {highlights.map((item, idx) => (
              <li key={item} className="inline-flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-pista-500 animate-pulse' : 'bg-pista-300'}`} aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
