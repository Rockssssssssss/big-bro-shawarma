import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firebase/schema";
import type { Order, OrderStatus, PaymentMethod, OrderItem } from "@/lib/types";

function requireDb() {
  const db = getDb();
  if (!db) throw new Error("Firestore is not configured");
  return db;
}

function todayParts(d = new Date()) {
  const date = d.toISOString().slice(0, 10);
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return { date, time };
}

function makeOrderId() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `BB-${n}`;
}

export type CreateOrderInput = {
  customerId?: string;
  customerEmail?: string;
  customerName: string;
  customerPhone: string;
  address: string;
  landmark: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
};

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const db = requireDb();
  const id = makeOrderId();
  const now = Date.now();
  const { date, time } = todayParts();

  const order: Order = {
    id,
    customerId: input.customerId,
    customerEmail: input.customerEmail,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    address: input.address,
    landmark: input.landmark,
    date,
    time,
    status: "received",
    items: input.items,
    subtotal: input.subtotal,
    deliveryFee: input.deliveryFee,
    total: input.total,
    paymentMethod: input.paymentMethod,
    reviewed: false,
    createdAt: now,
    updatedAt: now,
  };

  const { id: _id, ...data } = order;
  await setDoc(doc(db, COLLECTIONS.orders, id), data);
  return order;
}

function mapOrder(id: string, data: Record<string, unknown>): Order {
  return { id, ...data } as Order;
}

function sortOrders(list: Order[]) {
  return [...list].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

/** Subscribe to all orders (admin). Avoids composite indexes. */
export function subscribeAllOrders(
  onData: (orders: Order[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const db = requireDb();
  return onSnapshot(
    collection(db, COLLECTIONS.orders),
    (snap) => {
      onData(sortOrders(snap.docs.map((d) => mapOrder(d.id, d.data()))));
    },
    (err) => onError?.(err),
  );
}

export function subscribeCustomerOrders(
  customerId: string,
  onData: (orders: Order[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const db = requireDb();
  return onSnapshot(
    collection(db, COLLECTIONS.orders),
    (snap) => {
      const list = snap.docs
        .map((d) => mapOrder(d.id, d.data()))
        .filter((o) => o.customerId === customerId);
      onData(sortOrders(list));
    },
    (err) => onError?.(err),
  );
}

export function subscribeActiveDeliveries(
  onData: (orders: Order[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  return subscribeAllOrders((all) => {
    onData(
      all.filter(
        (o) =>
          o.status === "out-for-delivery" ||
          (o.status === "preparing" && !!o.rider),
      ),
    );
  }, onError);
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<void> {
  const db = requireDb();
  await updateDoc(doc(db, COLLECTIONS.orders, orderId), {
    status,
    updatedAt: Date.now(),
  });
}

export async function assignRiderToOrder(
  orderId: string,
  rider: { id: string; name: string; phone: string; eta?: string },
): Promise<void> {
  const db = requireDb();
  await updateDoc(doc(db, COLLECTIONS.orders, orderId), {
    status: "out-for-delivery" as OrderStatus,
    rider,
    updatedAt: Date.now(),
  });
}

export async function markOrderDelivered(orderId: string): Promise<void> {
  await updateOrderStatus(orderId, "delivered");
}

export async function cancelOrder(orderId: string): Promise<void> {
  await updateOrderStatus(orderId, "cancelled");
}

/** Delete all orders (fresh production reset). */
export async function clearAllOrders(): Promise<number> {
  const db = requireDb();
  const snap = await getDocs(collection(db, COLLECTIONS.orders));
  if (snap.empty) return 0;
  // Firestore batches max 500
  const docs = snap.docs;
  for (let i = 0; i < docs.length; i += 450) {
    const batch = writeBatch(db);
    docs.slice(i, i + 450).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  return docs.length;
}
