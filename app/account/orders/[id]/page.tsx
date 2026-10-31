import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { db } from '@/lib/db';
import { toPublicOrder } from '@/lib/order-access';
import { OrderView } from '@/components/order/order-view';
import { getStoreInfo, safe } from '@/app/_store/storefront';
import { requireAccountUser } from '../../require-user';

export const dynamic = 'force-dynamic';

export default async function AccountOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const key = decodeURIComponent(id);
  const user = await requireAccountUser(`/account/orders/${key}`);
  const order = (await safe(() => db.getOrderByNumber(key), null)) || (key.startsWith('ord_') ? await safe(() => db.getOrderById(key), null) : null);
  if (!order || order.customerId !== user.id) notFound();
  const [publicOrder, store] = await Promise.all([toPublicOrder(order, true), getStoreInfo()]);

  return (
    <div className="space-y-4">
      <Link href="/account/orders" className="inline-flex items-center gap-1 min-h-11 text-sm font-semibold text-charcoal-muted hover:text-charcoal">
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        All orders
      </Link>
      <h1 className="sr-only">Order {order.orderNumber}</h1>
      <OrderView initial={publicOrder} whatsappHref={store.whatsappHref} storeName={store.name} />
    </div>
  );
}
