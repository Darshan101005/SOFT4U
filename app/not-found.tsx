import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Compass, ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-bg">
      <Header />
      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-20 flex flex-col items-center justify-center text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-pista-lighter text-pista-dark flex items-center justify-center border border-pista-light">
          <Compass className="w-8 h-8" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <div className="text-xs font-bold text-pista-dark uppercase tracking-wider">Error 404</div>
          <h1 className="text-3xl font-extrabold text-charcoal">Page not found</h1>
          <p className="text-sm text-charcoal-subtle max-w-sm mx-auto">
            The page you are looking for may have moved or no longer exists. Try browsing our products instead.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/" className="px-5 py-2.5 bg-pista-dark text-white hover:bg-pista-darker text-sm font-bold rounded-lg flex items-center gap-1.5">
            Back to Home <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
          <Link href="/shop" className="px-5 py-2.5 border border-pista-light text-pista-darker hover:border-pista text-sm font-semibold rounded-lg">
            Browse Products
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
