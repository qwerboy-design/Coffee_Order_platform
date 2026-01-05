'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types/product';
import type { GrindOption } from '@/types/order';

export interface CartItem {
  product: Product;
  quantity: number;
  grind_option: GrindOption;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, quantity: number, grind_option: GrindOption) => void;
  removeItem: (productId: string, grindOption: GrindOption) => void;
  updateQuantity: (productId: string, grindOption: GrindOption, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

  addItem: (product, quantity, grind_option) => {
    set((state) => {
      const existingIndex = state.items.findIndex(
        (item) => item.product.id === product.id && item.grind_option === grind_option
      );

      if (existingIndex >= 0) {
        // 更新現有項目數量
        const newItems = [...state.items];
        newItems[existingIndex].quantity += quantity;
        return { items: newItems };
      } else {
        // 新增項目
        return {
          items: [...state.items, { product, quantity, grind_option }],
        };
      }
    });
  },

  removeItem: (productId, grindOption) => {
    set((state) => ({
      items: state.items.filter(
        (item) => !(item.product.id === productId && item.grind_option === grindOption)
      ),
    }));
  },

  updateQuantity: (productId, grindOption, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId, grindOption);
      return;
    }

    set((state) => ({
      items: state.items.map((item) =>
        item.product.id === productId && item.grind_option === grindOption
          ? { ...item, quantity }
          : item
      ),
    }));
  },

  clearCart: () => {
    set({ items: [] });
  },

  getTotal: () => {
    return get().items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
    }),
    {
      name: 'cart-storage',
      version: 1,
    }
  )
);












