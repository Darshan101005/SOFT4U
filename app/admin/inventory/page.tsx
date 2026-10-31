import React from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import { InventoryClient } from './inventory-client';
import { requireAdminPage } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminInventoryPage({ searchParams }: { searchParams: Promise<{ productId?: string }> }) {
  await requireAdminPage();
  const { productId } = await searchParams;
  const [inventory, products] = await Promise.all([db.getInventory(), db.getProducts()]);
  return (
    <AdminLayout>
      <InventoryClient initialInventory={inventory} products={products} initialProductId={productId || 'all'} />
    </AdminLayout>
  );
}
