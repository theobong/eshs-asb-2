import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';

export interface CartItem {
  id: number | string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  size?: string;
  color?: string;
  type?: 'product' | 'event';
  eventId?: string;
  ticketType?: string;
  maxQuantity?: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string | number, size?: string, color?: string) => void;
  updateQuantity: (id: string | number, change: number, size?: string, color?: string) => void;
  clearCart: () => void;
  cartCount: number;
}

const CART_COOKIE_NAME = 'cart';
const CART_COOKIE_LIFETIME_MS = 24 * 60 * 60 * 1000;

const isSameCartLine = (item: CartItem, id: string | number, size?: string, color?: string) =>
  item.id === id && item.size === size && item.color === color;

const clampQuantity = (quantity: number, maxQuantity?: number) => {
  const upperBound =
    typeof maxQuantity === 'number' && Number.isFinite(maxQuantity) && maxQuantity > 0
      ? Math.floor(maxQuantity)
      : Number.MAX_SAFE_INTEGER;
  if (!Number.isFinite(quantity)) return 1;
  return Math.max(1, Math.min(Math.floor(quantity), upperBound));
};

const isStoredCartItem = (value: unknown): value is CartItem => {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<CartItem>;
  return (
    (typeof candidate.id === 'string' || typeof candidate.id === 'number') &&
    typeof candidate.name === 'string' &&
    typeof candidate.price === 'number' &&
    Number.isFinite(candidate.price) &&
    typeof candidate.quantity === 'number' &&
    Number.isFinite(candidate.quantity)
  );
};

const readCartFromCookies = (): CartItem[] => {
  if (typeof document === 'undefined') return [];
  try {
    const cartData = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${CART_COOKIE_NAME}=`))
      ?.split('=')[1];
    if (!cartData) return [];
    const parsed = JSON.parse(decodeURIComponent(cartData));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isStoredCartItem)
      .map(item => ({ ...item, quantity: clampQuantity(item.quantity, item.maxQuantity) }));
  } catch (error) {
    console.error('Discarding unreadable saved cart:', error);
    return [];
  }
};

const writeCartToCookies = (items: CartItem[]) => {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + CART_COOKIE_LIFETIME_MS);
  document.cookie = `${CART_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(items))}; expires=${expires.toUTCString()}; path=/`;
};

export const SALES_TAX_RATE = 0.0875;

export const roundToCents = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100;

export const calculateCartTotals = (items: CartItem[]) => {
  const subtotal = roundToCents(items.reduce((total, item) => total + item.price * item.quantity, 0));
  const tax = roundToCents(subtotal * SALES_TAX_RATE);
  return { subtotal, tax, total: roundToCents(subtotal + tax) };
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(readCartFromCookies);

  useEffect(() => {
    writeCartToCookies(cartItems);
  }, [cartItems]);

  const cartCount = useMemo(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems]
  );

  const addToCart = useCallback((newItem: CartItem) => {
    setCartItems(previousItems => {
      const existingIndex = previousItems.findIndex(item =>
        isSameCartLine(item, newItem.id, newItem.size, newItem.color)
      );

      if (existingIndex === -1) {
        return [...previousItems, { ...newItem, quantity: clampQuantity(newItem.quantity, newItem.maxQuantity) }];
      }

      return previousItems.map((item, index) => {
        if (index !== existingIndex) return item;
        const maxQuantity = newItem.maxQuantity ?? item.maxQuantity;
        return {
          ...item,
          maxQuantity,
          quantity: clampQuantity(item.quantity + newItem.quantity, maxQuantity),
        };
      });
    });
  }, []);

  const removeFromCart = useCallback((id: string | number, size?: string, color?: string) => {
    setCartItems(previousItems => previousItems.filter(item => !isSameCartLine(item, id, size, color)));
  }, []);

  const updateQuantity = useCallback(
    (id: string | number, change: number, size?: string, color?: string) => {
      setCartItems(previousItems =>
        previousItems.map(item =>
          isSameCartLine(item, id, size, color)
            ? { ...item, quantity: clampQuantity(item.quantity + change, item.maxQuantity) }
            : item
        )
      );
    },
    []
  );

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const value = useMemo(
    () => ({ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartCount }),
    [cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartCount]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
