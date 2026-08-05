import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { getDb, isFirebaseConfigured } from "@/lib/firebase";
import {
  COLLECTIONS,
  SETTINGS_DOCS,
  type PaymentSettingsDoc,
  type BusinessSettingsDoc,
  type RestaurantSettingsDoc,
} from "@/lib/firebase/schema";
import type { Product } from "@/lib/types";
import {
  products as seedProducts,
  restaurant as seedRestaurant,
} from "@/lib/data";

export type PaymentSettings = PaymentSettingsDoc;

/** Only Cash on Delivery is live for launch; admin can enable others later. */
export const defaultPayments: PaymentSettings = {
  momo: false,
  cash: true,
  card: false,
};

export const defaultBusiness: BusinessSettingsDoc = {
  open: true,
  busyMode: false,
  deliveryRadiusKm: 8,
  deliveryFee: 12,
  freeDeliveryMin: 150,
  hours: "Mon–Sun, 11 AM – 11 PM",
};

function requireDb() {
  const db = getDb();
  if (!db) throw new Error("Firebase is not configured");
  return db;
}

/** Live products list */
export function subscribeProducts(
  onData: (products: Product[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const db = requireDb();
  return onSnapshot(
    collection(db, COLLECTIONS.products),
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product);
      list.sort((a, b) => a.name.localeCompare(b.name));
      onData(list);
    },
    (err) => onError?.(err),
  );
}

export async function fetchProducts(): Promise<Product[]> {
  const db = requireDb();
  const snap = await getDocs(collection(db, COLLECTIONS.products));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product);
}

export async function saveProduct(product: Product): Promise<void> {
  const db = requireDb();
  const { id, ...data } = product;
  await setDoc(doc(db, COLLECTIONS.products, id), data, { merge: true });
}

export async function deleteProduct(id: string): Promise<void> {
  const db = requireDb();
  await deleteDoc(doc(db, COLLECTIONS.products, id));
}

export function subscribePayments(
  onData: (payments: PaymentSettings) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const db = requireDb();
  return onSnapshot(
    doc(db, COLLECTIONS.settings, SETTINGS_DOCS.payments),
    (snap) => {
      if (!snap.exists()) {
        onData(defaultPayments);
        return;
      }
      onData({ ...defaultPayments, ...(snap.data() as PaymentSettings) });
    },
    (err) => onError?.(err),
  );
}

export async function savePayments(payments: PaymentSettings): Promise<void> {
  const db = requireDb();
  await setDoc(
    doc(db, COLLECTIONS.settings, SETTINGS_DOCS.payments),
    payments,
    { merge: true },
  );
}

export async function saveBusinessSettings(
  settings: BusinessSettingsDoc,
): Promise<void> {
  const db = requireDb();
  await setDoc(
    doc(db, COLLECTIONS.settings, SETTINGS_DOCS.business),
    settings,
    { merge: true },
  );
}

export async function fetchBusinessSettings(): Promise<BusinessSettingsDoc> {
  const db = requireDb();
  const snap = await getDoc(
    doc(db, COLLECTIONS.settings, SETTINGS_DOCS.business),
  );
  if (!snap.exists()) return defaultBusiness;
  return { ...defaultBusiness, ...(snap.data() as BusinessSettingsDoc) };
}

/** One-time seed of menu + settings into Firestore */
export async function seedFirestore(): Promise<{ products: number }> {
  if (!isFirebaseConfigured()) {
    throw new Error("Configure Firebase env vars first");
  }
  const db = requireDb();
  const batch = writeBatch(db);

  for (const product of seedProducts) {
    const { id, ...data } = product;
    batch.set(doc(db, COLLECTIONS.products, id), data, { merge: true });
  }

  batch.set(
    doc(db, COLLECTIONS.settings, SETTINGS_DOCS.payments),
    defaultPayments,
    { merge: true },
  );
  batch.set(
    doc(db, COLLECTIONS.settings, SETTINGS_DOCS.business),
    defaultBusiness,
    { merge: true },
  );
  batch.set(
    doc(db, COLLECTIONS.settings, SETTINGS_DOCS.restaurant),
    {
      name: seedRestaurant.name,
      address: seedRestaurant.address,
      phone: seedRestaurant.phone,
      phones: seedRestaurant.phones,
      email: seedRestaurant.email,
      website: seedRestaurant.website,
      deliveryEta: seedRestaurant.deliveryEta,
    } satisfies RestaurantSettingsDoc,
    { merge: true },
  );

  await batch.commit();
  return { products: seedProducts.length };
}
