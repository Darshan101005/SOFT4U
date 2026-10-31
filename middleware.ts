import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/admin-jwt';

/**
 * First line of admin protection (edge): a valid signed admin JWT is required
 * for every /admin page and every admin-only API. Route handlers and the
 * admin layout re-check the admin against the database (paused / deleted /
 * revoked), see lib/admin-auth.ts.
 */

const PUBLIC_ADMIN_PAGES = new Set(['/admin/login']);
const PUBLIC_ADMIN_APIS = new Set(['/api/admin/login', '/api/admin/2fa/login-verify', '/api/admin/logout']);

function needsAdmin(pathname: string, method: string): 'page' | 'api' | null {
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return PUBLIC_ADMIN_PAGES.has(pathname) ? null : 'page';
  }
  if (pathname.startsWith('/api/admin/') || pathname === '/api/admin') {
    return PUBLIC_ADMIN_APIS.has(pathname) ? null : 'api';
  }
  const write = method !== 'GET' && method !== 'HEAD';
  if (pathname.startsWith('/api/cms/') && write) return 'api';
  if (pathname === '/api/announcements' && write) return 'api';
  if (pathname === '/api/telegram/setup') return 'api';
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const kind = needsAdmin(pathname, request.method);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  if (kind) {
    const payload = await verifyAdminToken(request.cookies.get(ADMIN_COOKIE)?.value);
    if (!payload) {
      if (kind === 'api') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      url.search = pathname === '/admin' ? '' : `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/admin/:path*', '/api/cms/:path*', '/api/announcements', '/api/telegram/setup'],
};
