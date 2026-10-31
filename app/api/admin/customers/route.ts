import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { query, queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** CRM segments (aliases: u = users, o = per-customer order stats). */
const SEGMENT_SQL: Record<string, string> = {
  all: 'TRUE',
  leads: 'COALESCE(o.cnt, 0) = 0',
  customers: 'COALESCE(o.cnt, 0) > 0',
  active: `u.last_seen_at > now() - interval '30 days'`,
  dormant: `(u.last_seen_at IS NULL OR u.last_seen_at < now() - interval '30 days')`,
  blocked: `u.status = 'suspended'`,
  new: `u.created_at > now() - interval '7 days'`,
  unverified: 'u.email_verified_at IS NULL',
};

const JOINS = `
  FROM users u
  LEFT JOIN (
    SELECT customer_id, count(*) AS cnt,
           COALESCE(sum(total_pkr) FILTER (WHERE order_status IN ('completed')), 0) AS spend,
           max(created_at) AS last_order_at
      FROM orders WHERE customer_id IS NOT NULL GROUP BY customer_id
  ) o ON o.customer_id = u.id`;

/** GET ?segment=&search=&page=&limit= -> { customers, total, counts, page, limit } */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const sp = req.nextUrl.searchParams;
  const segment = SEGMENT_SQL[sp.get('segment') || 'all'] ? sp.get('segment') || 'all' : 'all';
  const search = (sp.get('search') || '').trim().slice(0, 80);
  const limit = Math.min(100, Math.max(5, Number(sp.get('limit')) || 25));
  const page = Math.max(1, Math.floor(Number(sp.get('page')) || 1));

  const where = [SEGMENT_SQL[segment]];
  const params: unknown[] = [];
  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    const i = params.length;
    where.push(`(lower(u.name) LIKE $${i} OR lower(u.email) LIKE $${i} OR u.phone LIKE $${i} OR u.whatsapp LIKE $${i} OR lower(u.telegram_username) LIKE $${i})`);
  }
  const whereSql = `WHERE ${where.join(' AND ')}`;

  const [rows, totalRow, counts] = await Promise.all([
    query(
      `SELECT u.id, u.name, u.email, u.phone, u.whatsapp, u.telegram_username, u.status, u.email_verified_at, u.totp_enabled,
              u.last_seen_at, u.last_login_at, u.created_at,
              COALESCE(o.cnt, 0)::int AS order_count, COALESCE(o.spend, 0)::float AS spend_pkr, o.last_order_at,
              EXISTS (SELECT 1 FROM telegram_users t WHERE t.user_id = u.id) AS telegram_linked
       ${JOINS} ${whereSql}
       ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, (page - 1) * limit],
    ),
    queryOne<{ n: number }>(`SELECT count(*)::int AS n ${JOINS} ${whereSql}`, params),
    queryOne<Record<string, number>>(
      `SELECT count(*)::int AS all,
              count(*) FILTER (WHERE ${SEGMENT_SQL.leads})::int AS leads,
              count(*) FILTER (WHERE ${SEGMENT_SQL.customers})::int AS customers,
              count(*) FILTER (WHERE ${SEGMENT_SQL.active})::int AS active,
              count(*) FILTER (WHERE ${SEGMENT_SQL.dormant})::int AS dormant,
              count(*) FILTER (WHERE ${SEGMENT_SQL.blocked})::int AS blocked,
              count(*) FILTER (WHERE ${SEGMENT_SQL.new})::int AS new,
              count(*) FILTER (WHERE ${SEGMENT_SQL.unverified})::int AS unverified
       ${JOINS}`,
    ),
  ]);

  const iso = (v: unknown) => (v ? new Date(v as string).toISOString() : null);
  const customers = rows.map(r => ({
    id: r.id as string,
    name: r.name as string,
    email: r.email as string,
    phone: (r.phone as string) || null,
    whatsapp: (r.whatsapp as string) || null,
    telegram: (r.telegram_username as string) || null,
    telegramLinked: Boolean(r.telegram_linked),
    status: r.status as 'active' | 'suspended',
    emailVerified: Boolean(r.email_verified_at),
    twoFactorEnabled: Boolean(r.totp_enabled),
    lastSeenAt: iso(r.last_seen_at),
    lastLoginAt: iso(r.last_login_at),
    createdAt: iso(r.created_at),
    orderCount: Number(r.order_count) || 0,
    spendPkr: Number(r.spend_pkr) || 0,
    lastOrderAt: iso(r.last_order_at),
  }));
  return NextResponse.json({ customers, total: totalRow?.n ?? 0, counts: counts || {}, page, limit });
}
