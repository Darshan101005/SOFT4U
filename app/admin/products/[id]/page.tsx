import React from 'react';
import { notFound } from 'next/navigation';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import { getUsdPkrRate } from '@/lib/fx';
import { ProductForm } from '../product-form';
import { requireAdminPage } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminEditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const [product, categories, settings, fx] = await Promise.all([
    db.getProductById(id).then(p => p || db.getProductBySlug(id)),
    db.getCategories(),
    db.getSiteSettings(),
    getUsdPkrRate().catch(() => null),
  ]);
  if (!product) notFound();
  return (
    <AdminLayout>
      <ProductForm key={product.updatedAt} product={product} categories={categories} rate={fx?.rate || settings.fallbackUsdRate} usdDefaults={settings.usdPricing} />
    </AdminLayout>
  );
}
