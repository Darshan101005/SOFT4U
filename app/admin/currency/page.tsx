import React from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import { getUsdPkrRate } from '@/lib/fx';
import { CurrencyClient } from './currency-client';
import { requireAdminPage } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminCurrencyPage() {
  await requireAdminPage();
  const [settings, products, fx] = await Promise.all([db.getSiteSettings(), db.getProducts(), getUsdPkrRate().catch(() => null)]);
  const rows = products.flatMap(p =>
    p.variants.map(v => ({
      productId: p.id,
      product: p.name,
      productStatus: p.status,
      variant: v.name,
      variantStatus: v.status,
      price: v.price,
      compareAtPrice: v.compareAtPrice,
      usdPricingMode: v.usdPricingMode,
      usdPrice: v.usdPrice,
      usdMarkupPercent: v.usdMarkupPercent,
      usdMarkupAmount: v.usdMarkupAmount,
    })),
  );
  return (
    <AdminLayout>
      <CurrencyClient
        initial={{ usdEnabled: settings.usdEnabled, fallbackUsdRate: settings.fallbackUsdRate, usdPricing: settings.usdPricing }}
        fx={fx ? { rate: fx.rate, source: fx.source, fetchedAt: fx.fetchedAt, stale: fx.stale } : null}
        rows={rows}
      />
    </AdminLayout>
  );
}
