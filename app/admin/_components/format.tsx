/**
 * Date + device helpers shared by admin screens (client and server safe).
 * Dates render through <LocalTime>, in the viewing admin's own time zone.
 */
import React from 'react';
import { LocalTime } from '@/components/local-time';

/** "1 Nov 2026" in the viewer's zone. */
export function fmtDate(iso?: string | null): React.ReactElement {
  return <LocalTime iso={iso} format="date" />;
}

/** "1 Nov 2026, 3:20 AM" in the viewer's zone. */
export function fmtDateTime(iso?: string | null): React.ReactElement {
  return <LocalTime iso={iso} format="datetime" />;
}

/** "2 hours ago", or "Never" when empty. */
export function timeAgo(iso?: string | null): React.ReactElement {
  return <LocalTime iso={iso} format="ago" empty="Never" />;
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
