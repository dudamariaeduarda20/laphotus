"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CartItem {
  id: string;
  photoId: string;
  name: string;
  price: number;
  eventId: string;
  eventTitle: string;
  photographerId: string;
  photographerName: string;
}

export interface AppliedCoupon {
  code: string;
  discountType: string; // "percentage" | "fixed"
  discountValue: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (photoId: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  // Cupom (partilhado entre carrinho e checkout)
  coupon: AppliedCoupon | null;
  applyCoupon: (coupon: AppliedCoupon) => void;
  clearCoupon: () => void;
  getDiscount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sports-photos-cart");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load cart:", e);
      }
    }
    const savedCoupon = localStorage.getItem("sports-photos-coupon");
    if (savedCoupon) {
      try {
        setCoupon(JSON.parse(savedCoupon));
      } catch (e) {
        console.error("Failed to load coupon:", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("sports-photos-cart", JSON.stringify(items));
    }
  }, [items, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    if (coupon) {
      localStorage.setItem("sports-photos-coupon", JSON.stringify(coupon));
    } else {
      localStorage.removeItem("sports-photos-coupon");
    }
  }, [coupon, isLoaded]);

  const addItem = (item: CartItem) => {
    // Check if already in cart
    const exists = items.find((i) => i.photoId === item.photoId);
    if (exists) return;

    setItems([...items, item]);
  };

  const removeItem = (photoId: string) => {
    setItems(items.filter((i) => i.photoId !== photoId));
  };

  const clearCart = () => {
    setItems([]);
    setCoupon(null);
  };

  const getTotal = () => {
    return items.reduce((sum, item) => sum + item.price, 0);
  };

  const getItemCount = () => items.length;

  const applyCoupon = (c: AppliedCoupon) => setCoupon(c);
  const clearCoupon = () => setCoupon(null);

  // Desconto calculado sobre o subtotal atual (limitado ao subtotal)
  const getDiscount = () => {
    if (!coupon) return 0;
    const subtotal = getTotal();
    const raw =
      coupon.discountType === "percentage"
        ? (subtotal * coupon.discountValue) / 100
        : coupon.discountValue;
    return Math.min(Math.round(raw * 100) / 100, subtotal);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        clearCart,
        getTotal,
        getItemCount,
        coupon,
        applyCoupon,
        clearCoupon,
        getDiscount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
