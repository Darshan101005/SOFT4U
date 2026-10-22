import React from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import { AnnouncementsClient } from './announcements-client';

export const dynamic = 'force-dynamic';

export default async function AdminAnnouncementsPage() {
  const announcements = await db.getAnnouncements();

  return (
    <AdminLayout>
      <AnnouncementsClient initialAnnouncements={announcements} />
    </AdminLayout>
  );
}
