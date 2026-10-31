'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export function Spinner({ className = 'w-4 h-4' }: { className?: string }) {
  return <Loader2 className={`animate-spin shrink-0 ${className}`} aria-hidden="true" />;
}

/**
 * Button with a busy state: shows a spinner over the label (so the width never
 * changes), disables itself and sets aria-busy while `loading` is true.
 */
export function LoadingButton({
  loading = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={`relative ${className}`} {...rest}>
      <span className={`inline-flex items-center justify-center gap-[inherit] ${loading ? 'invisible' : ''}`}>{children}</span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner />
        </span>
      )}
    </button>
  );
}

/**
 * Link for navigation CTAs: shows the same spinner from the click until the
 * next page replaces this one.
 */
export function LoadingLink({
  className = '',
  children,
  onClick,
  ...rest
}: React.ComponentProps<typeof Link>) {
  const [loading, setLoading] = useState(false);
  return (
    <Link
      {...rest}
      aria-busy={loading || undefined}
      className={`relative ${className}`}
      onClick={e => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        setLoading(true);
      }}
    >
      <span className={`inline-flex items-center justify-center gap-[inherit] ${loading ? 'invisible' : ''}`}>{children}</span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner />
        </span>
      )}
    </Link>
  );
}

/** Submit button for plain HTML forms (e.g. GET search forms): shows the spinner once the form submits. */
export function FormSubmitButton({ className = '', children, ...rest }: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'>) {
  const ref = useRef<HTMLButtonElement>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const form = ref.current?.form;
    if (!form) return;
    const onSubmit = () => setLoading(true);
    const onShow = () => setLoading(false);
    form.addEventListener('submit', onSubmit);
    window.addEventListener('pageshow', onShow);
    return () => {
      form.removeEventListener('submit', onSubmit);
      window.removeEventListener('pageshow', onShow);
    };
  }, []);
  return (
    <button ref={ref} type="submit" aria-busy={loading || undefined} className={`relative ${className}`} {...rest}>
      <span className={`inline-flex items-center justify-center gap-[inherit] ${loading ? 'invisible' : ''}`}>{children}</span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner />
        </span>
      )}
    </button>
  );
}

/** Skeleton bar shown in place of a price that is not known yet. */
export function PriceSkeleton({ className = 'w-16' }: { className?: string }) {
  return <span className={`inline-block h-[1em] align-middle rounded-md soft4u-shimmer ${className}`} role="status" aria-label="Loading price" />;
}
