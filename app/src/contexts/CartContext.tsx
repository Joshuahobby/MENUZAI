"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import type { MenuItem, CartItem } from "@/types/menu";
import { trackAddToCart, trackCartAbandon } from "@/lib/analytics";

export type { CartItem };

interface AnalyticsProps {
  menuId: string;
  restaurantId: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: MenuItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  setAnalyticsProps: (props: AnalyticsProps) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("menuza_cart_context");
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const analyticsRef = useRef<AnalyticsProps | null>(null);

  // Save to localStorage when items change
  useEffect(() => {
    localStorage.setItem("menuza_cart_context", JSON.stringify(items));
  }, [items]);

  const setAnalyticsProps = useCallback((props: AnalyticsProps) => {
    analyticsRef.current = props;
  }, []);

  const addItem = useCallback((item: MenuItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      // Only track the first add (not quantity bumps) to avoid inflating add_to_cart counts
      if (analyticsRef.current) {
        trackAddToCart(analyticsRef.current.menuId, analyticsRef.current.restaurantId, item.id, item.name, item.price);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } else {
      setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, quantity } : i)));
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  // Track cart abandonment when the user leaves the page with items in the cart
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (items.length > 0 && analyticsRef.current) {
        trackCartAbandon(analyticsRef.current.menuId, analyticsRef.current.restaurantId, items.length);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [items.length]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice, setAnalyticsProps }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
