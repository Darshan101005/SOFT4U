import React from 'react';
import Link from 'next/link';

/**
 * Small, safe Markdown renderer for CMS pages (legal pages, About). Output is
 * React elements only (no raw HTML), so admin-entered text cannot inject markup.
 * Supports #/##/### headings, paragraphs, - / * / 1. lists, **bold**, *italic*,
 * `code` and [links](url) to http(s), mailto, tel or site-relative URLs.
 */

function safeHref(url: string): string | null {
  const u = url.trim();
  if (/^(https?:|mailto:|tel:)/i.test(u) || (u.startsWith('/') && !u.startsWith('//')) || u.startsWith('#')) return u;
  return null;
}

function inline(text: string, keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)|`([^`]+)`|\*([^*]+)\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const key = `${keyBase}-${i++}`;
    if (m[2] !== undefined) out.push(<strong key={key} className="font-bold text-charcoal">{m[2]}</strong>);
    else if (m[3] !== undefined) {
      const href = safeHref(m[4]);
      if (!href) out.push(m[3]);
      else if (href.startsWith('/')) out.push(<Link key={key} href={href} className="font-semibold text-pista-darker underline">{m[3]}</Link>);
      else out.push(<a key={key} href={href} className="font-semibold text-pista-darker underline" rel="noopener noreferrer" target={href.startsWith('http') ? '_blank' : undefined}>{m[3]}</a>);
    } else if (m[5] !== undefined) out.push(<code key={key} className="px-1 py-0.5 rounded bg-surface-muted font-mono text-[0.9em]">{m[5]}</code>);
    else if (m[6] !== undefined) out.push(<em key={key}>{m[6]}</em>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source, skipFirstH1 = false }: { source: string; skipFirstH1?: boolean }) {
  const lines = (source || '').replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let para: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let h1Skipped = !skipFirstH1;
  let k = 0;

  const flushPara = () => {
    if (para.length) {
      const key = `p${k++}`;
      blocks.push(<p key={key} className="text-sm sm:text-[15px] text-charcoal-muted leading-relaxed">{inline(para.join(' '), key)}</p>);
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      const key = `l${k++}`;
      const items = list.items.map((it, idx) => <li key={idx}>{inline(it, `${key}-${idx}`)}</li>);
      blocks.push(
        list.ordered ? (
          <ol key={key} className="list-decimal pl-5 space-y-1.5 text-sm sm:text-[15px] text-charcoal-muted leading-relaxed marker:text-pista-dark marker:font-bold">{items}</ol>
        ) : (
          <ul key={key} className="list-disc pl-5 space-y-1.5 text-sm sm:text-[15px] text-charcoal-muted leading-relaxed marker:text-pista">{items}</ul>
        ),
      );
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    const ul = /^\s*[-*]\s+(.*)$/.exec(line);
    const ol = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (!line.trim()) {
      flushPara();
      flushList();
      continue;
    }
    if (h) {
      flushPara();
      flushList();
      const level = h[1].length;
      if (level === 1 && !h1Skipped) {
        h1Skipped = true;
        continue;
      }
      const key = `h${k++}`;
      if (level <= 2) blocks.push(<h2 key={key} className="text-lg sm:text-xl font-bold text-charcoal pt-2">{inline(h[2], key)}</h2>);
      else blocks.push(<h3 key={key} className="text-base font-bold text-charcoal pt-1">{inline(h[2], key)}</h3>);
      continue;
    }
    if (ul || ol) {
      flushPara();
      const ordered = Boolean(ol);
      if (list && list.ordered !== ordered) flushList();
      if (!list) list = { ordered, items: [] };
      list.items.push((ul ? ul[1] : ol![1]).trim());
      continue;
    }
    flushList();
    para.push(line.trim());
  }
  flushPara();
  flushList();
  return <div className="space-y-4">{blocks}</div>;
}
