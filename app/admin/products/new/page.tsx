import React from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import { getUsdPkrRate } from '@/lib/fx';
import { ProductForm } from '../product-form';
import { requireAdminPage } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminNewProductPage() {
  await requireAdminPage();
  const [categories, settings, fx] = await Promise.all([db.getCategories(), db.getSiteSettings(), getUsdPkrRate().catch(() => null)]);
  return (
    <AdminLayout>
      <ProductForm categories={categories} rate={fx?.rate || settings.fallbackUsdRate} usdDefaults={settings.usdPricing} />
    </AdminLayout>
  );
}
