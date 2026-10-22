import React from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import { CouponsClient } from './coupons-client';

export const dynamic = 'force-dynamic';

export default async function AdminCouponsPage() {
  const coupons = await db.getCoupons();

  return (
    <AdminLayout>
      <CouponsClient initialCoupons={coupons} />
    </AdminLayout>
  );
}
