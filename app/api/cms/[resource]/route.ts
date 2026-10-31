import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { errorResponse, readJson } from '@/lib/api';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ resource: string }> };
type Rec = Record<string, unknown>;

const str = (v: unknown, max = 2000) => (typeof v === 'string' ? v.trim().slice(0, max) : undefined);
const int = (v: unknown, d = 0) => (Number.isFinite(Number(v)) ? Math.floor(Number(v)) : d);
const date = (v: unknown) => (typeof v === 'string' && v.trim() ? new Date(v).toISOString() : undefined);
const url = (v: unknown) => {
  const s = str(v, 500);
  if (!s) return undefined;
  return /^(https?:\/\/|\/|#|mailto:|tel:)/i.test(s) ? s : undefined;
};

/** Per-resource: list, sanitise (returns a message on invalid input), create, update, delete. */
const RESOURCES: Record<
  string,
  {
    list: () => Promise<unknown[]>;
    clean: (b: Rec, creating: boolean) => Rec | string;
    create: (d: Rec) => Promise<unknown>;
    update: (id: string, d: Rec) => Promise<unknown>;
    remove: (id: string) => Promise<boolean>;
  }
> = {
  faqs: {
    list: () => db.getFAQs(),
    clean: b => {
      const question = str(b.question, 300);
      const answer = str(b.answer, 4000);
      if (!question || question.length < 5) return 'Enter the question';
      if (!answer) return 'Enter the answer';
      return { question, answer, category: str(b.category, 60) || 'General', displayOrder: int(b.displayOrder), status: b.status === 'disabled' ? 'disabled' : 'active' };
    },
    create: d => db.createFAQ(d as never),
    update: (id, d) => db.updateFAQ(id, d),
    remove: id => db.deleteFAQ(id),
  },
  testimonials: {
    list: () => db.getTestimonials(),
    clean: b => {
      const name = str(b.name, 80);
      const content = str(b.content, 1000);
      if (!name) return 'Enter the customer name';
      if (!content) return 'Enter the testimonial text';
      const rating = Math.min(5, Math.max(1, int(b.rating, 5)));
      return {
        name,
        content,
        rating,
        roleOrCompany: str(b.roleOrCompany, 80) || '',
        avatar: url(b.avatar) || '',
        featured: Boolean(b.featured),
        displayOrder: int(b.displayOrder),
        status: b.status === 'disabled' ? 'disabled' : 'active',
      };
    },
    create: d => db.createTestimonial(d as never),
    update: (id, d) => db.updateTestimonial(id, d),
    remove: id => db.deleteTestimonial(id),
  },
  banners: {
    list: () => db.getBanners(),
    clean: b => {
      const title = str(b.title, 120);
      const image = url(b.image);
      if (!title) return 'Enter a title';
      if (!image) return 'Add a banner image';
      const startDate = date(b.startDate);
      const endDate = date(b.endDate);
      if (startDate && endDate && endDate <= startDate) return 'The end date must be after the start date';
      return {
        title,
        subtitle: str(b.subtitle, 300) || '',
        image,
        mobileImage: url(b.mobileImage) || '',
        ctaText: str(b.ctaText, 40) || '',
        url: url(b.url) || '',
        startDate: startDate || '',
        endDate: endDate || '',
        priority: int(b.priority, 1),
        position: str(b.position, 40) || 'home',
        status: b.status === 'disabled' ? 'disabled' : 'active',
      };
    },
    create: d => db.createBanner(d as never),
    update: (id, d) => db.updateBanner(id, d),
    remove: id => db.deleteBanner(id),
  },
  announcements: {
    list: () => db.getAnnouncements(),
    clean: b => {
      const text = str(b.text, 200);
      if (!text) return 'Enter the announcement text';
      const startDate = date(b.startDate);
      const endDate = date(b.endDate);
      if (startDate && endDate && endDate <= startDate) return 'The end date must be after the start date';
      return { text, link: url(b.link) || '', ctaText: str(b.ctaText, 40) || '', priority: int(b.priority, 1), enabled: b.enabled !== false, startDate: startDate || '', endDate: endDate || '' };
    },
    create: d => db.createAnnouncement(d as never),
    update: (id, d) => db.updateAnnouncement(id, d),
    remove: id => db.deleteAnnouncement(id),
  },
  navigation: {
    list: () => db.getNavigation(),
    clean: b => {
      const label = str(b.label, 60);
      const href = url(b.url);
      if (!label) return 'Enter a label';
      if (!href) return 'Enter a link that starts with /, https:// , mailto: or tel:';
      const position = ['header', 'footer', 'mobile'].includes(String(b.position)) ? String(b.position) : 'header';
      return { label, url: href, position, displayOrder: int(b.displayOrder), visible: b.visible !== false, targetBlank: Boolean(b.targetBlank), parentId: str(b.parentId, 60) || null, icon: str(b.icon, 40) || '' };
    },
    create: d => db.addNavigationItem(d as never),
    update: (id, d) => db.updateNavigationItem(id, d),
    remove: id => db.deleteNavigationItem(id),
  },
};

/** GET -> { items } (admin view: every row, including disabled). */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const r = RESOURCES[(await params).resource];
  if (!r) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ items: await r.list() });
}

/**
 * POST { action: 'create', data } | { action: 'update', id, data } | { action: 'patch', id, data } (partial, no validation of missing fields)
 *      | { action: 'delete', id } | { action: 'reorder', ids: [] } (sets displayOrder / priority by position)
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const name = (await params).resource;
  const r = RESOURCES[name];
  if (!r) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  try {
    const body = await readJson(req);
    const { action, id } = body;
    if (action === 'create' || action === 'update') {
      const data = r.clean(body.data || {}, action === 'create');
      if (typeof data === 'string') return NextResponse.json({ error: data }, { status: 400 });
      const item = action === 'create' ? await r.create(data) : await r.update(String(id), data);
      if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ ok: true, item });
    }
    if (action === 'patch' && id) {
      // Small toggles (enabled / visible / status / featured) without resending the whole record.
      const allowed = ['enabled', 'visible', 'status', 'featured', 'targetBlank'];
      const data: Rec = {};
      for (const k of allowed) if (k in (body.data || {})) data[k] = k === 'status' ? (body.data[k] === 'disabled' ? 'disabled' : 'active') : Boolean(body.data[k]);
      const item = await r.update(String(id), data);
      if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ ok: true, item });
    }
    if (action === 'delete' && id) {
      return NextResponse.json({ ok: await r.remove(String(id)) });
    }
    if (action === 'reorder' && Array.isArray(body.ids)) {
      const key = name === 'banners' || name === 'announcements' ? 'priority' : 'displayOrder';
      for (let i = 0; i < body.ids.length; i++) await r.update(String(body.ids[i]), { [key]: i + 1 });
      return NextResponse.json({ ok: true, items: await r.list() });
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return errorResponse(err);
  }
}
