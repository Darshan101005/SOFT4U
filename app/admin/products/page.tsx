import React from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import { ProductsTableClient } from './products-table-client';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const products = await db.getProducts();
  const categories = await db.getCategories();

  return (
    <AdminLayout>
      <ProductsTableClient initialProducts={products} categories={categories} />
    </AdminLayout>
  );
}
