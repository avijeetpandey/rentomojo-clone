import { create } from 'zustand';
import type { Cart } from '@/lib/catalogApi';
import { cartApi } from '@/lib/catalogApi';

const emptyCart: Cart = {
  id: null,
  items: [],
  summary: { itemCount: 0, monthlyTotal: 0, depositTotal: 0, totalRentOverTenure: 0, payableNow: 0 },
};

interface CartState {
  cart: Cart;
  loading: boolean;
  setCart: (c: Cart) => void;
  refresh: (token: string) => Promise<void>;
  reset: () => void;
}

export const useCartStore = create<CartState>()((set) => ({
  cart: emptyCart,
  loading: false,
  setCart: (cart) => set({ cart }),
  refresh: async (token) => {
    set({ loading: true });
    try {
      const { cart } = await cartApi.get(token);
      set({ cart });
    } finally {
      set({ loading: false });
    }
  },
  reset: () => set({ cart: emptyCart }),
}));
