import React from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import { CategoriesClient } from './categories-client';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const categories = await db.getCategories();
  const products = await db.getProducts();

  return (
    <AdminLayout>
      <CategoriesClient initialCategories={categories} products={products} />
    </AdminLayout>
  );
}
