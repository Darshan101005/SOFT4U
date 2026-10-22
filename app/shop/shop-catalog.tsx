'use client';

import React, { useState, useMemo } from 'react';
import { Product, Category } from '@/lib/db/types';
import { ProductCard } from '@/components/product-card';
import { formatPrice } from '@/app/_store/price';
import { Search, SlidersHorizontal, ArrowUpDown, Boxes } from 'lucide-react';

export function ShopCatalog({
  initialProducts,
  categories,
}: {
  initialProducts: Product[];
  categories: Category[];
}) {
  const priceCeiling = useMemo(() => {
    const max = Math.max(0, ...initialProducts.map(p => p.price));
    return Math.max(500, Math.ceil(max / 500) * 500);
  }, [initialProducts]);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [maxPrice, setMaxPrice] = useState<number>(priceCeiling);

  const isFiltered = selectedCategory !== 'all' || search.trim() !== '' || maxPrice < priceCeiling;

  const resetFilters = () => {
    setSelectedCategory('all');
    setSearch('');
    setMaxPrice(priceCeiling);
  };

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return initialProducts
      .filter(p => {
        if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;
        if (p.price > maxPrice) return false;
        if (query) {
          const matches =
            p.name.toLowerCase().includes(query) ||
            p.shortDescription.toLowerCase().includes(query) ||
            p.tags?.some(t => t.toLowerCase().includes(query));
          if (!matches) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;
        if (sortBy === 'newest') return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
        if (sortBy === 'bestseller') return (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0);
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [initialProducts, search, selectedCategory, sortBy, maxPrice]);

  const categoryButton = (active: boolean) =>
    `w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between ${
      active ? 'bg-pista-lighter text-pista-darker font-semibold' : 'text-charcoal-muted hover:bg-surface-muted'
    }`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <aside className="lg:col-span-1">
        <div className="bg-surface-card p-5 border border-charcoal-border rounded-2xl space-y-5 lg:sticky lg:top-24">
          <div className="flex items-center justify-between pb-3 border-b border-surface-muted">
            <span className="text-sm font-bold text-charcoal flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-pista-dark" aria-hidden="true" />
              Filters
            </span>
            {isFiltered && (
              <button onClick={resetFilters} className="text-xs text-pista-darker hover:underline font-semibold">
                Reset
              </button>
            )}
          </div>

          <div>
            <label htmlFor="shop-search" className="text-sm font-semibold text-charcoal block mb-1.5">Search</label>
            <div className="relative">
              <input
                id="shop-search"
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Netflix, VPN, Canva..."
                className="w-full text-sm px-3 py-2 pl-9 border border-charcoal-border rounded-lg bg-surface-bg focus:bg-surface-card focus:outline-none focus:border-pista text-charcoal"
              />
              <Search className="w-4 h-4 text-charcoal-subtle absolute left-3 top-2.5" aria-hidden="true" />
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-charcoal mb-1.5">Categories</div>
            <div className="space-y-1">
              <button onClick={() => setSelectedCategory('all')} className={categoryButton(selectedCategory === 'all')} aria-pressed={selectedCategory === 'all'}>
                <span>All Categories</span>
                <span className="text-xs text-charcoal-subtle">{initialProducts.length}</span>
              </button>
              {categories.map(cat => {
                const count = initialProducts.filter(p => p.categoryId === cat.id).length;
                const active = selectedCategory === cat.id;
                return (
                  <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={categoryButton(active)} aria-pressed={active}>
                    <span className="truncate">{cat.name}</span>
                    <span className="text-xs text-charcoal-subtle">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="shop-max-price" className="text-sm font-semibold text-charcoal">Max price</label>
              <span className="text-sm font-bold text-pista-darker">{formatPrice(maxPrice)}</span>
            </div>
            <input
              id="shop-max-price"
              type="range"
              min={0}
              max={priceCeiling}
              step={100}
              value={maxPrice}
              onChange={e => setMaxPrice(Number(e.target.value))}
              className="w-full accent-pista-dark"
            />
          </div>
        </div>
      </aside>

      <div className="lg:col-span-3 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-surface-card border border-charcoal-border rounded-xl text-sm">
          <div className="text-charcoal-subtle" aria-live="polite">
            Showing <span className="font-bold text-charcoal">{filteredProducts.length}</span> of {initialProducts.length} products
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="shop-sort" className="text-charcoal-subtle flex items-center gap-1">
              <ArrowUpDown className="w-4 h-4 text-pista-dark" aria-hidden="true" />
              Sort by
            </label>
            <select
              id="shop-sort"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="text-sm bg-surface-bg border border-charcoal-border rounded-lg px-2.5 py-1.5 text-charcoal focus:outline-none focus:border-pista"
            >
              <option value="featured">Featured</option>
              <option value="bestseller">Best selling</option>
              <option value="newest">Newly added</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
            </select>
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-surface-card border border-charcoal-border rounded-2xl">
            <Boxes className="w-10 h-10 text-pista-dark mx-auto mb-3" aria-hidden="true" />
            <h2 className="text-base font-bold text-charcoal">No products found</h2>
            <p className="text-sm text-charcoal-subtle mt-1 max-w-sm mx-auto">Try a different search or reset the filters.</p>
            <button onClick={resetFilters} className="mt-4 px-5 py-2.5 bg-pista-dark text-white hover:bg-pista-darker text-sm font-bold rounded-lg">
              Reset filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
