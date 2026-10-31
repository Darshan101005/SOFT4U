'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, ProductVariant, Coupon } from '@/lib/db/types';

export interface CartItem {
  id: string;
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, variant: ProductVariant, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
  appliedCoupon: Coupon | null;
  couponCode: string;
  setCouponCode: (code: string) => void;
  applyCoupon: (code: string) => Promise<{ success: boolean; error?: string }>;
  removeCoupon: () => void;
  subtotal: number;
  discount: number;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('soft4u_cart');
        if (stored) return JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('soft4u_coupon');
        if (stored) return JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  });

  const [couponCode, setCouponCode] = useState('');

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('soft4u_cart', JSON.stringify(items));
    } catch (e) {
      console.error(e);
    }
  }, [items]);

  useEffect(() => {
    try {
      if (appliedCoupon) {
        localStorage.setItem('soft4u_coupon', JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem('soft4u_coupon');
      }
    } catch (e) {
      console.error(e);
    }
  }, [appliedCoupon]);

  const addItem = (product: Product, variant: ProductVariant, quantity = 1) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(
        i => i.product.id === product.id && i.variant.id === variant.id
      );
      if (existingIndex > -1) {
        // Checkout accepts at most 10 of one plan per order.
        return prev.map((item, idx) =>
          idx === existingIndex ? { ...item, product, variant, quantity: Math.min(10, item.quantity + quantity) } : item
        );
      }
      const newItem: CartItem = {
        id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        product,
        variant,
        quantity: Math.min(10, Math.max(1, quantity)),
      };
      return [...prev, newItem];
    });
  };

  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setItems(prev =>
      prev
        .map(i => {
          if (i.id === itemId) {
            const nextQty = Math.min(10, i.quantity + delta);
            return nextQty > 0 ? { ...i, quantity: nextQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const applyCoupon = async (code: string) => {
    const clean = code.trim().toUpperCase();
    if (!clean) return { success: false, error: 'Please enter a coupon code' };

    try {
      const res = await fetch(`/api/coupons/validate?code=${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (!res.ok || !data.coupon) {
        return { success: false, error: data.error || 'Invalid or expired coupon' };
      }
      setAppliedCoupon(data.coupon);
      setCouponCode(clean);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error validating coupon' };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const subtotal = items.reduce((acc, item) => acc + item.variant.price * item.quantity, 0);

  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percentage') {
      discount = (subtotal * appliedCoupon.value) / 100;
      if (appliedCoupon.maxDiscount && discount > appliedCoupon.maxDiscount) {
        discount = appliedCoupon.maxDiscount;
      }
    } else {
      discount = Math.min(appliedCoupon.value, subtotal);
    }
  }

  const total = Math.max(0, subtotal - discount);
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        appliedCoupon,
        couponCode,
        setCouponCode,
        applyCoupon,
        removeCoupon,
        subtotal,
        discount,
        total,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
