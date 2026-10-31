import React from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import { PaymentMethodsClient } from './payment-methods-client';
import { requireAdminPage } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminPaymentMethodsPage() {
  await requireAdminPage();
  const methods = await db.getPaymentMethods();
  return (
    <AdminLayout>
      <PaymentMethodsClient initialMethods={methods} />
    </AdminLayout>
  );
}
