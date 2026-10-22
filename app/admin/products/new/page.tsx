import React from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import { NewProductClient } from './new-product-client';

export const dynamic = 'force-dynamic';

export default async function AdminNewProductPage() {
  const categories = await db.getCategories();

  return (
    <AdminLayout>
      <NewProductClient categories={categories} />
    </AdminLayout>
  );
}
