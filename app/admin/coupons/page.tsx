import React from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import { CouponsClient } from './coupons-client';
import { requireAdminPage } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminCouponsPage() {
  await requireAdminPage();
  const [coupons, products, categories] = await Promise.all([db.getCoupons(), db.getProducts(), db.getCategories()]);
  return (
    <AdminLayout>
      <CouponsClient
        initialCoupons={coupons}
        products={products.map(p => ({ id: p.id, name: p.name }))}
        categories={categories.map(c => ({ id: c.id, name: c.name }))}
      />
    </AdminLayout>
  );
}
