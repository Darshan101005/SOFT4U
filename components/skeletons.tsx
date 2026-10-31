import React from 'react';

/** Route loading skeletons (soft light-pistachio shimmer, see .soft4u-shimmer in globals.css). */

export function Bar({ className = '' }: { className?: string }) {
  return <div className={`rounded-lg soft4u-shimmer ${className}`} />;
}

function Shell({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="min-h-screen flex flex-col bg-surface-bg" role="status" aria-busy="true" aria-label={label}>
      <div className="h-16 sm:h-[72px] border-b border-pista-100 bg-white/80 flex items-center px-4 sm:px-6 lg:px-8 gap-4">
        <Bar className="h-8 w-28" />
        <div className="flex-1" />
        <Bar className="h-9 w-9 rounded-full" />
        <Bar className="h-9 w-20 hidden sm:block" />
      </div>
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">{children}</main>
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="bg-surface-card border border-charcoal-border rounded-2xl overflow-hidden">
          <Bar className="aspect-[4/3] rounded-none" />
          <div className="p-3 sm:p-4 space-y-2">
            <Bar className="h-3 w-1/2" />
            <Bar className="h-4 w-4/5" />
            <Bar className="h-5 w-1/3 mt-4" />
            <Bar className="h-11 w-full mt-3 rounded-xl" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function CatalogSkeleton() {
  return (
    <Shell label="Loading products">
      <Bar className="h-3 w-32 mb-3" />
      <Bar className="h-8 w-64 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
        <div className="hidden lg:block bg-surface-card border border-charcoal-border rounded-2xl p-5 space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Bar key={i} className="h-6 w-full" />
          ))}
        </div>
        <div className="lg:col-span-3 space-y-4">
          <Bar className="h-12 w-full rounded-2xl" />
          <div className="flex justify-between">
            <Bar className="h-11 w-28" />
            <Bar className="h-11 w-44" />
          </div>
          <ProductGridSkeleton />
        </div>
      </div>
    </Shell>
  );
}

export function ProductSkeleton() {
  return (
    <Shell label="Loading product">
      <Bar className="h-3 w-48 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 bg-surface-card border border-charcoal-border rounded-2xl p-4 sm:p-8">
        <div className="lg:col-span-5 space-y-4">
          <Bar className="aspect-[4/3] sm:aspect-square w-full rounded-2xl" />
          <Bar className="h-24 w-full rounded-xl" />
        </div>
        <div className="lg:col-span-7 space-y-5">
          <Bar className="h-3 w-24" />
          <Bar className="h-8 w-3/4" />
          <Bar className="h-4 w-full" />
          <Bar className="h-20 w-full rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {[0, 1, 2].map(i => (
              <Bar key={i} className="h-20 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Bar className="h-12 rounded-xl" />
            <Bar className="h-12 rounded-xl" />
          </div>
        </div>
      </div>
    </Shell>
  );
}

/** Content area only: the account and admin layouts keep their navigation. */
export function PanelSkeleton({ rows = 5, label = 'Loading' }: { rows?: number; label?: string }) {
  return (
    <div className="space-y-5" role="status" aria-busy="true" aria-label={label}>
      <Bar className="h-7 w-56" />
      <Bar className="h-4 w-80 max-w-full" />
      <div className="bg-surface-card border border-charcoal-border rounded-2xl divide-y divide-surface-muted">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <Bar className="h-10 w-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Bar className="h-4 w-1/2" />
              <Bar className="h-3 w-1/3" />
            </div>
            <Bar className="h-6 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function OrderSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-busy="true" aria-label="Loading order">
      <Bar className="h-7 w-64" />
      <Bar className="h-16 w-full rounded-2xl" />
      <div className="grid gap-5 lg:grid-cols-12">
        <Bar className="h-80 lg:col-span-7 rounded-2xl" />
        <Bar className="h-80 lg:col-span-5 rounded-2xl" />
      </div>
    </div>
  );
}

export function AdminSkeleton() {
  return (
    <div className="min-h-screen flex bg-surface-bg" role="status" aria-busy="true" aria-label="Loading">
      <div className="hidden lg:flex w-64 shrink-0 flex-col gap-3 border-r border-pista-100 bg-white p-4">
        <Bar className="h-9 w-32 mb-4" />
        {Array.from({ length: 10 }).map((_, i) => (
          <Bar key={i} className="h-8 w-full" />
        ))}
      </div>
      <div className="flex-1 p-4 sm:p-8">
        <PanelSkeleton rows={7} />
      </div>
    </div>
  );
}
