"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { extras, restaurant } from "@/lib/data";
import type { CartLine } from "@/lib/types";
import { useCatalog } from "@/components/catalog-context";

interface CartContextValue {
  lines: CartLine[];
  itemCount: number;
  /** Increments on each add — drives cart icon animation. */
  bumpVersion: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  amountToFreeDelivery: number;
  addItem: (productId: string, quantity?: number, extrasIds?: string[]) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  lineTotal: (line: CartLine) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

function makeKey(productId: string, extrasIds: string[]) {
  return `${productId}::${[...extrasIds].sort().join(",")}`;
}

function extrasPrice(extrasIds: string[]) {
  return extrasIds.reduce((sum, id) => {
    const extra = extras.find((e) => e.id === id);
    return sum + (extra?.price ?? 0);
  }, 0);
}

const seed: CartLine[] = [
  {
    key: makeKey("chicken-shawarma", []),
    productId: "chicken-shawarma",
    quantity: 1,
    extras: [],
  },
];

export function CartProvider({ children }: { children: ReactNode }) {
  const { getProduct } = useCatalog();
  const [lines, setLines] = useState<CartLine[]>(seed);
  const [bumpVersion, setBumpVersion] = useState(0);

  const lineTotal = useCallback(
    (line: CartLine) => {
      const product = getProduct(line.productId);
      if (!product) return 0;
      return (product.price + extrasPrice(line.extras)) * line.quantity;
    },
    [getProduct],
  );

  const addItem = useCallback(
    (productId: string, quantity = 1, extrasIds: string[] = []) => {
      const key = makeKey(productId, extrasIds);
      setLines((prev) => {
        const existing = prev.find((l) => l.key === key);
        if (existing) {
          return prev.map((l) =>
            l.key === key ? { ...l, quantity: l.quantity + quantity } : l,
          );
        }
        return [...prev, { key, productId, quantity, extras: extrasIds }];
      });
      setBumpVersion((v) => v + 1);
    },
    [],
  );

  const updateQuantity = useCallback((key: string, quantity: number) => {
    setLines((prev) => {
      if (quantity <= 0) return prev.filter((l) => l.key !== key);
      return prev.map((l) => (l.key === key ? { ...l, quantity } : l));
    });
  }, []);

  const removeItem = useCallback((key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(() => {
    const subtotal = lines.reduce((sum, line) => sum + lineTotal(line), 0);
    const deliveryFee =
      subtotal === 0
        ? 0
        : subtotal >= restaurant.freeDeliveryMin
          ? 0
          : restaurant.deliveryFee;
    const amountToFreeDelivery = Math.max(
      0,
      restaurant.freeDeliveryMin - subtotal,
    );
    return {
      lines,
      itemCount: lines.reduce((n, l) => n + l.quantity, 0),
      bumpVersion,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      amountToFreeDelivery,
      addItem,
      updateQuantity,
      removeItem,
      clear,
      lineTotal,
    };
  }, [
    lines,
    bumpVersion,
    addItem,
    updateQuantity,
    removeItem,
    clear,
    lineTotal,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
