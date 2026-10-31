import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { SiteSettings } from '@/lib/db/types';
import { requireAdmin } from '@/lib/admin-auth';
import { errorResponse, readJson } from '@/lib/api';

export const dynamic = 'force-dynamic';

const KEYS: Array<keyof SiteSettings> = [
  'siteName',
  'tagline',
  'description',
  'logoUrl',
  'faviconUrl',
  'contactEmail',
  'contactPhone',
  'contactWhatsapp',
  'contactTelegram',
  'contactAddress',
  'businessHours',
  'usdEnabled',
  'fallbackUsdRate',
  'usdPricing',
  'taxRate',
  'orderAlertEmails',
  'maintenanceMode',
  'maintenanceMessage',
  'requirePhone',
  'requireWhatsapp',
  'branding',
  'socialLinks',
  'seoDefaults',
  'aiSupportEnabled',
  'aiSupportName',
  'aiWelcomeMessage',
];

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const settings = await db.getSiteSettings();
  return NextResponse.json({ settings });
}

/** POST <partial SiteSettings> -> { settings }. Unknown keys are ignored; nested objects are merged. */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  try {
    const body = await readJson<Record<string, unknown>>(req);
    const updates: Record<string, unknown> = {};
    for (const k of KEYS) if (k in body) updates[k] = body[k];
    if ('fallbackUsdRate' in updates) {
      const r = Number(updates.fallbackUsdRate);
      if (!(r > 1 && r < 10000)) return NextResponse.json({ error: 'Enter a realistic fallback rate (PKR per 1 USD)' }, { status: 400 });
      updates.fallbackUsdRate = r;
    }
    if (updates.usdPricing && typeof updates.usdPricing === 'object') {
      const p = updates.usdPricing as Record<string, unknown>;
      const mode = ['auto', 'percent', 'amount'].includes(String(p.mode)) ? String(p.mode) : 'auto';
      const roundTo = [0.01, 0.05, 0.1, 0.25, 0.5, 1].includes(Number(p.roundTo)) ? Number(p.roundTo) : 0.01;
      updates.usdPricing = { mode, percent: Number(p.percent) || 0, amount: Number(p.amount) || 0, roundTo };
    }
    const updated = await db.updateSiteSettings(updates as Partial<SiteSettings>);
    return NextResponse.json({ success: true, settings: updated });
  } catch (err) {
    return errorResponse(err);
  }
}
