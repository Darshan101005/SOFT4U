'use client';

import React from 'react';
import { AuthProvider } from '@/lib/context/auth-context';
import { CartProvider } from '@/lib/context/cart-context';
import { AiSupportWidget } from '@/components/ai-support-widget';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        {children}
        <AiSupportWidget />
      </CartProvider>
    </AuthProvider>
  );
}
