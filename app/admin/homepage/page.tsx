import React from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import { HomepageCmsClient } from './homepage-cms-client';
import { requireAdminPage } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminHomepageCmsPage() {
  await requireAdminPage();
  const sections = await db.getHomepageSections();

  return (
    <AdminLayout>
      <HomepageCmsClient initialSections={sections} />
    </AdminLayout>
  );
}
