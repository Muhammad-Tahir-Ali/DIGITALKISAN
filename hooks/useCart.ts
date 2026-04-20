import { useCallback } from 'react';
import { useCartStore, CartItem } from '@/store/cartStore';

/**
 * useCart — convenience hook wrapping the Zustand cart store.
 *
 * Usage:
 *   const { items, totalPrice, addItem, removeItem } = useCart();
 */
export function useCart() {
  const store = useCartStore();

  const addItem = useCallback(
    (item: CartItem) => store.addItem(item),
    [store]
  );

  const removeItem = useCallback(
    (productId: string) => store.removeItem(productId),
    [store]
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) =>
      store.updateQuantity(productId, quantity),
    [store]
  );

  const clearCart = useCallback(() => store.clearCart(), [store]);

  const isInCart = useCallback(
    (productId: string) => store.items.some((i) => i.productId === productId),
    [store.items]
  );

  const getItemQuantity = useCallback(
    (productId: string) =>
      store.items.find((i) => i.productId === productId)?.quantity ?? 0,
    [store.items]
  );

  return {
    items: store.items,
    totalItems: store.totalItems,
    totalPrice: store.totalPrice,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    isInCart,
    getItemQuantity,
  };
}
