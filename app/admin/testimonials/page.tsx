import React from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import { TestimonialsClient } from './testimonials-client';
import { requireAdminPage } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminTestimonialsPage() {
  await requireAdminPage();
  const testimonials = await db.getTestimonials();
  return (
    <AdminLayout>
      <TestimonialsClient initialItems={testimonials} />
    </AdminLayout>
  );
}
