import React from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import { getUsdPkrRate } from '@/lib/fx';
import { ProductsTableClient } from './products-table-client';
import { requireAdminPage } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  await requireAdminPage();
  const [products, categories, settings, fx] = await Promise.all([db.getProducts(), db.getCategories(), db.getSiteSettings(), getUsdPkrRate().catch(() => null)]);
  return (
    <AdminLayout>
      <ProductsTableClient initialProducts={products} categories={categories} rate={fx?.rate || settings.fallbackUsdRate} usdDefaults={settings.usdPricing} />
    </AdminLayout>
  );
}
