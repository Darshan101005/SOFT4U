'use client';

import React, { Suspense } from 'react';
import { AuthProvider } from '@/lib/context/auth-context';
import { CartProvider } from '@/lib/context/cart-context';
import { AiSupportWidget } from '@/components/ai-support-widget';
import { RouteProgress } from '@/components/route-progress';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        {children}
        <AiSupportWidget />
      </CartProvider>
    </AuthProvider>
  );
}
