import React from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import { AnnouncementsClient } from './announcements-client';
import { requireAdminPage } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminAnnouncementsPage() {
  await requireAdminPage();
  const announcements = await db.getAnnouncements();

  return (
    <AdminLayout>
      <AnnouncementsClient initialAnnouncements={announcements} />
    </AdminLayout>
  );
}
