import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { Currency } from '@/lib/db/types';
import { errorResponse, readJson } from '@/lib/api';
import { CheckoutError, priceCart } from '@/lib/checkout';
import { getUsdPkrRate } from '@/lib/fx';
import { getSessionUser } from '@/lib/session';
import { allowedCurrency } from '@/lib/currency-pref';
import { variantCompareAt, variantPrice } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

interface LineIn {
  productId?: string;
  variantId?: string;
  quantity?: number;
}

/**
 * POST { items: [{ productId, variantId, quantity }], currency, couponCode? }
 *  -> { currency, lines: [{ productId, variantId, ok, problem?, price, compareAt?, quantity, maxQuantity, ... }],
 *       subtotal, discount, total, couponCode?, couponError? }
 *
 * Display quote for the cart and checkout pages. Uses the same server pricing
 * as POST /api/checkout (lib/checkout priceCart); each line is also checked on
 * its own so one unavailable item does not hide the rest of the cart.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await readJson(req);
    const settings = await db.getSiteSettings();
    const currency: Currency = await allowedCurrency(body.currency, req.headers, settings);
    const rate = currency === 'USD' ? (await getUsdPkrRate()).rate : 1;
    const input: LineIn[] = Array.isArray(body.items) ? body.items.slice(0, 20) : [];

    const lines = await Promise.all(
      input.map(async raw => {
        const productId = String(raw.productId || '');
        const variantId = String(raw.variantId || '');
        const quantity = Math.min(10, Math.max(1, Math.floor(Number(raw.quantity) || 1)));
        const product = productId ? await db.getProductById(productId) : null;
        const variant = product?.variants.find(v => v.id === variantId);
        if (!product || product.status !== 'active' || !variant || variant.status !== 'active') {
          return { productId, variantId, quantity, ok: false, problem: 'No longer available', price: 0, maxQuantity: 0 };
        }
        const maxQuantity = variant.stockMode === 'preorder' ? 10 : Math.max(0, Math.min(10, variant.stock));
        const problem = maxQuantity === 0 ? 'Out of stock' : quantity > maxQuantity ? `Only ${maxQuantity} left` : undefined;
        return {
          productId,
          variantId,
          quantity,
          ok: !problem,
          problem,
          price: variantPrice(variant, currency, rate, settings.usdPricing),
          compareAt: variantCompareAt(variant, currency, rate, settings.usdPricing),
          maxQuantity,
          productName: product.name,
          variantName: variant.name,
          slug: product.slug,
          image: product.logo || product.images[0],
          deliveryTime: variant.deliveryTime || product.deliveryTime,
          stockMode: variant.stockMode,
        };
      }),
    );

    const valid = lines.filter(l => l.ok).map(l => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity }));
    let subtotal = 0;
    let discount = 0;
    let total = 0;
    let couponCode: string | undefined;
    let couponError: string | undefined;
    if (valid.length) {
      const user = await getSessionUser();
      const code = body.couponCode ? String(body.couponCode).trim() : '';
      let priced;
      try {
        priced = await priceCart({ lines: valid, currency, couponCode: code || undefined, customerId: user?.id, email: user?.email });
      } catch (err) {
        if (!(err instanceof CheckoutError) || err.code !== 'BAD_COUPON') throw err;
        couponError = err.message;
        priced = await priceCart({ lines: valid, currency, customerId: user?.id, email: user?.email });
      }
      subtotal = priced.subtotal;
      discount = priced.discount;
      total = priced.total;
      couponCode = priced.coupon?.code;
    }

    return NextResponse.json(
      { currency, lines, subtotal, discount, total, couponCode, couponError, allOk: lines.length > 0 && lines.every(l => l.ok) },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (err) {
    return errorResponse(err);
  }
}
