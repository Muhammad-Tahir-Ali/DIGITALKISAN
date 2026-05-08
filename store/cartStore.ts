import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_STORAGE_KEY = '@digitalkisan_cart';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  image?: string;
  farmerId: string;
  farmerName: string;
  maxStock: number;
}

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  hydrated: boolean;

  // Actions
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  hydrateFromStorage: () => Promise<void>;
}

const computeTotals = (items: CartItem[]) => ({
  totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
  totalPrice: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
});

const persistCart = async (items: CartItem[]) => {
  try {
    await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Silently fail — cart still works in-memory
  }
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  totalItems: 0,
  totalPrice: 0,
  hydrated: false,

  hydrateFromStorage: async () => {
    try {
      const raw = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        const items: CartItem[] = JSON.parse(raw);
        set({ items, ...computeTotals(items), hydrated: true });
      } else {
        set({ hydrated: true });
      }
    } catch {
      set({ hydrated: true });
    }
  },

  addItem: (item) => {
    const { items } = get();
    const existing = items.find((i) => i.productId === item.productId);
    let updated: CartItem[];

    if (existing) {
      const newQty = Math.min(
        existing.quantity + item.quantity,
        existing.maxStock
      );
      updated = items.map((i) =>
        i.productId === item.productId ? { ...i, quantity: newQty } : i
      );
    } else {
      updated = [...items, item];
    }

    set({ items: updated, ...computeTotals(updated) });
    persistCart(updated);
  },

  removeItem: (productId) => {
    const updated = get().items.filter((i) => i.productId !== productId);
    set({ items: updated, ...computeTotals(updated) });
    persistCart(updated);
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    const updated = get().items.map((i) =>
      i.productId === productId
        ? { ...i, quantity: Math.min(quantity, i.maxStock) }
        : i
    );
    set({ items: updated, ...computeTotals(updated) });
    persistCart(updated);
  },

  clearCart: () => {
    set({ items: [], totalItems: 0, totalPrice: 0 });
    AsyncStorage.removeItem(CART_STORAGE_KEY).catch(() => {});
  },
}));
