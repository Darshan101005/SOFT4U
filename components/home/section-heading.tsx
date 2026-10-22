import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function SectionHeading({
  id,
  kicker,
  title,
  subtitle,
  action,
  align = 'left',
}: {
  id: string;
  kicker?: string;
  title: string;
  subtitle?: string;
  action?: { label: string; href: string };
  align?: 'left' | 'center';
}) {
  const centered = align === 'center';
  return (
    <div
      className={`mb-8 flex flex-col gap-3 ${
        centered ? 'items-center text-center' : 'sm:flex-row sm:items-end sm:justify-between'
      }`}
    >
      <div className="max-w-2xl">
        {kicker && (
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-pista-dark mb-2">{kicker}</p>
        )}
        <h2 id={id} className="text-2xl sm:text-3xl font-extrabold tracking-tight text-charcoal">
          {title}
        </h2>
        {subtitle && <p className="mt-2 text-sm sm:text-base text-charcoal-muted">{subtitle}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center gap-1.5 min-h-11 text-sm font-semibold text-pista-dark hover:text-pista-darker shrink-0"
        >
          {action.label}
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
