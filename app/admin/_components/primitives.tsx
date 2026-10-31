import React from 'react';

/**
 * Hook-free admin building blocks. No 'use client' directive, so server pages
 * can render them directly (icons are passed as elements or components that
 * stay on the server). Client screens import them through ./ui.
 */

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function PageHeader({
  kicker,
  title,
  description,
  actions,
}: {
  kicker?: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
      <div className="min-w-0">
        {kicker && <div className="text-[11px] font-bold text-pista-dark uppercase tracking-wider mb-1">{kicker}</div>}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal">{title}</h1>
        {description && <p className="text-sm text-charcoal-subtle mt-1 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function Card({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cx('bg-white border border-charcoal-border rounded-2xl shadow-xs', className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 border-b border-surface-muted">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-bold text-charcoal">{title}</h2>}
            {description && <p className="text-xs text-charcoal-subtle mt-0.5">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cx('p-5', bodyClassName)}>{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  hint,
  icon: Icon,
  href,
  tone = 'default',
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  href?: string;
  tone?: 'default' | 'attention';
}) {
  const body = (
    <>
      <div className="flex items-center justify-between text-xs text-charcoal-subtle">
        <span className="font-semibold">{label}</span>
        {Icon && (
          <span className={cx('w-8 h-8 rounded-lg flex items-center justify-center', tone === 'attention' ? 'bg-accent-amber/15 text-accent-amber' : 'bg-pista-lighter text-pista-dark')}>
            <Icon className="w-4 h-4" />
          </span>
        )}
      </div>
      <div className="text-xl sm:text-2xl font-extrabold text-charcoal mt-2 whitespace-nowrap overflow-hidden text-ellipsis">{value}</div>
      {hint && <div className="text-[11px] text-charcoal-subtle mt-1">{hint}</div>}
    </>
  );
  const cls = cx(
    'block p-4 sm:p-5 bg-white border rounded-2xl shadow-xs transition-colors min-w-0',
    tone === 'attention' ? 'border-accent-amber/50' : 'border-charcoal-border',
    href && 'hover:border-pista',
  );
  if (href) {
    return (
      <a href={href} className={cls}>
        {body}
      </a>
    );
  }
  return <div className={cls}>{body}</div>;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="py-12 px-6 text-center">
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-pista-lighter text-pista-dark flex items-center justify-center mx-auto mb-3">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <div className="text-sm font-bold text-charcoal">{title}</div>
      {description && <p className="text-xs text-charcoal-subtle mt-1 max-w-md mx-auto">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export type BadgeTone = 'green' | 'amber' | 'rose' | 'gray' | 'blue' | 'teal' | 'dark';

export function Badge({ tone = 'gray', children, className }: { tone?: BadgeTone; children: React.ReactNode; className?: string }) {
  const t: Record<BadgeTone, string> = {
    green: 'bg-pista-lighter text-pista-darker border-pista-light',
    amber: 'bg-accent-amber/10 text-[#9a6514] border-accent-amber/30',
    rose: 'bg-accent-rose/10 text-accent-rose border-accent-rose/25',
    gray: 'bg-surface-muted text-charcoal-subtle border-charcoal-border',
    blue: 'bg-accent-blue/10 text-accent-blue border-accent-blue/25',
    teal: 'bg-accent-teal/10 text-accent-teal border-accent-teal/25',
    dark: 'bg-pista-dark text-white border-pista-dark',
  };
  return <span className={cx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-bold whitespace-nowrap', t[tone], className)}>{children}</span>;
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Awaiting payment',
  under_review: 'Payment under review',
  processing: 'Approved, to deliver',
  completed: 'Delivered',
  rejected: 'Payment rejected',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

const ORDER_STATUS_TONES: Record<string, BadgeTone> = {
  pending: 'gray',
  under_review: 'amber',
  processing: 'blue',
  completed: 'green',
  rejected: 'rose',
  cancelled: 'gray',
  refunded: 'teal',
};

export function OrderStatusBadge({ status }: { status: string }) {
  return <Badge tone={ORDER_STATUS_TONES[status] || 'gray'}>{ORDER_STATUS_LABELS[status] || status}</Badge>;
}

export function Table({ head, children }: { head: React.ReactNode[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-bg text-charcoal-subtle uppercase font-bold text-[10px] tracking-wider">
          <tr>
            {head.map((h, i) => (
              <th key={i} className="px-4 py-3 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-muted">{children}</tbody>
      </table>
    </div>
  );
}
