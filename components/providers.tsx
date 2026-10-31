'use client';
import React, { Suspense } from 'react';
import { AuthProvider } from '@/lib/context/auth-context';
import { CartProvider } from '@/lib/context/cart-context';
import { AiSupportWidget } from '@/components/ai-support-widget';
import { RouteProgress } from '@/components/route-progress';
import { TimeZoneProvider } from '@/components/local-time';
/** `timeZone`: the visitor's zone from the `tz` cookie (null on a first visit). */
export function Providers({ children, timeZone }: { children: React.ReactNode; timeZone?: string | null }) {
  return (
    <TimeZoneProvider tz={timeZone}>
      <AuthProvider>
        <CartProvider>
          <Suspense fallback={null}>
            <RouteProgress />
          </Suspense>
          {children}
          <AiSupportWidget />
        </CartProvider>
      </AuthProvider>
    </TimeZoneProvider>
  );
}
