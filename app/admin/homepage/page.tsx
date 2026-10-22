import React from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import { HomepageCmsClient } from './homepage-cms-client';

export const dynamic = 'force-dynamic';

export default async function AdminHomepageCmsPage() {
  const sections = await db.getHomepageSections();

  return (
    <AdminLayout>
      <HomepageCmsClient initialSections={sections} />
    </AdminLayout>
  );
}
