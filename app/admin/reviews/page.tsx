import React from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import { ReviewsClient } from './reviews-client';

export const dynamic = 'force-dynamic';

export default async function AdminReviewsPage() {
  const reviews = await db.getReviews();
  const products = await db.getProducts();

  return (
    <AdminLayout>
      <ReviewsClient initialReviews={reviews} products={products} />
    </AdminLayout>
  );
}
