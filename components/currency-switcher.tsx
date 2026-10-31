'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Currency } from '@/lib/db/types';
import { Select } from '@/components/ui/select';

const OPTIONS: { value: Currency; label: string }[] = [
  { value: 'PKR', label: 'PKR' },
  { value: 'USD', label: 'USD' },
];

/**
 * PKR / USD switcher. The page is rendered with the currency from the cookie;
 * after load the browser asks /api/currency for the geo default (only when the
 * visitor never chose one) and a manual pick is remembered for a year.
 */
export function CurrencySwitcher({ currency, className = '' }: { currency: Currency; className?: string }) {
  const router = useRouter();
  const [value, setValue] = useState<Currency>(currency);
  const [pending, startTransition] = useTransition();

  // Keep in sync when the server renders with a new currency.
  const [lastProp, setLastProp] = useState(currency);
  if (lastProp !== currency) {
    setLastProp(currency);
    setValue(currency);
  }

  useEffect(() => {
    let active = true;
    fetch('/api/currency', { cache: 'no-store' })
      .then(r => r.json())
      .then((data: { currency?: Currency }) => {
        if (!active || !data?.currency) return;
        if (data.currency !== currency) {
          setValue(data.currency);
          startTransition(() => router.refresh());
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
    // Detection runs once per page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const change = async (next: Currency) => {
    if (next === value) return;
    setValue(next);
    try {
      await fetch('/api/currency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: next }),
      });
    } catch {
      // the cookie write failed; the refresh below still re-renders with the old value
    }
    startTransition(() => router.refresh());
  };

  return (
    <Select<Currency>
      value={value}
      onChange={change}
      options={OPTIONS}
      ariaLabel="Display currency"
      align="right"
      className={className}
      buttonClassName={`!min-h-11 !px-2.5 !gap-1 text-xs sm:text-sm ${pending ? 'opacity-70' : ''}`}
    />
  );
}
