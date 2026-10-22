import React from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import { InventoryClient } from './inventory-client';

export const dynamic = 'force-dynamic';

export default async function AdminInventoryPage() {
  const inventory = await db.getInventory();
  const products = await db.getProducts();

  return (
    <AdminLayout>
      <InventoryClient initialInventory={inventory} products={products} />
    </AdminLayout>
  );
}
