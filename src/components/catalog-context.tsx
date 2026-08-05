"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { products as seedProducts } from "@/lib/data";
import { isFirebaseConfigured } from "@/lib/firebase";
import {
  defaultPayments,
  deleteProduct as fbDeleteProduct,
  savePayments,
  saveProduct,
  seedFirestore,
  subscribePayments,
  subscribeProducts,
  type PaymentSettings,
} from "@/lib/firebase/catalog";
import { uploadProductImage } from "@/lib/firebase/storage";
import type { PaymentMethod, Product } from "@/lib/types";

const PRODUCTS_KEY = "bb-products";
const PAYMENTS_KEY = "bb-payments";

export type { PaymentSettings };

interface CatalogContextValue {
  products: Product[];
  payments: PaymentSettings;
  ready: boolean;
  usingFirebase: boolean;
  firebaseError: string | null;
  getProduct: (id: string) => Product | undefined;
  productsByCategory: (category?: string) => Product[];
  productsByTag: (tag: Product["tags"][number]) => Product[];
  upsertProduct: (product: Product) => Promise<void>;
  addProduct: (product: Product) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
  toggleProductAvailable: (id: string) => Promise<void>;
  setPaymentEnabled: (method: PaymentMethod, enabled: boolean) => Promise<void>;
  setPayments: (next: PaymentSettings) => Promise<void>;
  resetCatalog: () => Promise<void>;
  seedDatabase: () => Promise<void>;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function prepareProductForSave(product: Product): Promise<Product> {
  if (!isFirebaseConfigured()) return product;

  let image = product.image;
  if (image.startsWith("data:")) {
    image = await uploadProductImage(product.id, image);
  }

  const images = await Promise.all(
    (product.images ?? [product.image]).map(async (img) => {
      if (img.startsWith("data:")) {
        return uploadProductImage(product.id, img);
      }
      return img === product.image ? image : img;
    }),
  );

  return {
    ...product,
    image,
    images: images.length ? images : [image],
  };
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [payments, setPaymentsState] =
    useState<PaymentSettings>(defaultPayments);
  const [ready, setReady] = useState(false);
  const [usingFirebase, setUsingFirebase] = useState(false);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setProducts(readJson(PRODUCTS_KEY, seedProducts));
      setPaymentsState(readJson(PAYMENTS_KEY, defaultPayments));
      setUsingFirebase(false);
      setReady(true);
      return;
    }

    setUsingFirebase(true);
    let unsubProducts: (() => void) | undefined;
    let unsubPayments: (() => void) | undefined;

    try {
      unsubProducts = subscribeProducts(
        (list) => {
          setProducts(list.length ? list : seedProducts);
          setReady(true);
          setFirebaseError(null);
        },
        (err) => {
          console.error(err);
          setFirebaseError(err.message);
          setProducts(readJson(PRODUCTS_KEY, seedProducts));
          setReady(true);
        },
      );
      unsubPayments = subscribePayments(
        (p) => {
          setPaymentsState(p);
        },
        (err) => {
          console.error(err);
          setFirebaseError(err.message);
        },
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Firebase error";
      setFirebaseError(message);
      setProducts(readJson(PRODUCTS_KEY, seedProducts));
      setPaymentsState(readJson(PAYMENTS_KEY, defaultPayments));
      setUsingFirebase(false);
      setReady(true);
    }

    return () => {
      unsubProducts?.();
      unsubPayments?.();
    };
  }, []);

  // Local fallback persistence when Firebase is off
  useEffect(() => {
    if (!ready || usingFirebase) return;
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  }, [products, ready, usingFirebase]);

  useEffect(() => {
    if (!ready || usingFirebase) return;
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
  }, [payments, ready, usingFirebase]);

  const getProduct = useCallback(
    (id: string) => products.find((p) => p.id === id),
    [products],
  );

  const productsByCategory = useCallback(
    (category?: string) => {
      if (!category || category === "all") {
        return products.filter((p) => p.available);
      }
      return products.filter((p) => p.category === category && p.available);
    },
    [products],
  );

  const productsByTag = useCallback(
    (tag: Product["tags"][number]) =>
      products.filter((p) => p.tags.includes(tag) && p.available),
    [products],
  );

  const upsertProduct = useCallback(
    async (product: Product) => {
      const prepared = await prepareProductForSave(product);
      if (usingFirebase && isFirebaseConfigured()) {
        await saveProduct(prepared);
        // realtime listener updates state
      } else {
        setProducts((prev) => {
          const idx = prev.findIndex((p) => p.id === prepared.id);
          if (idx === -1) return [...prev, prepared];
          const next = [...prev];
          next[idx] = prepared;
          return next;
        });
      }
    },
    [usingFirebase],
  );

  const addProduct = useCallback(
    async (product: Product) => {
      await upsertProduct(product);
    },
    [upsertProduct],
  );

  const removeProduct = useCallback(
    async (id: string) => {
      if (usingFirebase && isFirebaseConfigured()) {
        await fbDeleteProduct(id);
      } else {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
    },
    [usingFirebase],
  );

  const toggleProductAvailable = useCallback(
    async (id: string) => {
      const current = products.find((p) => p.id === id);
      if (!current) return;
      await upsertProduct({ ...current, available: !current.available });
    },
    [products, upsertProduct],
  );

  const setPaymentEnabled = useCallback(
    async (method: PaymentMethod, enabled: boolean) => {
      const next = { ...payments, [method]: enabled };
      if (!next.momo && !next.cash && !next.card) return;
      if (usingFirebase && isFirebaseConfigured()) {
        await savePayments(next);
      } else {
        setPaymentsState(next);
      }
    },
    [payments, usingFirebase],
  );

  const setPayments = useCallback(
    async (next: PaymentSettings) => {
      if (!next.momo && !next.cash && !next.card) return;
      if (usingFirebase && isFirebaseConfigured()) {
        await savePayments(next);
      } else {
        setPaymentsState(next);
      }
    },
    [usingFirebase],
  );

  const resetCatalog = useCallback(async () => {
    if (usingFirebase && isFirebaseConfigured()) {
      await seedFirestore();
      return;
    }
    setProducts(seedProducts);
    setPaymentsState(defaultPayments);
    localStorage.removeItem(PRODUCTS_KEY);
    localStorage.removeItem(PAYMENTS_KEY);
  }, [usingFirebase]);

  const seedDatabase = useCallback(async () => {
    if (!isFirebaseConfigured()) {
      throw new Error("Add Firebase keys to .env.local first");
    }
    await seedFirestore();
  }, []);

  const value = useMemo(
    () => ({
      products,
      payments,
      ready,
      usingFirebase,
      firebaseError,
      getProduct,
      productsByCategory,
      productsByTag,
      upsertProduct,
      addProduct,
      removeProduct,
      toggleProductAvailable,
      setPaymentEnabled,
      setPayments,
      resetCatalog,
      seedDatabase,
    }),
    [
      products,
      payments,
      ready,
      usingFirebase,
      firebaseError,
      getProduct,
      productsByCategory,
      productsByTag,
      upsertProduct,
      addProduct,
      removeProduct,
      toggleProductAvailable,
      setPaymentEnabled,
      setPayments,
      resetCatalog,
      seedDatabase,
    ],
  );

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  );
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used within CatalogProvider");
  return ctx;
}
