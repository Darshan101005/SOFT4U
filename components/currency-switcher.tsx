'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Currency } from '@/lib/db/types';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/loading-button';

const OPTIONS: { value: Currency; label: string }[] = [
  { value: 'PKR', label: 'PKR' },
  { value: 'USD', label: 'USD' },
];

/**
 * PKR / USD switcher. The page is rendered with the currency from the cookie
 * (or the edge country header); when neither is known (`resolved` false) the
 * browser asks /api/currency for the geo default and every price shows a
 * skeleton until the answer is rendered. A manual pick is remembered for a year.
 *
 * The hidden marker's data-price-state drives the price styles in globals.css:
 * "unresolved" shows skeleton bars, "switching" fades the old prices.
 */
export function CurrencySwitcher({ currency, resolved = true, className = '' }: { currency: Currency; resolved?: boolean; className?: string }) {
  const router = useRouter();
  const [value, setValue] = useState<Currency>(currency);
  const [detecting, setDetecting] = useState(!resolved);
  const [posting, setPosting] = useState(false);
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
        if (!active) return;
        if (data?.currency && data.currency !== currency) {
          setValue(data.currency);
          // The skeletons stay until the refreshed prices commit with this transition.
          startTransition(() => {
            setDetecting(false);
            router.refresh();
          });
        } else {
          setDetecting(false);
        }
      })
      .catch(() => active && setDetecting(false));
    return () => {
      active = false;
    };
    // Detection runs once per page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const change = async (next: Currency) => {
    if (next === value) return;
    setValue(next);
    setPosting(true);
    try {
      await fetch('/api/currency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: next }),
      });
    } catch {
      // the cookie write failed; the refresh below still re-renders with the old value
    }
    startTransition(() => {
      setPosting(false);
      router.refresh();
    });
  };

  const state = detecting ? 'unresolved' : posting || pending ? 'switching' : 'ready';

  return (
    <div className="relative" aria-busy={state !== 'ready' || undefined}>
      <span hidden data-price-state={state} />
      <Select<Currency>
        value={value}
        onChange={change}
        options={OPTIONS}
        ariaLabel="Display currency"
        align="right"
        className={className}
        buttonClassName={`!min-h-11 !px-2.5 !gap-1 text-xs sm:text-sm ${state !== 'ready' ? 'opacity-70' : ''}`}
      />
      {state !== 'ready' && (
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white shadow flex items-center justify-center pointer-events-none" role="status" aria-label="Updating prices">
          <Spinner className="w-3 h-3 text-pista-dark" />
        </span>
      )}
    </div>
  );
}
