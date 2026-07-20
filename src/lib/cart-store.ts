"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  unit: string;
  imageUrl: string;
  supplierId: string;
  supplierName: string;
  quantity: number;
  stockQty: number;
};

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, quantity: number) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
  syncToServer: () => Promise<void>;
  hydrateFromServer: () => Promise<void>;
};

async function pushCart(items: CartItem[]) {
  try {
    await fetch("/api/cart", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
  } catch {
    /* offline / guest. Ignore */
  }
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item, qty = 1) => {
        const existing = get().items.find((i) => i.productId === item.productId);
        // Zero available = restock path (soft ETA). Still allow ordering up to a sensible cap
        const maxQty = item.stockQty > 0 ? item.stockQty : Math.max(99, qty);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: Math.min(maxQty, i.quantity + qty), stockQty: item.stockQty }
                : i
            ),
          });
        } else {
          set({ items: [...get().items, { ...item, quantity: Math.min(maxQty, qty) }] });
        }
        void get().syncToServer();
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
        void get().syncToServer();
      },
      updateQty: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((i) => {
            if (i.productId !== productId) return i;
            const maxQty = i.stockQty > 0 ? i.stockQty : 99;
            return { ...i, quantity: Math.min(maxQty, quantity) };
          }),
        });
        void get().syncToServer();
      },
      clear: () => {
        set({ items: [] });
        void fetch("/api/cart", { method: "DELETE" }).catch(() => null);
      },
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      syncToServer: async () => {
        await pushCart(get().items);
      },
      hydrateFromServer: async () => {
        try {
          const res = await fetch("/api/cart");
          if (!res.ok) return;
          const data = await res.json();
          if (Array.isArray(data.items) && data.items.length > 0 && get().items.length === 0) {
            set({ items: data.items });
          }
        } catch {
          /* ignore */
        }
      },
    }),
    { name: "huza-cart" }
  )
);
