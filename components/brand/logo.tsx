import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';

type LogoSize = 'sm' | 'md' | 'lg';

const sizeClasses: Record<LogoSize, string> = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl',
};

/**
 * Text-only wordmark: "Soft4u" with the "4" in pistachio green.
 * No image or SVG mark.
 */
export function LogoText({ size = 'md', className = '' }: { size?: LogoSize; className?: string }) {
  return (
    <span
      className={`font-extrabold tracking-tight leading-none text-charcoal ${sizeClasses[size]} ${className}`}
    >
      <span className="sr-only">{siteConfig.name}</span>
      <span aria-hidden="true">
        Soft<span className="text-pista-600">4</span>u
      </span>
    </span>
  );
}

/** Wordmark linking to the homepage, with a 44px tap target. */
export function Logo({ size = 'md', className = '' }: { size?: LogoSize; className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center min-h-11 rounded-md ${className}`}
      aria-label={`${siteConfig.name} home`}
    >
      <LogoText size={size} />
    </Link>
  );
}

export default Logo;
