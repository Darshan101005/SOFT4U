import React from 'react';
import Link from 'next/link';
import { Mail, Phone, MessageCircle, Clock, MapPin, ShieldCheck, Lock, Headphones, BadgeCheck, Send } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { db } from '@/lib/db';
import { getStoreInfo, safe } from '@/app/_store/storefront';

const DEFAULT_HELP = [
  { label: 'About Us', href: '/about' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Track Order', href: '/track-order' },
];

const POLICY_LINKS = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms & Conditions', href: '/terms' },
  { label: 'Refund Policy', href: '/refund-policy' },
  { label: 'Delivery Policy', href: '/delivery-policy' },
  { label: 'Cookie Policy', href: '/cookie-policy' },
];

const POLICY_HREFS = new Set(POLICY_LINKS.map(l => l.href));

const linkClass = 'inline-flex items-center min-h-11 sm:min-h-0 sm:py-1 text-sm text-charcoal-muted hover:text-pista-darker transition-colors';

export async function Footer() {
  const [store, categories, footerNav] = await Promise.all([
    getStoreInfo(),
    safe(() => db.getCategories(true), []),
    safe(() => db.getNavigation('footer'), []),
  ]);
  const year = new Date().getFullYear();
  const cats = [...categories].sort((a, b) => a.displayOrder - b.displayOrder).slice(0, 8);
  const custom = footerNav
    .filter(n => n.visible && !POLICY_HREFS.has(n.url) && !n.url.startsWith('/categories/'))
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(n => ({ label: n.label, href: n.url, targetBlank: n.targetBlank }));
  const helpLinks = custom.length ? custom : DEFAULT_HELP;

  const promises = [
    { icon: BadgeCheck, title: 'Verified payments', desc: 'Checked by our team' },
    { icon: ShieldCheck, title: 'Genuine access', desc: 'Replacement support' },
    { icon: Lock, title: 'Private delivery', desc: 'Only you see your access' },
    { icon: Headphones, title: 'Real support', desc: store.hours },
  ];

  const socials = Object.entries(store.social || {}).filter(([, v]) => typeof v === 'string' && v.trim().startsWith('http')) as Array<[string, string]>;

  return (
    <footer className="mt-auto bg-pista-50 border-t border-charcoal-border">
      <div className="border-b border-charcoal-border bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {promises.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 min-w-0">
              <span className="w-10 h-10 shrink-0 rounded-xl bg-pista-100 text-pista-dark flex items-center justify-center">
                <Icon className="w-5 h-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-bold text-charcoal">{title}</div>
                <div className="text-xs text-charcoal-subtle break-words">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 min-w-0">
          <Logo size="lg" src={store.logoUrl || undefined} />
          <p className="mt-3 text-sm text-charcoal-muted leading-relaxed max-w-sm">{store.description}</p>
          <ul className="mt-5 space-y-1 text-sm">
            <li>
              <a href={`mailto:${store.email}`} className={`${linkClass} gap-2 break-all`}>
                <Mail className="w-4 h-4 text-pista-dark shrink-0" aria-hidden="true" />
                <span>{store.email}</span>
              </a>
            </li>
            <li>
              <a href={store.phoneHref} className={`${linkClass} gap-2`}>
                <Phone className="w-4 h-4 text-pista-dark shrink-0" aria-hidden="true" />
                <span>{store.phone}</span>
              </a>
            </li>
            <li>
              <a href={store.whatsappHref} target="_blank" rel="noopener noreferrer" className={`${linkClass} gap-2`}>
                <MessageCircle className="w-4 h-4 text-pista-dark shrink-0" aria-hidden="true" />
                <span>WhatsApp {store.whatsapp}</span>
              </a>
            </li>
            {store.telegramHref && (
              <li>
                <a href={store.telegramHref} target="_blank" rel="noopener noreferrer" className={`${linkClass} gap-2`}>
                  <Send className="w-4 h-4 text-pista-dark shrink-0" aria-hidden="true" />
                  <span>Telegram {store.telegram}</span>
                </a>
              </li>
            )}
            <li className="flex items-start gap-2 py-1 text-charcoal-muted">
              <Clock className="w-4 h-4 text-pista-dark shrink-0 mt-0.5" aria-hidden="true" />
              <span>{store.hours}</span>
            </li>
            <li className="flex items-start gap-2 py-1 text-charcoal-muted">
              <MapPin className="w-4 h-4 text-pista-dark shrink-0 mt-0.5" aria-hidden="true" />
              <span>{store.address}</span>
            </li>
          </ul>
          {socials.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {socials.map(([name, url]) => (
                <li key={name}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center min-h-11 px-3 rounded-xl border border-charcoal-border bg-white text-xs font-semibold capitalize text-charcoal-muted hover:border-pista hover:text-pista-darker"
                  >
                    {name}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav aria-label="Shop categories" className="lg:col-span-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-pista-dark mb-3">Shop</h2>
          <ul>
            {cats.map(cat => (
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
              <li key={link.href + link.label}>
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
            {POLICY_LINKS.map(link => (
              <li key={link.href}>
                <Link href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="bg-night text-pista-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-center">
          <p>
            &copy; {year} {store.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
