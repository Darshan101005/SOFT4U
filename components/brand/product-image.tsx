'use client';

import { useState } from 'react';

/**
 * Brand / product logo on a light pistachio tile.
 * Falls back to a styled initial-letter tile if the image is missing or fails to load.
 */
export function ProductImage({
  src,
  name,
  className = '',
  imgClassName = 'p-6',
}: {
  src?: string;
  name: string;
  className?: string;
  imgClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-pista-50 to-pista-100 ${className}`}
    >
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`${name} logo`}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className={`h-full w-full object-contain ${imgClassName}`}
        />
      ) : (
        <span
          role="img"
          aria-label={name}
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pista-400 text-2xl font-extrabold text-charcoal shadow-sm"
        >
          {initial}
        </span>
      )}
    </div>
  );
}

export default ProductImage;
