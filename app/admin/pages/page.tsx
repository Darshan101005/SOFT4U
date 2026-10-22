import React from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import { LegalCmsClient } from './legal-cms-client';

export const dynamic = 'force-dynamic';

export default async function AdminLegalPagesPage() {
  const pages = await db.getLegalPages();

  return (
    <AdminLayout>
      <LegalCmsClient initialPages={pages} />
    </AdminLayout>
  );
}
