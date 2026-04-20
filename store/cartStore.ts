import { create } from 'zustand';

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

  // Actions
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const computeTotals = (items: CartItem[]) => ({
  totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
  totalPrice: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
});

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  totalItems: 0,
  totalPrice: 0,

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
  },

  removeItem: (productId) => {
    const updated = get().items.filter((i) => i.productId !== productId);
    set({ items: updated, ...computeTotals(updated) });
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
  },

  clearCart: () =>
    set({ items: [], totalItems: 0, totalPrice: 0 }),
}));
