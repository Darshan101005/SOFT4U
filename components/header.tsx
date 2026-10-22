'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, ShoppingCart, UserRound, Menu, X, LogOut, MessageCircle } from 'lucide-react';
import { useAuth } from '@/lib/context/auth-context';
import { useCart } from '@/lib/context/cart-context';
import { Logo } from '@/components/brand/logo';
import { ProductImage } from '@/components/brand/product-image';
import { products, formatPKR } from '@/data/products';
import { siteConfig } from '@/lib/site-config';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'Categories', href: '/categories' },
  { label: 'Track Order', href: '/track-order' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Close menus on navigation (state reset during render, as React recommends over an effect)
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }

  // Escape closes the search dialog
  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter(
        p =>
          p.status === 'active' &&
          (p.name.toLowerCase().includes(q) ||
            p.shortDescription.toLowerCase().includes(q) ||
            p.tags.some(t => t.toLowerCase().includes(q)))
      )
      .slice(0, 6);
  }, [searchQuery]);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname?.startsWith(href));

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-charcoal-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <Logo size="md" />

          {/* Desktop navigation */}
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={`inline-flex items-center min-h-11 px-3 text-sm font-semibold rounded-lg transition-colors ${
                  isActive(link.href)
                    ? 'text-pista-darker bg-pista-lighter'
                    : 'text-charcoal-muted hover:text-pista-darker hover:bg-pista-lighter'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-1 sm:gap-2">
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

            {user ? (
              <Link
                href="/account"
                className="hidden sm:inline-flex items-center gap-2 min-h-11 px-3 rounded-xl text-sm font-semibold text-charcoal hover:bg-pista-lighter transition-colors"
              >
                <span className="w-7 h-7 rounded-full bg-pista-100 border border-pista-300 flex items-center justify-center text-xs font-bold">
                  {user.name.charAt(0)}
                </span>
                <span className="truncate max-w-[100px]">{user.name.split(' ')[0]}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center gap-2 min-h-11 px-5 rounded-xl bg-pista text-charcoal text-sm font-bold hover:bg-pista-hover transition-colors shadow-sm"
              >
                <UserRound className="w-4 h-4" aria-hidden="true" />
                <span>Sign In</span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(open => !open)}
              className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-xl text-charcoal hover:bg-pista-lighter transition-colors"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileMenuOpen && (
          <div id="mobile-menu" className="md:hidden border-t border-charcoal-border bg-white px-4 pt-3 pb-5 animate-fade">
            <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                  className={`flex items-center min-h-11 px-3 rounded-lg text-base font-medium transition-colors ${
                    isActive(link.href)
                      ? 'bg-pista-lighter text-pista-darker font-semibold'
                      : 'text-charcoal hover:bg-pista-lighter'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/faq"
                className="flex items-center min-h-11 px-3 rounded-lg text-base font-medium text-charcoal hover:bg-pista-lighter"
              >
                FAQ
              </Link>
            </nav>

            <div className="mt-3 pt-3 border-t border-charcoal-border space-y-2">
              {user ? (
                <div className="flex items-center justify-between gap-2 min-h-11 px-3 rounded-lg bg-pista-50">
                  <Link href="/account" className="min-w-0 py-2">
                    <div className="text-sm font-semibold text-charcoal truncate">{user.name}</div>
                    <div className="text-xs text-charcoal-subtle truncate">{user.email}</div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="inline-flex items-center justify-center w-11 h-11 rounded-lg text-charcoal-muted hover:text-charcoal"
                    aria-label="Sign out"
                  >
                    <LogOut className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center justify-center min-h-11 rounded-xl bg-pista text-charcoal text-sm font-bold hover:bg-pista-hover"
                >
                  Sign In / Create Account
                </Link>
              )}
              <a
                href={siteConfig.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 min-h-11 rounded-xl border border-charcoal-border text-sm font-semibold text-charcoal hover:bg-pista-lighter"
              >
                <MessageCircle className="w-4 h-4 text-pista-dark" aria-hidden="true" />
                <span>WhatsApp {siteConfig.whatsapp}</span>
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Search dialog */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-charcoal/30 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 px-4"
          onClick={closeSearch}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search products"
            className="w-full max-w-2xl bg-white border border-charcoal-border rounded-2xl shadow-xl overflow-hidden animate-rise"
            onClick={e => e.stopPropagation()}
          >
            <form
              action="/shop"
              method="get"
              className="p-3 sm:p-4 border-b border-charcoal-border flex items-center gap-3"
            >
              <Search className="w-5 h-5 text-charcoal-subtle shrink-0" aria-hidden="true" />
              <label htmlFor="site-search" className="sr-only">
                Search products
              </label>
              <input
                id="site-search"
                name="q"
                type="search"
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search Netflix, Canva, NordVPN..."
                className="flex-1 min-w-0 min-h-11 text-base bg-transparent outline-none text-charcoal placeholder:text-charcoal-subtle"
              />
              <button
                type="button"
                onClick={closeSearch}
                className="inline-flex items-center justify-center min-h-11 px-3 text-xs font-semibold bg-pista-lighter text-charcoal-muted rounded-lg hover:bg-pista-100"
              >
                Close
              </button>
            </form>

            <div className="max-h-[60vh] overflow-y-auto p-3 sm:p-4">
              {searchResults.length > 0 ? (
                <ul className="space-y-1">
                  {searchResults.map(p => (
                    <li key={p.id}>
                      <Link
                        href={`/products/${p.slug}`}
                        onClick={closeSearch}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-pista-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <ProductImage
                            src={p.images[0]}
                            name={p.name}
                            className="w-14 h-11 rounded-lg shrink-0 border border-charcoal-border"
                            imgClassName="p-1.5"
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-charcoal truncate">{p.name}</div>
                            <div className="text-xs text-charcoal-subtle truncate">{p.shortDescription}</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-bold text-charcoal">{formatPKR(p.price)}</div>
                          <div className="text-[11px] text-pista-dark font-medium">{p.deliveryTime}</div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-8 text-center text-sm text-charcoal-subtle">
                  {searchQuery
                    ? `No products found for "${searchQuery}".`
                    : 'Type to search subscriptions and software.'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
