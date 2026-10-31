import { db } from '@/lib/db';
import type { Currency, Product } from '@/lib/db/types';
import { searchCatalog, type CatalogResult } from '@/lib/catalog';
import { parseCatalogQuery, PAGE_SIZE, type CatalogFilters } from '@/lib/catalog-query';
import { getPricing, safe } from '@/app/_store/storefront';

/** Data for /shop and /categories/[slug]: first results page, ratings, category names and a "popular" fallback. */
export async function loadCatalogPage(searchParams: Record<string, string | string[] | undefined>, lockedCategory?: string) {
  const pricing = await getPricing();
  const parsed = parseCatalogQuery(searchParams);
  const filters: CatalogFilters = lockedCategory ? { ...parsed, categories: [lockedCategory] } : parsed;
  const empty = (currency: Currency): CatalogResult => ({
    products: [],
    total: 0,
    catalogTotal: 0,
    page: 1,
    pageSize: PAGE_SIZE,
    currency,
    facets: { categories: [], brands: [], durations: [], price: { min: 0, max: 0 } },
  });
  const [result, ratings, categories] = await Promise.all([
    safe(() => searchCatalog(filters, pricing.currency), empty(pricing.currency)),
    safe(() => db.getRatingSummaries(), {} as Record<string, { average: number; count: number }>),
    safe(() => db.getCategories(true), []),
  ]);
  let popular: Product[] = [];
  if (result.total === 0) {
    popular = (
      await safe(
        () => searchCatalog({ ...parseCatalogQuery({}), sort: 'best_selling', ...(lockedCategory ? { categories: [lockedCategory] } : {}) }, pricing.currency),
        empty(pricing.currency),
      )
    ).products.slice(0, 6);
    if (popular.length === 0 && lockedCategory) {
      popular = (await safe(() => searchCatalog({ ...parseCatalogQuery({}), sort: 'best_selling' }, pricing.currency), empty(pricing.currency))).products.slice(0, 6);
    }
  }
  const categoryNames = Object.fromEntries(categories.map(c => [c.id, c.name]));
  return { pricing, filters, result, ratings, categoryNames, popular };
}
