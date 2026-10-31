/** Date + device helpers shared by admin screens (client and server safe). */

function toDate(iso?: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(String(iso).replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function fmtDate(iso?: string | null): string {
  const d = toDate(iso);
  return d ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}

export function fmtDateTime(iso?: string | null): string {
  const d = toDate(iso);
  return d
    ? d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';
}

export function timeAgo(iso?: string | null): string {
  const d = toDate(iso);
  if (!d) return 'Never';
  const diff = Date.now() - d.getTime();
  const min = 60_000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (diff < min) return 'Just now';
  if (diff < hour) return `${Math.floor(diff / min)} min ago`;
  if (diff < day) return `${Math.floor(diff / hour)} h ago`;
  if (diff < 2 * day) return 'Yesterday';
  if (diff < 30 * day) return `${Math.floor(diff / day)} days ago`;
  return fmtDate(iso);
}

export function parseUserAgent(ua?: string | null): { browser: string; os: string; device: string } | null {
  if (!ua) return null;
  const os = /Windows/.test(ua)
    ? 'Windows'
    : /Android/.test(ua)
      ? 'Android'
      : /iPhone|iPad|iPod/.test(ua)
        ? 'iOS'
        : /Mac OS X|Macintosh/.test(ua)
          ? 'macOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : 'Unknown OS';
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\/|Opera/.test(ua)
      ? 'Opera'
      : /Chrome\//.test(ua)
        ? 'Chrome'
        : /Firefox\//.test(ua)
          ? 'Firefox'
          : /Safari\//.test(ua)
            ? 'Safari'
            : 'Unknown browser';
  const device = /iPad|Tablet/.test(ua) ? 'Tablet' : /Mobile|Android|iPhone|iPod/.test(ua) ? 'Mobile' : 'Desktop';
  return { browser, os, device };
}

export function slugify(v: string): string {
  return v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Reads a File as a data: URI. */
export function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the file'));
    reader.readAsDataURL(file);
  });
}
