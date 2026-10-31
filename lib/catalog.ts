import { db, query } from '@/lib/db';
import type { Currency, Product } from '@/lib/db/types';
import { getUsdPkrRate } from '@/lib/fx';
import { PAGE_SIZE, type CatalogFilters, type DurationKey } from '@/lib/catalog-query';

/**
 * Server-side catalogue filtering for /shop and /categories/[slug] (Postgres,
 * parameterised). Prices are compared in the display currency: USD prices are
 * computed in SQL with the same rules as lib/pricing.ts (auto / percent /
 * amount / fixed, store default markup for auto).
 *
 * Facet counts for categories, brands and durations apply every other active
 * filter (not their own), so a zero count means "no results if you pick this".
 */

export interface CatalogFacets {
  categories: Array<{ id: string; slug: string; name: string; count: number }>;
  brands: Array<{ name: string; count: number }>;
  durations: Array<{ key: DurationKey; count: number }>;
  /** Catalogue-wide bounds in the display currency (for the range slider). */
  price: { min: number; max: number };
}

export interface CatalogResult {
  products: Product[];
  total: number;
  /** All active products (for "Showing 12 of 20"). */
  catalogTotal: number;
  page: number;
  pageSize: number;
  currency: Currency;
  facets: CatalogFacets;
}

type ClauseKey = 'q' | 'category' | 'brand' | 'price' | 'duration' | 'stock' | 'instant' | 'sale' | 'featured' | 'trending' | 'bestseller' | 'new';

