import React from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import { FaqsClient } from './faqs-client';
import { requireAdminPage } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminFAQsPage() {
  await requireAdminPage();
  const faqs = await db.getFAQs();
  return (
    <AdminLayout>
      <FaqsClient initialItems={faqs} />
    </AdminLayout>
  );
}
