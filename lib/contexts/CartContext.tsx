"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

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
  addItems: (items: CartItem[]) => void;
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

// Coage qualquer objeto (inclusive lixo salvo por versões antigas no
// localStorage) num CartItem válido. Sem isto, um item com `price` undefined
// crasha o render em `item.price.toLocaleString()` → página "This page
// couldn't load" sem error boundary. Descarta entradas sem photoId.
function normalizeItem(raw: any): CartItem | null {
  if (!raw || typeof raw !== "object") return null;
  const photoId = typeof raw.photoId === "string" ? raw.photoId : raw.id;
  if (typeof photoId !== "string" || !photoId) return null;
  const price = Number(raw.price);
  return {
    id: typeof raw.id === "string" ? raw.id : photoId,
    photoId,
    name: typeof raw.name === "string" ? raw.name : "Foto",
    price: Number.isFinite(price) ? price : 0,
    eventId: typeof raw.eventId === "string" ? raw.eventId : "",
    eventTitle: typeof raw.eventTitle === "string" ? raw.eventTitle : "Evento",
    photographerId:
      typeof raw.photographerId === "string" ? raw.photographerId : "",
    photographerName:
      typeof raw.photographerName === "string"
        ? raw.photographerName
        : "Fotógrafo",
  };
}

function normalizeItems(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(normalizeItem)
    .filter((i): i is CartItem => i !== null);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sports-photos-cart");
    if (saved) {
      try {
        setItems(normalizeItems(JSON.parse(saved)));
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
    const clean = normalizeItem(item);
    if (!clean) return;
    // Check if already in cart
    const exists = items.find((i) => i.photoId === clean.photoId);
    if (exists) return;

    setItems([...items, clean]);
  };

  // Adiciona vários itens de uma vez (sem duplicar). Um único setState para
  // evitar o bug de closure stale ao chamar addItem em loop.
  const addItems = (newItems: CartItem[]) => {
    const clean = normalizeItems(newItems);
    setItems((prev) => {
      const seen = new Set(prev.map((i) => i.photoId));
      const toAdd = clean.filter((i) => !seen.has(i.photoId));
      return [...prev, ...toAdd];
    });
  };

  const removeItem = (photoId: string) => {
    setItems(items.filter((i) => i.photoId !== photoId));
  };

  // Estável (só usa setters) — seguro como dependência de efeitos.
  const clearCart = useCallback(() => {
    setItems([]);
    setCoupon(null);
  }, []);

  const getTotal = () => {
    return items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
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
        addItems,
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