export async function searchCatalog(filters: CatalogFilters, currency: Currency): Promise<CatalogResult> {
  const settings = await db.getSiteSettings();
  const cur: Currency = currency === 'USD' && settings.usdEnabled ? 'USD' : 'PKR';
  const rate = cur === 'USD' ? (await getUsdPkrRate()).rate : 1;
  const def = settings.usdPricing;

  // $1 currency, $2 rate, $3 default mode, $4 default percent, $5 default amount
  const base: unknown[] = [cur, rate, def.mode, def.percent || 0, def.amount || 0];
  const cte = `
    WITH v AS (
      SELECT pv.product_id, pv.price AS pkr, pv.compare_at_price AS cmp,
        CASE pv.usd_pricing_mode
          WHEN 'fixed' THEN COALESCE(NULLIF(pv.usd_price, 0), pv.price / $2)
          WHEN 'percent' THEN pv.price / $2 * (1 + COALESCE(pv.usd_markup_percent, 0) / 100)
          WHEN 'amount' THEN pv.price / $2 + COALESCE(pv.usd_markup_amount, 0)
          ELSE CASE $3 WHEN 'percent' THEN pv.price / $2 * (1 + $4::numeric / 100) WHEN 'amount' THEN pv.price / $2 + $5::numeric ELSE pv.price / $2 END
        END AS usd,
        CASE WHEN pv.expiry_days IS NULL OR pv.expiry_days > 366 THEN 'lifetime'
             WHEN pv.expiry_days <= 31 THEN '1m' WHEN pv.expiry_days <= 93 THEN '3m'
             WHEN pv.expiry_days <= 186 THEN '6m' ELSE '12m' END AS dur,
        CASE pv.stock_mode
          WHEN 'vault' THEN (SELECT count(*) FROM inventory_items i WHERE i.variant_id = pv.id AND i.status = 'available')
          WHEN 'manual' THEN pv.stock ELSE 0 END AS avail,
        COALESCE(pv.delivery_time, '') AS vdelivery
      FROM product_variants pv WHERE pv.status = 'active'
    ), sold AS (
      SELECT oi.product_id, sum(oi.quantity)::int AS n FROM order_items oi JOIN orders o ON o.id = oi.order_id
       WHERE o.order_status = 'completed' GROUP BY oi.product_id
    ), p AS (
      SELECT p.id, p.name, COALESCE(p.brand, '') AS brand, p.category_id, c.slug AS cslug, COALESCE(c.name, '') AS cname,
        p.tags::text AS tags, p.featured, p.bestseller, p.trending, p.is_new, p.display_order, p.created_at, p.delivery_time,
        min(CASE WHEN $1 = 'USD' THEN v.usd ELSE v.pkr END) AS from_price,
        array_agg(DISTINCT v.dur) AS durs,
        bool_or(v.avail > 0) AS in_stock,
        bool_or(v.cmp > v.pkr) AS on_sale,
        bool_or(v.vdelivery ILIKE '%instant%') OR p.delivery_time ILIKE '%instant%' AS instant,
        max(CASE WHEN v.cmp > v.pkr AND v.cmp > 0 THEN (v.cmp - v.pkr) / v.cmp ELSE 0 END) AS max_discount,
        COALESCE(max(s.n), 0) AS sold
      FROM products p
      JOIN v ON v.product_id = p.id
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN sold s ON s.product_id = p.id
      WHERE p.status = 'active' AND (c.id IS NULL OR c.status = 'active')
      GROUP BY p.id, c.slug, c.name
    )`;

  // Each clause renders against its own parameter list, so facet queries can
  // leave one clause out without leaving an unused $n behind.
  type Add = (value: unknown) => string;
  const clauses: Partial<Record<ClauseKey, (add: Add) => string>> = {};
  if (filters.q) {
    const term = `%${filters.q.replace(/[%_\\]/g, m => `\\${m}`)}%`;
    clauses.q = add => {
      const t = add(term);
      return `(p.name ILIKE ${t} OR p.brand ILIKE ${t} OR p.cname ILIKE ${t} OR p.tags ILIKE ${t})`;
    };
  }
  if (filters.categories.length) clauses.category = add => `p.cslug = ANY(${add(filters.categories)}::text[])`;
  if (filters.brands.length) clauses.brand = add => `p.brand = ANY(${add(filters.brands)}::text[])`;
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    clauses.price = add => {
      const parts: string[] = [];
      if (filters.minPrice !== undefined) parts.push(`p.from_price >= ${add(filters.minPrice)}`);
      if (filters.maxPrice !== undefined) parts.push(`p.from_price <= ${add(filters.maxPrice)}`);
      return parts.join(' AND ');
    };
  }
  if (filters.durations.length) clauses.duration = add => `p.durs && ${add(filters.durations)}::text[]`;
  if (filters.inStock) clauses.stock = () => 'p.in_stock';
  if (filters.instant) clauses.instant = () => 'p.instant';
  if (filters.onSale) clauses.sale = () => 'p.on_sale';
  if (filters.featured) clauses.featured = () => 'p.featured';
  if (filters.trending) clauses.trending = () => '(p.trending OR p.bestseller)';
  if (filters.bestseller) clauses.bestseller = () => 'p.bestseller';
  if (filters.isNew) clauses.new = () => 'p.is_new';

  const where = (exclude?: ClauseKey): { sql: string; params: unknown[] } => {
    const params = [...base];
    const add: Add = value => {
      params.push(value);
      return `$${params.length}`;
    };
    const list = (Object.entries(clauses) as Array<[ClauseKey, (add: Add) => string]>).filter(([k]) => k !== exclude).map(([, build]) => build(add));
    return { sql: list.length ? `WHERE ${list.join(' AND ')}` : '', params };
  };
  const order: Record<CatalogFilters['sort'], string> = {
    featured: 'p.featured DESC, p.bestseller DESC, p.display_order ASC, p.created_at ASC',
    best_selling: 'p.sold DESC, p.bestseller DESC, p.display_order ASC',
    newest: 'p.created_at DESC',
    price_asc: 'p.from_price ASC, p.name ASC',
    price_desc: 'p.from_price DESC, p.name ASC',
    discount: 'p.max_discount DESC, p.from_price ASC',
    name_asc: 'p.name ASC',
  };

  const offset = (filters.page - 1) * PAGE_SIZE;
  const all = where();
  const noCat = where('category');
  const noBrand = where('brand');
  const noDur = where('duration');
  const [pageRows, countRow, catRows, brandRows, durRows, boundRow, allRows] = await Promise.all([
    query<{ id: string }>(`${cte} SELECT p.id FROM p ${all.sql} ORDER BY ${order[filters.sort]} LIMIT ${PAGE_SIZE} OFFSET ${offset}`, all.params),
    query<{ n: number; all: number }>(`${cte} SELECT (SELECT count(*) FROM p ${all.sql})::int AS n, (SELECT count(*) FROM p)::int AS all`, all.params),
    query<{ id: string; slug: string; name: string; display_order: number; n: number }>(
      `${cte} SELECT c.id, c.slug, c.name, c.display_order, count(p.id)::int AS n
         FROM categories c LEFT JOIN (SELECT * FROM p ${noCat.sql}) p ON p.category_id = c.id
        WHERE c.status = 'active' GROUP BY c.id ORDER BY c.display_order, c.name`,
      noCat.params,
    ),
    query<{ brand: string; n: number }>(
      `${cte} SELECT p.brand, count(*)::int AS n FROM p ${noBrand.sql || 'WHERE true'} AND p.brand <> '' GROUP BY p.brand ORDER BY p.brand`,
      noBrand.params,
    ),
    query<{ d: DurationKey; n: number }>(`${cte} SELECT d, count(*)::int AS n FROM p, unnest(p.durs) d ${noDur.sql} GROUP BY d`, noDur.params),
    query<{ lo: string | null; hi: string | null }>(`${cte} SELECT min(p.from_price) AS lo, max(p.from_price) AS hi FROM p`, base),
    query<{ kind: 'brand' | 'dur'; v: string }>(
      `${cte} SELECT DISTINCT 'brand' AS kind, p.brand AS v FROM p WHERE p.brand <> '' UNION SELECT DISTINCT 'dur', d FROM p, unnest(p.durs) d`,
      base,
    ),
  ]);

  const durMap = new Map(durRows.map(r => [r.d, r.n]));
  const brandMap = new Map(brandRows.map(r => [r.brand, r.n]));
  const allBrands = allRows.filter(r => r.kind === 'brand').map(r => r.v).sort((a, b) => a.localeCompare(b));
  const allDurs = new Set(allRows.filter(r => r.kind === 'dur').map(r => r.v));
  const roundBound = (n: number, up: boolean) => (cur === 'USD' ? (up ? Math.ceil(n) : Math.floor(n)) : up ? Math.ceil(n / 100) * 100 : Math.floor(n / 100) * 100);
  const lo = Number(boundRow[0]?.lo ?? 0);
  const hi = Number(boundRow[0]?.hi ?? 0);

  return {
    products: await db.getProductsByIds(pageRows.map(r => r.id)),
    total: countRow[0]?.n ?? 0,
    catalogTotal: countRow[0]?.all ?? 0,
    page: filters.page,
    pageSize: PAGE_SIZE,
    currency: cur,
    facets: {
      categories: catRows.map(r => ({ id: r.id, slug: r.slug, name: r.name, count: r.n })),
      brands: allBrands.map(name => ({ name, count: brandMap.get(name) || 0 })),
      durations: (['1m', '3m', '6m', '12m', 'lifetime'] as DurationKey[]).filter(k => allDurs.has(k)).map(k => ({ key: k, count: durMap.get(k) || 0 })),
      price: { min: Math.max(0, roundBound(lo, false)), max: roundBound(hi, true) },
    },
  };
}
