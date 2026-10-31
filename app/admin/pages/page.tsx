import React from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import { LegalCmsClient } from './legal-cms-client';
import { requireAdminPage } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminLegalPagesPage() {
  await requireAdminPage();
  const pages = await db.getLegalPages();

  return (
    <AdminLayout>
      <LegalCmsClient initialPages={pages} />
    </AdminLayout>
  );
}
