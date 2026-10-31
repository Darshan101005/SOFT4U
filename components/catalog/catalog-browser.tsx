'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpDown, Boxes, Check, ChevronLeft, ChevronRight, Loader2, Search, SlidersHorizontal, X } from 'lucide-react';
import type { Product } from '@/lib/db/types';
import type { CatalogResult } from '@/lib/catalog';
import { DURATION_LABELS, SORTS, SORT_LABELS, activeFilterCount, buildCatalogQuery, type CatalogFilters, type DurationKey, type SortKey } from '@/lib/catalog-query';
import { ProductCard, ProductCardSkeleton, type RatingSummary } from '@/components/product-card';
import { Select } from '@/components/ui/select';
import { formatPrice, type Pricing } from '@/app/_store/price';

type Facets = CatalogResult['facets'];

const EMPTY: CatalogFilters = {
  categories: [],
  brands: [],
  durations: [],
  inStock: false,
  instant: false,
  onSale: false,
  featured: false,
  trending: false,
  bestseller: false,
  isNew: false,
  sort: 'featured',
  page: 1,
};

type FlagKey = 'inStock' | 'instant' | 'onSale' | 'featured' | 'trending' | 'bestseller' | 'isNew';
const FLAGS: Array<{ key: FlagKey; label: string }> = [
  { key: 'inStock', label: 'In stock' },
  { key: 'instant', label: 'Instant delivery' },
  { key: 'onSale', label: 'On sale' },
  { key: 'featured', label: 'Featured' },
  { key: 'trending', label: 'Trending' },
  { key: 'bestseller', label: 'Best seller' },
  { key: 'isNew', label: 'New arrivals' },
];

const SORT_OPTIONS = SORTS.map(s => ({ value: s, label: SORT_LABELS[s] }));

function toggleIn<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter(x => x !== v) : [...list, v];
}

/**
 * Shop / category catalogue: URL-driven filters (lib/catalog-query), server-rendered first page,
 * client updates through GET /api/catalog. Desktop: sticky side panel. Mobile: "Filters" bottom
 * sheet with a live result count and Apply, plus a separate sort dropdown.
 */
