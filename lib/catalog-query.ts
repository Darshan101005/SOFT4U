/**
 * Shop / category filter state <-> URL query string. Client-safe, shared by
 * the filter UI (to build links) and the server (lib/catalog.ts) so both use
 * the same keys:
 *
 *   q=netflix  category=streaming-media,music-video  brand=Netflix,Adobe
 *   min=200  max=3000 (in the display currency)  duration=1m,3m,6m,12m,lifetime
 *   stock=1  instant=1  sale=1  featured=1  trending=1  bestseller=1  new=1
 *   sort=featured|best_selling|newest|price_asc|price_desc|discount|name_asc  page=2
 */

export const DURATIONS = ['1m', '3m', '6m', '12m', 'lifetime'] as const;
export type DurationKey = (typeof DURATIONS)[number];

export const DURATION_LABELS: Record<DurationKey, string> = {
  '1m': '1 month',
  '3m': '3 months',
  '6m': '6 months',
  '12m': '12 months',
  lifetime: 'Lifetime',
};

export const SORTS = ['featured', 'best_selling', 'newest', 'price_asc', 'price_desc', 'discount', 'name_asc'] as const;
export type SortKey = (typeof SORTS)[number];

export const SORT_LABELS: Record<SortKey, string> = {
  featured: 'Featured',
  best_selling: 'Best selling',
  newest: 'Newest',
  price_asc: 'Price: low to high',
  price_desc: 'Price: high to low',
  discount: 'Biggest discount',
  name_asc: 'Name: A to Z',
};

export const PAGE_SIZE = 24;

export interface CatalogFilters {
  q?: string;
  /** Category slugs. */
  categories: string[];
  brands: string[];
  minPrice?: number;
  maxPrice?: number;
  durations: DurationKey[];
  inStock: boolean;
  instant: boolean;
  onSale: boolean;
  featured: boolean;
  trending: boolean;
  bestseller: boolean;
  isNew: boolean;
  sort: SortKey;
  page: number;
}

type ParamSource = URLSearchParams | Record<string, string | string[] | undefined>;

function get(src: ParamSource, key: string): string | undefined {
  if (src instanceof URLSearchParams) return src.get(key) ?? undefined;
  const v = src[key];
  return Array.isArray(v) ? v[0] : v;
}

function list(src: ParamSource, key: string): string[] {
  return (get(src, key) || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 30);
}

function numOrUndef(v: string | undefined): number | undefined {
  if (v === undefined || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

const flag = (src: ParamSource, key: string) => get(src, key) === '1';

export function parseCatalogQuery(src: ParamSource): CatalogFilters {
  const sort = get(src, 'sort') as SortKey | undefined;
  const page = Math.max(1, Math.floor(Number(get(src, 'page')) || 1));
  return {
    q: (get(src, 'q') || '').trim().slice(0, 80) || undefined,
    categories: list(src, 'category').map(s => s.toLowerCase()),
    brands: list(src, 'brand'),
    minPrice: numOrUndef(get(src, 'min')),
    maxPrice: numOrUndef(get(src, 'max')),
    durations: list(src, 'duration').filter((d): d is DurationKey => (DURATIONS as readonly string[]).includes(d)),
    inStock: flag(src, 'stock'),
    instant: flag(src, 'instant'),
    onSale: flag(src, 'sale'),
    featured: flag(src, 'featured'),
    trending: flag(src, 'trending'),
    bestseller: flag(src, 'bestseller'),
    isNew: flag(src, 'new'),
    sort: sort && (SORTS as readonly string[]).includes(sort) ? sort : 'featured',
    page,
  };
}

/** Builds the query string (without "?"); default values are omitted so URLs stay short. */
export function buildCatalogQuery(f: Partial<CatalogFilters>): string {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  if (f.categories?.length) p.set('category', f.categories.join(','));
  if (f.brands?.length) p.set('brand', f.brands.join(','));
  if (f.minPrice !== undefined) p.set('min', String(f.minPrice));
  if (f.maxPrice !== undefined) p.set('max', String(f.maxPrice));
  if (f.durations?.length) p.set('duration', f.durations.join(','));
  if (f.inStock) p.set('stock', '1');
  if (f.instant) p.set('instant', '1');
  if (f.onSale) p.set('sale', '1');
  if (f.featured) p.set('featured', '1');
  if (f.trending) p.set('trending', '1');
  if (f.bestseller) p.set('bestseller', '1');
  if (f.isNew) p.set('new', '1');
  if (f.sort && f.sort !== 'featured') p.set('sort', f.sort);
  if (f.page && f.page > 1) p.set('page', String(f.page));
  return p.toString();
}

/** Number of active filters (for the "Filters (3)" button and the chip row). */
export function activeFilterCount(f: CatalogFilters): number {
  return (
    (f.q ? 1 : 0) +
    f.categories.length +
    f.brands.length +
    (f.minPrice !== undefined || f.maxPrice !== undefined ? 1 : 0) +
    f.durations.length +
    [f.inStock, f.instant, f.onSale, f.featured, f.trending, f.bestseller, f.isNew].filter(Boolean).length
  );
}
