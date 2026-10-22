import React from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import { Package, Search, ExternalLink, ShieldCheck, Zap } from 'lucide-react';
import { AdminOrdersClient } from './admin-orders-client';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const orders = await db.getOrders();

  return (
    <AdminLayout>
      <AdminOrdersClient initialOrders={orders} />
    </AdminLayout>
  );
}
