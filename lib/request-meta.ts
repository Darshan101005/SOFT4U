/** Client IP / user agent / device label from request headers (Vercel sets x-forwarded-for). */

type HeaderSource = { headers: Headers } | Headers;

function h(src: HeaderSource): Headers {
  return src instanceof Headers ? src : src.headers;
}

export function clientIp(src: HeaderSource): string | null {
  const headers = h(src);
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first && first !== '::1' && first !== '127.0.0.1') return first;
  }
  const real = headers.get('x-real-ip');
  if (real && real !== '::1' && real !== '127.0.0.1') return real.trim();
  return null;
}

export function userAgent(src: HeaderSource): string {
  return h(src).get('user-agent') || '';
}

export function deviceName(ua: string): string {
  if (!ua) return 'Unknown device';
  let browser = 'Browser';
  if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('OPR/') || ua.includes('Opera')) browser = 'Opera';
  else if (ua.includes('SamsungBrowser')) browser = 'Samsung Internet';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Safari/')) browser = 'Safari';
  let os = 'Unknown OS';
  if (ua.includes('iPhone')) os = 'iPhone';
  else if (ua.includes('iPad')) os = 'iPad';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X') || ua.includes('Macintosh')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  return `${browser} on ${os}`;
}

export interface RequestMeta {
  ip: string | null;
  userAgent: string;
  device: string;
}

export function requestMeta(src: HeaderSource): RequestMeta {
  const ua = userAgent(src);
  return { ip: clientIp(src), userAgent: ua, device: deviceName(ua) };
}

/** Human date in Pakistan time for security emails. */
export function pkTime(date = new Date()): string {
  return `${date.toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Karachi' })} PKT`;
}
