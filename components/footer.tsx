import React from 'react';
import Link from 'next/link';
import { Mail, Phone, MessageCircle, Clock, MapPin, Zap, ShieldCheck, Lock, Headphones } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { categories } from '@/data/categories';
import { siteConfig } from '@/lib/site-config';

const helpLinks = [
  { label: 'About Us', href: '/about' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Track Order', href: '/track-order' },
];

const policyLinks = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms & Conditions', href: '/terms' },
  { label: 'Refund Policy', href: '/refund-policy' },
  { label: 'Delivery Policy', href: '/delivery-policy' },
  { label: 'Cookie Policy', href: '/cookie-policy' },
];

const promises = [
  { icon: Zap, title: 'Instant delivery', desc: 'On email & WhatsApp' },
  { icon: ShieldCheck, title: 'Genuine access', desc: 'Replacement support' },
  { icon: Lock, title: 'Protected checkout', desc: 'Secure payments' },
  { icon: Headphones, title: 'Real support', desc: siteConfig.hours },
];

const linkClass =
  'inline-flex items-center min-h-11 sm:min-h-0 sm:py-1 text-sm text-charcoal-muted hover:text-pista-darker transition-colors';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-pista-50 border-t border-charcoal-border">
      {/* Promise strip */}
      <div className="border-b border-charcoal-border bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {promises.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3">
              <span className="w-10 h-10 shrink-0 rounded-xl bg-pista-100 text-pista-dark flex items-center justify-center">
                <Icon className="w-5 h-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-bold text-charcoal">{title}</div>
                <div className="text-xs text-charcoal-subtle">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Link columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <Logo size="lg" />
          <p className="mt-3 text-sm text-charcoal-muted leading-relaxed max-w-sm">{siteConfig.description}</p>

          <ul className="mt-5 space-y-1 text-sm">
            <li>
              <a href={`mailto:${siteConfig.email}`} className={`${linkClass} gap-2`}>
                <Mail className="w-4 h-4 text-pista-dark shrink-0" aria-hidden="true" />
                <span>{siteConfig.email}</span>
              </a>
            </li>
            <li>
              <a href={siteConfig.phoneHref} className={`${linkClass} gap-2`}>
                <Phone className="w-4 h-4 text-pista-dark shrink-0" aria-hidden="true" />
                <span>{siteConfig.phone}</span>
              </a>
            </li>
            <li>
              <a
                href={siteConfig.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`${linkClass} gap-2`}
              >
                <MessageCircle className="w-4 h-4 text-pista-dark shrink-0" aria-hidden="true" />
                <span>WhatsApp {siteConfig.whatsapp}</span>
              </a>
            </li>
            <li className="flex items-center gap-2 py-1 text-charcoal-muted">
              <Clock className="w-4 h-4 text-pista-dark shrink-0" aria-hidden="true" />
              <span>{siteConfig.hours}</span>
            </li>
            <li className="flex items-center gap-2 py-1 text-charcoal-muted">
              <MapPin className="w-4 h-4 text-pista-dark shrink-0" aria-hidden="true" />
              <span>{siteConfig.address}</span>
            </li>
          </ul>
        </div>

        <nav aria-label="Shop categories" className="lg:col-span-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-pista-dark mb-3">Shop</h2>
          <ul>
            {categories.map(cat => (
              <li key={cat.id}>
                <Link href={`/categories/${cat.slug}`} className={linkClass}>
                  {cat.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/shop" className={linkClass}>
                All Products
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Help" className="lg:col-span-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-pista-dark mb-3">Help</h2>
          <ul>
            {helpLinks.map(link => (
              <li key={link.href}>
                <Link href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Policies" className="lg:col-span-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-pista-dark mb-3">Policies</h2>
          <ul>
            {policyLinks.map(link => (
              <li key={link.href}>
                <Link href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Bottom bar: the one near-black accent */}
      <div className="bg-night text-pista-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <p>
            &copy; {year} {siteConfig.legalName}. All rights reserved.
          </p>
          <p className="text-pista-200">
            {siteConfig.domain} &middot; Prices in {siteConfig.currency}
          </p>
        </div>
      </div>
    </footer>
  );
}
