import React from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import { PaymentGatewaysClient } from './payment-gateways-client';

export const dynamic = 'force-dynamic';

export default async function AdminPaymentGatewaysPage() {
  const gateways = await db.getPaymentGateways();

  return (
    <AdminLayout>
      <PaymentGatewaysClient initialGateways={gateways} />
    </AdminLayout>
  );
}
