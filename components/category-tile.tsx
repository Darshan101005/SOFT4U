'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { Category } from '@/lib/db/types';
import { renderIcon } from '@/components/icon-map';
import { Package } from 'lucide-react';

/** 3D category icon (Category.image, set in Admin → Categories); falls back to the lucide icon name. */
export function CategoryIcon({ category, className = 'w-20 h-20' }: { category: Pick<Category, 'image' | 'icon' | 'name'>; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (category.image && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={category.image}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className={`${className} object-contain drop-shadow-[0_10px_14px_rgba(47,74,31,0.18)] transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-105`}
      />
    );
  }
  return (
    <span className={`${className} rounded-3xl bg-gradient-to-br from-pista-200 to-pista-500 text-white flex items-center justify-center shadow-[0_10px_20px_rgba(79,122,51,0.25)]`} aria-hidden="true">
      {renderIcon(category.icon, 'w-1/2 h-1/2', Package)}
    </span>
  );
}

export function CategoryTile({ category, count }: { category: Category; count: number }) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group flex flex-col items-center text-center h-full rounded-2xl border border-charcoal-border bg-gradient-to-b from-pista-50 to-white hover:border-pista hover:shadow-[0_14px_30px_rgba(79,122,51,0.12)] transition-all p-4 sm:p-5"
    >
      <CategoryIcon category={category} className="w-16 h-16 sm:w-20 sm:h-20" />
      <h3 className="mt-3 text-sm font-bold text-charcoal group-hover:text-pista-darker leading-snug">{category.name}</h3>
      <p className="mt-0.5 text-xs text-charcoal-subtle">
        {count} {count === 1 ? 'product' : 'products'}
      </p>
    </Link>
  );
}