export function CatalogBrowser({
  initial,
  initialFilters,
  pricing,
  basePath,
  lockedCategory,
  ratings,
  categoryNames,
  popular,
}: {
  initial: CatalogResult;
  initialFilters: CatalogFilters;
  pricing: Pricing;
  basePath: string;
  lockedCategory?: string;
  ratings: Record<string, RatingSummary>;
  categoryNames: Record<string, string>;
  popular: Product[];
}) {
  const [filters, setFilters] = useState<CatalogFilters>(initialFilters);
  const [result, setResult] = useState<CatalogResult>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchText, setSearchText] = useState(initialFilters.q || '');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState<CatalogFilters>(initialFilters);
  const [preview, setPreview] = useState<{ total: number; facets: Facets } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const withLock = useCallback((f: CatalogFilters): CatalogFilters => (lockedCategory ? { ...f, categories: [lockedCategory] } : f), [lockedCategory]);

  const fetchCatalog = useCallback(
    async (f: CatalogFilters, signal?: AbortSignal): Promise<CatalogResult> => {
      const res = await fetch(`/api/catalog?${buildCatalogQuery(withLock(f))}&currency=${pricing.currency}`, { signal });
      if (!res.ok) throw new Error('Could not load products');
      return res.json();
    },
    [pricing.currency, withLock],
  );

  const apply = useCallback(
    async (next: CatalogFilters, opts: { keepPage?: boolean; scroll?: boolean } = {}) => {
      const f = { ...next, page: opts.keepPage ? next.page : 1 };
      setFilters(f);
      const urlFilters = lockedCategory ? { ...f, categories: [] } : f;
      const qs = buildCatalogQuery(urlFilters);
      window.history.replaceState(null, '', qs ? `${basePath}?${qs}` : basePath);
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      setError('');
      try {
        const data = await fetchCatalog(f, ctrl.signal);
        setResult(data);
        if (opts.scroll) gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setError('Could not load products. Check your connection and try again.');
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    },
    [basePath, fetchCatalog, lockedCategory],
  );

  // Debounced search box.
  useEffect(() => {
    const q = searchText.trim();
    if (q === (filters.q || '')) return;
    const t = setTimeout(() => apply({ ...filters, q: q || undefined }), 350);
    return () => clearTimeout(t);
  }, [searchText, filters, apply]);

  // Live result count for the mobile sheet.
  useEffect(() => {
    if (!sheetOpen) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const data = await fetchCatalog({ ...draft, page: 1 }, ctrl.signal);
        setPreview({ total: data.total, facets: data.facets });
      } catch {
        // keep the last preview
      } finally {
        if (!ctrl.signal.aborted) setPreviewLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [sheetOpen, draft, fetchCatalog]);

  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSheetOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [sheetOpen]);

  const openSheet = () => {
    setDraft(filters);
    setPreview({ total: result.total, facets: result.facets });
    setSheetOpen(true);
  };

  const clearAll = () => {
    setSearchText('');
    apply({ ...EMPTY, sort: filters.sort });
  };

  const countable = lockedCategory ? { ...filters, categories: [] } : filters;
  const activeCount = activeFilterCount(countable);
  const facets = result.facets;
  const catName = (slug: string) => facets.categories.find(c => c.slug === slug)?.name || slug;
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  // Each chip carries the filters that remain once it is removed.
  const chips: Array<{ key: string; label: string; next: CatalogFilters }> = [];
  if (filters.q) chips.push({ key: 'q', label: `“${filters.q}”`, next: { ...filters, q: undefined } });
  if (!lockedCategory) for (const c of filters.categories) chips.push({ key: `c-${c}`, label: catName(c), next: { ...filters, categories: filters.categories.filter(x => x !== c) } });
  for (const b of filters.brands) chips.push({ key: `b-${b}`, label: b, next: { ...filters, brands: filters.brands.filter(x => x !== b) } });
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const lo = filters.minPrice !== undefined ? formatPrice(filters.minPrice, pricing.currency) : 'Any';
    const hi = filters.maxPrice !== undefined ? formatPrice(filters.maxPrice, pricing.currency) : 'Any';
    chips.push({ key: 'price', label: `${lo} – ${hi}`, next: { ...filters, minPrice: undefined, maxPrice: undefined } });
  }
  for (const d of filters.durations) chips.push({ key: `d-${d}`, label: DURATION_LABELS[d], next: { ...filters, durations: filters.durations.filter(x => x !== d) } });
  for (const f of FLAGS) if (filters[f.key]) chips.push({ key: f.key, label: f.label, next: { ...filters, [f.key]: false } });

  const removeChip = (chip: { key: string; next: CatalogFilters }) => {
    if (chip.key === 'q') setSearchText('');
    apply(chip.next);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
      <aside className="hidden lg:block lg:col-span-1" aria-label="Filters">
        <div className="lg:sticky lg:top-24 bg-surface-card border border-charcoal-border rounded-2xl p-5 max-h-[calc(100vh-7rem)] overflow-y-auto">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-surface-muted">
            <span className="text-sm font-bold text-charcoal flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-pista-dark" aria-hidden="true" />
              Filters
            </span>
            {activeCount > 0 && (
              <button type="button" onClick={clearAll} className="min-h-11 px-2 text-xs text-pista-darker hover:underline font-semibold">
                Clear all
              </button>
            )}
          </div>
          <FilterPanel
            idPrefix="d"
            value={filters}
            facets={facets}
            currency={pricing.currency}
            hideCategories={Boolean(lockedCategory)}
            onChange={next => apply(next)}
          />
        </div>
      </aside>

      <div className="lg:col-span-3 space-y-4 min-w-0" ref={gridRef}>
        <div className="flex flex-col gap-3">
          <div className="relative">
            <label htmlFor="catalog-search" className="sr-only">
              Search products
            </label>
            <Search className="w-4 h-4 text-charcoal-subtle absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              id="catalog-search"
              type="search"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="Search Netflix, VPN, Canva..."
              className="w-full min-h-12 pl-10 pr-12 text-base sm:text-sm border border-charcoal-border rounded-2xl bg-white focus:outline-none focus:border-pista-500 focus:ring-2 focus:ring-pista-200 text-charcoal [&::-webkit-search-cancel-button]:hidden"
            />
            {searchText && (
              <button
                type="button"
                onClick={() => setSearchText('')}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 inline-flex items-center justify-center rounded-xl text-charcoal-subtle hover:text-charcoal"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <button
              type="button"
              onClick={openSheet}
              className="lg:hidden inline-flex items-center gap-2 min-h-11 px-4 rounded-xl border border-charcoal-border bg-white text-sm font-bold text-charcoal hover:border-pista"
            >
              <SlidersHorizontal className="w-4 h-4 text-pista-dark" aria-hidden="true" />
              Filters{activeCount > 0 ? ` (${activeCount})` : ''}
            </button>
            <div className="hidden lg:block text-sm text-charcoal-subtle" aria-live="polite">
              Showing <span className="font-bold text-charcoal">{result.total}</span> of {result.catalogTotal} products
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <span className="hidden sm:inline-flex items-center gap-1 text-sm text-charcoal-subtle" id="catalog-sort-label">
                <ArrowUpDown className="w-4 h-4 text-pista-dark" aria-hidden="true" />
                Sort
              </span>
              <Select<SortKey>
                value={filters.sort}
                onChange={sort => apply({ ...filters, sort })}
                options={SORT_OPTIONS}
                ariaLabel="Sort products"
                align="right"
                className="w-[178px] sm:w-[200px]"
              />
            </div>
          </div>

          <div className="lg:hidden text-sm text-charcoal-subtle" aria-live="polite">
            Showing <span className="font-bold text-charcoal">{result.total}</span> of {result.catalogTotal} products
          </div>

          {chips.length > 0 && (
            <ul className="flex flex-wrap items-center gap-2" aria-label="Active filters">
              {chips.map(c => (
                <li key={c.key}>
                  <button
                    type="button"
                    onClick={() => removeChip(c)}
                    className="inline-flex items-center gap-1.5 min-h-9 pl-3 pr-2 rounded-full bg-pista-lighter border border-pista-200 text-xs font-semibold text-pista-darker hover:bg-pista-100"
                    aria-label={`Remove filter ${c.label}`}
                  >
                    {c.label}
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
              <li>
                <button type="button" onClick={clearAll} className="min-h-9 px-2 text-xs font-bold text-charcoal-muted underline hover:text-charcoal">
                  Clear all
                </button>
              </li>
            </ul>
          )}
        </div>

        {error && (
          <p role="alert" className="p-3 rounded-xl bg-white border border-accent-rose/40 text-sm text-charcoal">
            {error}
          </p>
        )}

        {loading ? (
          <ul className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i}>
                <ProductCardSkeleton />
              </li>
            ))}
          </ul>
        ) : result.products.length > 0 ? (
          <ul className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
            {result.products.map(p => (
              <li key={p.id}>
                <ProductCard product={p} pricing={pricing} categoryName={categoryNames[p.categoryId]} rating={ratings[p.id]} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="space-y-6">
            <div className="p-10 text-center bg-surface-card border border-charcoal-border rounded-2xl">
              <Boxes className="w-10 h-10 text-pista-dark mx-auto mb-3" aria-hidden="true" />
              <h2 className="text-base font-bold text-charcoal">No products match these filters</h2>
              <p className="text-sm text-charcoal-subtle mt-1 max-w-sm mx-auto">Try a different search or remove a filter.</p>
              {activeCount > 0 && (
                <button type="button" onClick={clearAll} className="mt-4 min-h-11 px-5 bg-pista-dark text-white hover:bg-pista-darker text-sm font-bold rounded-xl">
                  Clear filters
                </button>
              )}
            </div>
            {popular.length > 0 && (
              <section aria-labelledby="popular-title" className="space-y-3">
                <h2 id="popular-title" className="text-base font-bold text-charcoal">
                  Popular right now
                </h2>
                <ul className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
                  {popular.slice(0, 6).map(p => (
                    <li key={p.id}>
                      <ProductCard product={p} pricing={pricing} categoryName={categoryNames[p.categoryId]} rating={ratings[p.id]} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        {totalPages > 1 && !loading && (
          <nav aria-label="Pagination" className="pt-4 flex items-center justify-center gap-1.5 flex-wrap">
            <button
              type="button"
              disabled={filters.page <= 1}
              onClick={() => apply({ ...filters, page: filters.page - 1 }, { keepPage: true, scroll: true })}
              className="inline-flex items-center justify-center w-11 h-11 rounded-xl border border-charcoal-border bg-white disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => {
              const n = i + 1;
              if (totalPages > 7 && Math.abs(n - filters.page) > 2 && n !== 1 && n !== totalPages) {
                return Math.abs(n - filters.page) === 3 ? (
                  <span key={n} className="px-1 text-charcoal-subtle">
                    …
                  </span>
                ) : null;
              }
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => apply({ ...filters, page: n }, { keepPage: true, scroll: true })}
                  aria-current={n === filters.page ? 'page' : undefined}
                  className={`inline-flex items-center justify-center min-w-11 h-11 px-3 rounded-xl border text-sm font-bold ${
                    n === filters.page ? 'bg-pista border-pista-500 text-charcoal' : 'bg-white border-charcoal-border text-charcoal-muted hover:border-pista'
                  }`}
                >
                  {n}
                </button>
              );
            })}
            <button
              type="button"
              disabled={filters.page >= totalPages}
              onClick={() => apply({ ...filters, page: filters.page + 1 }, { keepPage: true, scroll: true })}
              className="inline-flex items-center justify-center w-11 h-11 rounded-xl border border-charcoal-border bg-white disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </nav>
        )}
      </div>

      {sheetOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
          <button type="button" className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm" aria-label="Close filters" onClick={() => setSheetOpen(false)} />
          <div className="relative bg-white rounded-t-3xl max-h-[88svh] flex flex-col animate-rise">
            <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-surface-muted">
              <h2 id="sheet-title" className="text-base font-bold text-charcoal">
                Filters
              </h2>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDraft({ ...EMPTY, sort: draft.sort, q: draft.q })}
                  className="min-h-11 px-3 text-sm font-semibold text-pista-darker"
                >
                  Reset
                </button>
                <button type="button" onClick={() => setSheetOpen(false)} className="w-11 h-11 inline-flex items-center justify-center rounded-xl text-charcoal" aria-label="Close filters">
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <FilterPanel
                idPrefix="m"
                value={draft}
                facets={preview?.facets || facets}
                currency={pricing.currency}
                hideCategories={Boolean(lockedCategory)}
                onChange={setDraft}
              />
            </div>
            <div className="p-4 border-t border-surface-muted pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => {
                  setSheetOpen(false);
                  apply(draft);
                }}
                className="w-full min-h-12 rounded-2xl bg-pista-dark text-white text-sm font-bold inline-flex items-center justify-center gap-2"
              >
                {previewLoading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                Show {preview ? preview.total : result.total} {(preview ? preview.total : result.total) === 1 ? 'result' : 'results'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterPanel({
  idPrefix,
  value,
  facets,
  currency,
  hideCategories,
  onChange,
}: {
  idPrefix: string;
  value: CatalogFilters;
  facets: Facets;
  currency: Pricing['currency'];
  hideCategories: boolean;
  onChange: (next: CatalogFilters) => void;
}) {
  const [showAllBrands, setShowAllBrands] = useState(false);
  const brands = showAllBrands ? facets.brands : facets.brands.slice(0, 8);

  return (
    <div className="space-y-6">
      {!hideCategories && facets.categories.length > 0 && (
        <fieldset>
          <legend className="text-sm font-bold text-charcoal mb-2">Category</legend>
          <ul className="space-y-0.5">
            {facets.categories.map(c => {
              const checked = value.categories.includes(c.slug);
              return (
                <li key={c.id}>
                  <CheckRow
                    checked={checked}
                    disabled={!checked && c.count === 0}
                    label={c.name}
                    count={c.count}
                    onToggle={() => onChange({ ...value, categories: toggleIn(value.categories, c.slug) })}
                  />
                </li>
              );
            })}
          </ul>
        </fieldset>
      )}

      {facets.price.max > facets.price.min && (
        <PriceRange
          idPrefix={idPrefix}
          bounds={facets.price}
          currency={currency}
          min={value.minPrice}
          max={value.maxPrice}
          onCommit={(minPrice, maxPrice) => onChange({ ...value, minPrice, maxPrice })}
        />
      )}

      {facets.durations.length > 0 && (
        <fieldset>
          <legend className="text-sm font-bold text-charcoal mb-2">Duration</legend>
          <div className="flex flex-wrap gap-2">
            {facets.durations.map(d => {
              const on = value.durations.includes(d.key);
              const disabled = !on && d.count === 0;
              return (
                <button
                  key={d.key}
                  type="button"
                  aria-pressed={on}
                  disabled={disabled}
                  onClick={() => onChange({ ...value, durations: toggleIn(value.durations, d.key as DurationKey) })}
                  className={`min-h-11 px-3.5 rounded-full border text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pista-500 disabled:opacity-40 disabled:cursor-not-allowed ${
                    on ? 'bg-pista border-pista-500 text-charcoal' : 'bg-white border-charcoal-border text-charcoal-muted hover:border-pista'
                  }`}
                >
                  {DURATION_LABELS[d.key]}
                  <span className="ml-1 font-medium opacity-70">{d.count}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="text-sm font-bold text-charcoal mb-1">Availability &amp; offers</legend>
        <ul>
          {FLAGS.map(f => (
            <li key={f.key}>
              <Toggle checked={value[f.key]} label={f.label} onToggle={() => onChange({ ...value, [f.key]: !value[f.key] })} />
            </li>
          ))}
        </ul>
      </fieldset>

      {facets.brands.length > 0 && (
        <fieldset>
          <legend className="text-sm font-bold text-charcoal mb-2">Brand</legend>
          <ul className="space-y-0.5">
            {brands.map(b => {
              const checked = value.brands.includes(b.name);
              return (
                <li key={b.name}>
                  <CheckRow checked={checked} disabled={!checked && b.count === 0} label={b.name} count={b.count} onToggle={() => onChange({ ...value, brands: toggleIn(value.brands, b.name) })} />
                </li>
              );
            })}
          </ul>
          {facets.brands.length > 8 && (
            <button type="button" onClick={() => setShowAllBrands(s => !s)} className="mt-1 min-h-11 text-xs font-bold text-pista-darker hover:underline">
              {showAllBrands ? 'Show fewer brands' : `Show all ${facets.brands.length} brands`}
            </button>
          )}
        </fieldset>
      )}
    </div>
  );
}

function CheckRow({ checked, disabled, label, count, onToggle }: { checked: boolean; disabled?: boolean; label: string; count: number; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={onToggle}
      className="w-full flex items-center justify-between gap-3 min-h-11 px-2 rounded-lg text-left text-sm hover:bg-pista-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-pista-500 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <span className="flex items-center gap-2.5 min-w-0">
        <span
          className={`w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-colors ${checked ? 'bg-pista-600 border-pista-600 text-white' : 'bg-white border-charcoal-border-dark'}`}
          aria-hidden="true"
        >
          {checked && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
        </span>
        <span className={`truncate ${checked ? 'font-semibold text-charcoal' : 'text-charcoal-muted'}`}>{label}</span>
      </span>
      <span className="text-xs text-charcoal-subtle shrink-0">{count}</span>
    </button>
  );
}

function Toggle({ checked, label, onToggle }: { checked: boolean; label: string; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onToggle}
      className="w-full flex items-center justify-between gap-3 min-h-11 px-2 rounded-lg text-sm text-left hover:bg-pista-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-pista-500"
    >
      <span className={checked ? 'font-semibold text-charcoal' : 'text-charcoal-muted'}>{label}</span>
      <span className={`relative w-10 h-6 shrink-0 rounded-full transition-colors ${checked ? 'bg-pista-600' : 'bg-charcoal-border-dark'}`} aria-hidden="true">
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} />
      </span>
    </button>
  );
}

const THUMB =
  'absolute inset-x-0 top-1/2 -translate-y-1/2 w-full h-11 appearance-none bg-transparent pointer-events-none focus:outline-none ' +
  '[&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-pista-600 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab ' +
  '[&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-pista-600 [&::-moz-range-thumb]:cursor-grab ' +
  'focus-visible:[&::-webkit-slider-thumb]:ring-4 focus-visible:[&::-webkit-slider-thumb]:ring-pista-200';

function PriceRange({
  idPrefix,
  bounds,
  currency,
  min,
  max,
  onCommit,
}: {
  idPrefix: string;
  bounds: { min: number; max: number };
  currency: Pricing['currency'];
  min?: number;
  max?: number;
  onCommit: (min?: number, max?: number) => void;
}) {
  const step = currency === 'USD' ? 1 : 50;
  const [lo, setLo] = useState(min ?? bounds.min);
  const [hi, setHi] = useState(max ?? bounds.max);
  const [loText, setLoText] = useState(String(min ?? bounds.min));
  const [hiText, setHiText] = useState(String(max ?? bounds.max));

  const key = `${min}|${max}|${bounds.min}|${bounds.max}`;
  const [lastKey, setLastKey] = useState(key);
  if (key !== lastKey) {
    setLastKey(key);
    setLo(min ?? bounds.min);
    setHi(max ?? bounds.max);
    setLoText(String(min ?? bounds.min));
    setHiText(String(max ?? bounds.max));
  }

  const commit = (a: number, b: number) => {
    const nlo = Math.max(bounds.min, Math.min(a, b));
    const nhi = Math.min(bounds.max, Math.max(a, b));
    onCommit(nlo <= bounds.min ? undefined : nlo, nhi >= bounds.max ? undefined : nhi);
  };

  const span = bounds.max - bounds.min || 1;
  const left = ((lo - bounds.min) / span) * 100;
  const right = 100 - ((hi - bounds.min) / span) * 100;
  const inputCls = 'w-full min-h-11 px-3 rounded-xl border border-charcoal-border bg-white text-base sm:text-sm text-charcoal focus:outline-none focus:border-pista-500';

  return (
    <fieldset>
      <legend className="text-sm font-bold text-charcoal mb-1">Price ({currency})</legend>
      <div className="relative h-11">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-charcoal-border" aria-hidden="true" />
        <div className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-pista-500" style={{ left: `${left}%`, right: `${right}%` }} aria-hidden="true" />
        <input
          type="range"
          aria-label="Minimum price"
          min={bounds.min}
          max={bounds.max}
          step={step}
          value={lo}
          onChange={e => {
            const v = Math.min(Number(e.target.value), hi);
            setLo(v);
            setLoText(String(v));
          }}
          onPointerUp={() => commit(lo, hi)}
          onKeyUp={() => commit(lo, hi)}
          className={THUMB}
        />
        <input
          type="range"
          aria-label="Maximum price"
          min={bounds.min}
          max={bounds.max}
          step={step}
          value={hi}
          onChange={e => {
            const v = Math.max(Number(e.target.value), lo);
            setHi(v);
            setHiText(String(v));
          }}
          onPointerUp={() => commit(lo, hi)}
          onKeyUp={() => commit(lo, hi)}
          className={THUMB}
        />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div>
          <label htmlFor={`${idPrefix}-price-min`} className="text-[11px] font-semibold text-charcoal-subtle">
            Min
          </label>
          <input
            id={`${idPrefix}-price-min`}
            inputMode="decimal"
            value={loText}
            onChange={e => setLoText(e.target.value.replace(/[^\d.]/g, ''))}
            onBlur={() => {
              const v = Number(loText);
              if (Number.isFinite(v)) commit(v, hi);
            }}
            onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-price-max`} className="text-[11px] font-semibold text-charcoal-subtle">
            Max
          </label>
          <input
            id={`${idPrefix}-price-max`}
            inputMode="decimal"
            value={hiText}
            onChange={e => setHiText(e.target.value.replace(/[^\d.]/g, ''))}
            onBlur={() => {
              const v = Number(hiText);
              if (Number.isFinite(v)) commit(lo, v);
            }}
            onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            className={inputCls}
          />
        </div>
      </div>
    </fieldset>
  );
}
