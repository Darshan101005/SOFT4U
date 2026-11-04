'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, ShoppingCart, UserRound, Menu, X, LogOut, MessageCircle, Package, Settings, ShieldCheck, ChevronDown, Loader2 } from 'lucide-react';
import type { Product } from '@/lib/db/types';
import { useAuth } from '@/lib/context/auth-context';
import { useCart } from '@/lib/context/cart-context';
import { useHydrated } from '@/hooks/use-hydrated';
import { Logo } from '@/components/brand/logo';
import { ProductImage } from '@/components/brand/product-image';
import { CurrencySwitcher } from '@/components/currency-switcher';
import { formatPrice, fromPrice, type Pricing } from '@/app/_store/price';
import { formatPersonName } from '@/lib/format-name';

export interface HeaderNavLink {
  label: string;
  href: string;
  targetBlank?: boolean;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
}

export function HeaderClient({
  nav,
  mobileNav,
  whatsapp,
  whatsappHref,
  pricing,
  logoUrl,
}: {
  nav: HeaderNavLink[];
  mobileNav: HeaderNavLink[];
  whatsapp: string;
  whatsappHref: string;
  pricing: Pricing;
  logoUrl?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const { itemCount: storedCount } = useCart();
  // The cart is restored from localStorage, so show the badge only after hydration.
  const hydrated = useHydrated();
  const itemCount = hydrated ? storedCount : 0;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on navigation (state reset during render, as React recommends over an effect)
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMobileMenuOpen(false);
    setSearchOpen(false);
    setUserMenuOpen(false);
  }

  useEffect(() => {
    if (!searchOpen && !userMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setUserMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen, userMenuOpen]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [userMenuOpen]);

  // Debounced live search against the catalogue API.
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) return;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/catalog?q=${encodeURIComponent(q)}&currency=${pricing.currency}`, { signal: ctrl.signal });
        const data = await res.json();
        setResults(Array.isArray(data.products) ? data.products.slice(0, 6) : []);
      } catch {
        // aborted or offline
      } finally {
        if (!ctrl.signal.aborted) setSearching(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [searchQuery, pricing.currency]);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname?.startsWith(href));

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
    setResults([]);
  };

  const signOut = async () => {
    setUserMenuOpen(false);
    await logout();
    router.push('/');
    router.refresh();
  };

  const accountLinks = [
    { label: 'My account', href: '/account', icon: UserRound },
    { label: 'My orders', href: '/account/orders', icon: Package },
    { label: 'Profile', href: '/account/profile', icon: Settings },
    { label: 'Security', href: '/account/security', icon: ShieldCheck },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-charcoal-border">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          <Logo size="md" src={logoUrl || undefined} />

          <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-1">
            {nav.map(link => (
              <Link
                key={link.href + link.label}
                href={link.href}
                target={link.targetBlank ? '_blank' : undefined}
                rel={link.targetBlank ? 'noopener noreferrer' : undefined}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={`inline-flex items-center min-h-11 px-3 text-sm font-semibold rounded-lg transition-colors ${
                  isActive(link.href) ? 'text-pista-darker bg-pista-lighter' : 'text-charcoal-muted hover:text-pista-darker hover:bg-pista-lighter'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            {pricing.usdOnly ? (
              <span
                title="Prices are shown in USD"
                aria-label="Prices are shown in USD"
                className="inline-flex items-center justify-center w-[76px] sm:w-[84px] min-h-11 px-2.5 rounded-xl border border-charcoal-border bg-white text-xs sm:text-sm font-semibold text-charcoal select-none"
              >
                USD
              </span>
            ) : (
              pricing.usdEnabled && <CurrencySwitcher currency={pricing.currency} resolved={pricing.resolved} className="w-[76px] sm:w-[84px]" />
            )}

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="inline-flex items-center justify-center w-11 h-11 rounded-xl border border-charcoal-border bg-white text-charcoal hover:border-pista hover:bg-pista-lighter transition-colors"
              aria-label="Search products"
            >
              <Search className="w-[18px] h-[18px]" aria-hidden="true" />
            </button>

            <Link
              href="/cart"
              className="relative inline-flex items-center justify-center w-11 h-11 rounded-xl border border-charcoal-border bg-white text-charcoal hover:border-pista hover:bg-pista-lighter transition-colors"
              aria-label={itemCount > 0 ? `Cart, ${itemCount} items` : 'Cart'}
            >
              <ShoppingCart className="w-[18px] h-[18px]" aria-hidden="true" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 bg-pista text-charcoal text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {itemCount}
                </span>
              )}
            </Link>

            {isLoading ? (
              <span className="hidden sm:inline-block w-24 h-11 rounded-xl bg-pista-50 animate-pulse" aria-hidden="true" />
            ) : user ? (
              <div ref={userMenuRef} className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(o => !o)}
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                  className="inline-flex items-center gap-2 min-h-11 pl-1.5 pr-2.5 rounded-xl border border-charcoal-border bg-white text-sm font-semibold text-charcoal hover:border-pista hover:bg-pista-lighter transition-colors"
                >
                  <span className="w-8 h-8 rounded-full bg-pista-100 border border-pista-300 flex items-center justify-center text-xs font-bold text-pista-darker">
                    {initials(formatPersonName(user.name))}
                  </span>
                  <span className="truncate max-w-[110px]">{formatPersonName(user.name).split(' ')[0]}</span>
                  <ChevronDown className={`w-4 h-4 text-pista-dark transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                {userMenuOpen && (
                  <div role="menu" className="absolute right-0 mt-2 w-60 rounded-2xl border border-pista-200 bg-white p-1.5 shadow-[0_16px_40px_rgba(47,74,31,0.16)] animate-fade">
                    <div className="px-3 py-2.5 border-b border-surface-muted mb-1">
                      <div className="text-sm font-bold text-charcoal truncate">{formatPersonName(user.name)}</div>
                      <div className="text-xs text-charcoal-subtle truncate">{user.email}</div>
                    </div>
                    {accountLinks.map(l => (
                      <Link
                        key={l.href}
                        role="menuitem"
                        href={l.href}
                        className="flex items-center gap-2.5 min-h-11 px-3 rounded-lg text-sm font-medium text-charcoal-muted hover:bg-pista-lighter hover:text-charcoal"
                      >
                        <l.icon className="w-4 h-4 text-pista-dark" aria-hidden="true" />
                        {l.label}
                      </Link>
                    ))}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={signOut}
                      className="w-full flex items-center gap-2.5 min-h-11 px-3 rounded-lg text-sm font-medium text-charcoal-muted hover:bg-pista-lighter hover:text-charcoal"
                    >
                      <LogOut className="w-4 h-4 text-pista-dark" aria-hidden="true" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5">
                <Link href="/login" className="inline-flex items-center min-h-11 px-3 rounded-xl text-sm font-semibold text-charcoal hover:bg-pista-lighter transition-colors">
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl bg-pista text-charcoal text-sm font-bold hover:bg-pista-hover transition-colors shadow-sm"
                >
                  <UserRound className="w-4 h-4" aria-hidden="true" />
                  Sign up
                </Link>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(open => !open)}
              className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-xl text-charcoal hover:bg-pista-lighter transition-colors"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div id="mobile-menu" className="lg:hidden border-t border-charcoal-border bg-white px-4 pt-3 pb-5 animate-fade max-h-[calc(100svh-4rem)] overflow-y-auto">
            <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
              {mobileNav.map(link => (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  target={link.targetBlank ? '_blank' : undefined}
                  rel={link.targetBlank ? 'noopener noreferrer' : undefined}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                  className={`flex items-center min-h-11 px-3 rounded-lg text-base font-medium transition-colors ${
                    isActive(link.href) ? 'bg-pista-lighter text-pista-darker font-semibold' : 'text-charcoal hover:bg-pista-lighter'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-3 pt-3 border-t border-charcoal-border space-y-2">
              {user ? (
                <>
                  <div className="px-3 py-2 rounded-lg bg-pista-50">
                    <div className="text-sm font-semibold text-charcoal truncate">{formatPersonName(user.name)}</div>
                    <div className="text-xs text-charcoal-subtle truncate">{user.email}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {accountLinks.map(l => (
                      <Link
                        key={l.href}
                        href={l.href}
                        className="flex items-center gap-2 min-h-11 px-3 rounded-xl border border-charcoal-border text-sm font-semibold text-charcoal hover:bg-pista-lighter"
                      >
                        <l.icon className="w-4 h-4 text-pista-dark" aria-hidden="true" />
                        {l.label}
                      </Link>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={signOut}
                    className="w-full flex items-center justify-center gap-2 min-h-11 rounded-xl border border-charcoal-border text-sm font-semibold text-charcoal hover:bg-pista-lighter"
                  >
                    <LogOut className="w-4 h-4 text-pista-dark" aria-hidden="true" />
                    Sign out
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/login" className="flex items-center justify-center min-h-11 rounded-xl border border-charcoal-border text-sm font-bold text-charcoal hover:bg-pista-lighter">
                    Log in
                  </Link>
                  <Link href="/register" className="flex items-center justify-center min-h-11 rounded-xl bg-pista text-charcoal text-sm font-bold hover:bg-pista-hover">
                    Sign up
                  </Link>
                </div>
              )}
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 min-h-11 rounded-xl border border-charcoal-border text-sm font-semibold text-charcoal hover:bg-pista-lighter"
                >
                  <MessageCircle className="w-4 h-4 text-pista-dark" aria-hidden="true" />
                  <span>WhatsApp {whatsapp}</span>
                </a>
              )}
            </div>
          </div>
        )}
      </header>

      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal/40 backdrop-blur-md flex items-start justify-center pt-4 sm:pt-24 px-3 sm:px-4" onClick={closeSearch}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search products"
            className="w-full max-w-2xl bg-white rounded-[28px] shadow-2xl ring-1 ring-charcoal/5 overflow-hidden animate-rise"
            onClick={e => e.stopPropagation()}
          >
            <form action="/shop" method="get" className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              <label htmlFor="site-search" className="sr-only">
                Search products
              </label>
              <div className="focus-ring-wrapper group flex-1 min-w-0 flex items-center gap-3 h-12 sm:h-14 pl-4 sm:pl-5 pr-2 rounded-full bg-surface-bg border border-charcoal-border transition-all focus-within:bg-white focus-within:border-pista-dark focus-within:shadow-[0_0_0_4px_rgba(79,122,51,0.15)]">
                <Search className="w-5 h-5 text-charcoal-subtle group-focus-within:text-pista-darker shrink-0 transition-colors" aria-hidden="true" />
                <input
                  id="site-search"
                  name="q"
                  type="search"
                  autoFocus
                  autoComplete="off"
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    if (!e.target.value.trim()) setResults([]);
                  }}
                  placeholder="Search Netflix, Canva, NordVPN..."
                  className="flex-1 min-w-0 h-full text-base bg-transparent border-0 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 text-charcoal placeholder:text-charcoal-subtle [&::-webkit-search-cancel-button]:appearance-none"
                />
                {searching && <Loader2 className="w-4 h-4 text-pista-dark animate-spin shrink-0" aria-hidden="true" />}
                {searchQuery && !searching && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setResults([]);
                      document.getElementById('site-search')?.focus();
                    }}
                    aria-label="Clear search"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-charcoal-subtle hover:bg-charcoal/5 hover:text-charcoal shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={closeSearch}
                aria-label="Close search"
                className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-surface-bg text-charcoal-muted hover:bg-pista-100 hover:text-charcoal transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </form>

            <div className="max-h-[60vh] overflow-y-auto p-2 sm:p-4" aria-live="polite">
              {searchQuery.trim() && results.length > 0 ? (
                <ul className="space-y-1">
                  {results.map(p => {
                    const { price } = fromPrice(p, pricing);
                    return (
                      <li key={p.id}>
                        <Link
                          href={`/products/${p.slug}`}
                          onClick={closeSearch}
                          className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-pista-50 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <ProductImage src={p.logo || p.images[0]} name={p.name} className="w-12 h-12 rounded-lg shrink-0 border border-charcoal-border" imgClassName="p-1.5" />
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-charcoal truncate">{p.name}</div>
                              <div className="text-xs text-charcoal-subtle truncate">{p.shortDescription}</div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-bold text-charcoal whitespace-nowrap" data-price>{formatPrice(price, pricing.currency)}</div>
                            <div className="text-[11px] text-pista-dark font-medium">{p.deliveryTime}</div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                  <li>
                    <Link
                      href={`/shop?q=${encodeURIComponent(searchQuery.trim())}`}
                      onClick={closeSearch}
                      className="flex items-center justify-center min-h-11 rounded-xl text-sm font-semibold text-pista-darker hover:bg-pista-50"
                    >
                      See all results for &ldquo;{searchQuery.trim()}&rdquo;
                    </Link>
                  </li>
                </ul>
              ) : (
                <p className="py-8 text-center text-sm text-charcoal-subtle">
                  {searchQuery.trim() ? (searching ? 'Searching...' : `No products found for "${searchQuery.trim()}".`) : 'Type to search subscriptions and software.'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
