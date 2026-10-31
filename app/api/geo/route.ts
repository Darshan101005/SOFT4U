import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** GET /api/geo -> the country/city Vercel detects for this visitor (used to check the PKR lock). */
export async function GET(req: NextRequest) {
  const h = req.headers;
  const country = (h.get('x-vercel-ip-country') || '').toUpperCase() || null;
  const city = h.get('x-vercel-ip-city');
  return NextResponse.json(
    {
      country,
      city: city ? decodeURIComponent(city) : null,
      pkrAllowed: country === 'PK',
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
