import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { db, queryOne } from '@/lib/db';
import type { Order } from '@/lib/db/types';

export const dynamic = 'force-dynamic';

const STATUSES: Order['orderStatus'][] = ['pending', 'under_review', 'processing', 'completed', 'rejected', 'cancelled', 'refunded'];

/**
 * GET ?status=<status|all>&search=&page=&limit=  -> { orders, total, page, limit, counts }
 * GET ?countsOnly=1                               -> { counts } (sidebar badges)
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const sp = req.nextUrl.searchParams;
  const counts = await db.getOrderCounts();
  if (sp.get('countsOnly')) return NextResponse.json({ counts });

  const statusParam = sp.get('status') || 'all';
  const status = STATUSES.includes(statusParam as Order['orderStatus']) ? (statusParam as Order['orderStatus']) : undefined;
  const search = (sp.get('search') || '').trim().slice(0, 80) || undefined;
  const limit = Math.min(100, Math.max(5, Number(sp.get('limit')) || 25));
  const page = Math.max(1, Math.floor(Number(sp.get('page')) || 1));

  const where: string[] = [];
  const params: unknown[] = [];
  if (status) {
    params.push(status);
    where.push(`order_status = $${params.length}`);
  }
  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    where.push(
      `(lower(order_number) LIKE $${params.length} OR lower(customer_email) LIKE $${params.length} OR lower(customer_name) LIKE $${params.length} OR customer_whatsapp LIKE $${params.length})`,
    );
  }
  const [orders, totalRow] = await Promise.all([
    db.getOrders({ status, search, limit, offset: (page - 1) * limit }),
    queryOne<{ n: number }>(`SELECT count(*)::int AS n FROM orders ${where.length ? `WHERE ${where.join(' AND ')}` : ''}`, params),
  ]);
  return NextResponse.json({ orders, total: totalRow?.n ?? 0, page, limit, counts });
}
