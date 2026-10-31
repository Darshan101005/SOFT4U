import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { queryOne } from '@/lib/db';
import { getPrivateImageUrl } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

/** GET ?i=<index> -> 302 to a 10-minute signed URL of one private payment screenshot (admins only). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;
  const row = await queryOne<{ image_public_id: string | null; image_format: string | null; images: Array<{ publicId: string; format: string }> }>(
    `SELECT image_public_id, image_format, images FROM payment_proofs WHERE id = $1`,
    [id],
  );
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const list = Array.isArray(row.images) && row.images.length ? row.images : row.image_public_id ? [{ publicId: row.image_public_id, format: row.image_format || 'jpg' }] : [];
  const index = Math.max(0, Math.floor(Number(req.nextUrl.searchParams.get('i') || 0)));
  const image = list[index];
  if (!image) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.redirect(getPrivateImageUrl(image.publicId, image.format || 'jpg'), { headers: { 'Cache-Control': 'private, no-store' } });
}
