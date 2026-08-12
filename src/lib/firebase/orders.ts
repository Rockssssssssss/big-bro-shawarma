import {
  arrayUnion,
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  runTransaction,
  setDoc,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firebase/schema";
import { stripUndefined } from "@/lib/firebase/sanitize";
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
  latitude?: number;
  longitude?: number;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
};

export type RiderInfo = { id: string; name: string; phone: string; eta?: string };

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const db = requireDb();
  const id = makeOrderId();
  const now = Date.now();
  const { date, time } = todayParts();

  const order: Order = {
    id,
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

  if (input.customerId) order.customerId = input.customerId;
  if (input.customerEmail) order.customerEmail = input.customerEmail;
  if (
    typeof input.latitude === "number" &&
    Number.isFinite(input.latitude) &&
    typeof input.longitude === "number" &&
    Number.isFinite(input.longitude)
  ) {
    order.latitude = input.latitude;
    order.longitude = input.longitude;
  }

  const { id: _id, ...data } = order;
  await setDoc(doc(db, COLLECTIONS.orders, id), stripUndefined(data));
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

/**
 * Rider feed for a specific rider:
 * - Pending offers (preparing + riderRequested, not yet claimed, not declined by this rider)
 * - Active deliveries assigned to this rider (out-for-delivery)
 */
export function isPendingOfferForRider(order: Order, riderId: string): boolean {
  const declined = order.declinedBy ?? [];
  return (
    order.status === "preparing" &&
    !!order.riderRequested &&
    !order.rider &&
    !declined.includes(riderId)
  );
}

export function subscribeActiveDeliveries(
  riderId: string,
  onData: (orders: Order[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  return subscribeAllOrders((all) => {
    onData(
      all.filter((o) => {
        const isPendingOffer = isPendingOfferForRider(o, riderId);
        const isMyActive =
          o.status === "out-for-delivery" && o.rider?.id === riderId;
        return isPendingOffer || isMyActive;
      }),
    );
  }, onError);
}

/** Completed deliveries for the authenticated rider (History). */
export function subscribeRiderHistory(
  riderId: string,
  onData: (orders: Order[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  return subscribeAllOrders((all) => {
    onData(
      all.filter(
        (o) => o.status === "delivered" && o.rider?.id === riderId,
      ),
    );
  }, onError);
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const db = requireDb();
  const snap = await getDoc(doc(db, COLLECTIONS.orders, orderId));
  if (!snap.exists()) return null;
  return mapOrder(snap.id, snap.data() as Record<string, unknown>);
}

export async function markOrderReviewed(orderId: string): Promise<void> {
  const db = requireDb();
  await updateDoc(doc(db, COLLECTIONS.orders, orderId), {
    reviewed: true,
    updatedAt: Date.now(),
  });
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

/**
 * Admin opens the order to all registered riders.
 * Keeps status as preparing; does not assign a rider yet.
 */
export async function offerOrderToRiders(orderId: string): Promise<void> {
  const db = requireDb();
  await updateDoc(doc(db, COLLECTIONS.orders, orderId), {
    riderRequested: true,
    declinedBy: [],
    rider: deleteField(),
    updatedAt: Date.now(),
  });
}

/** @deprecated Prefer offerOrderToRiders + acceptOrderAsRider. Kept for compatibility. */
export async function assignRiderToOrder(
  orderId: string,
  rider: RiderInfo,
): Promise<void> {
  const db = requireDb();
  await updateDoc(
    doc(db, COLLECTIONS.orders, orderId),
    stripUndefined({
      status: "out-for-delivery" as OrderStatus,
      rider,
      riderRequested: false,
      updatedAt: Date.now(),
    }),
  );
}

/**
 * Atomic claim: only the first successful transaction assigns the rider.
 */
export async function acceptOrderAsRider(
  orderId: string,
  rider: RiderInfo,
): Promise<void> {
  const db = requireDb();
  const ref = doc(db, COLLECTIONS.orders, orderId);

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) {
        throw new Error("Order not found.");
      }
      const data = snap.data() as Order;
      if (data.rider || data.status === "out-for-delivery") {
        throw new Error(
          "This order has already been accepted by another rider.",
        );
      }
      if (data.status !== "preparing" || !data.riderRequested) {
        throw new Error("This order is no longer available.");
      }
      if ((data.declinedBy ?? []).includes(rider.id)) {
        throw new Error("You already declined this order.");
      }
      tx.update(
        ref,
        stripUndefined({
          status: "out-for-delivery" as OrderStatus,
          rider: {
            id: rider.id,
            name: rider.name,
            phone: rider.phone,
          },
          riderRequested: false,
          updatedAt: Date.now(),
        }),
      );
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (
      msg.includes("already been accepted") ||
      msg.includes("no longer available") ||
      msg.includes("already declined") ||
      msg.includes("Order not found")
    ) {
      throw err instanceof Error ? err : new Error(msg);
    }
    throw new Error(
      "This order has already been accepted by another rider.",
    );
  }
}

/** Rider declines this offer (BUSY). Does not change permanent rider status. */
export async function declineOrderAsRider(
  orderId: string,
  riderId: string,
): Promise<void> {
  const db = requireDb();
  await updateDoc(doc(db, COLLECTIONS.orders, orderId), {
    declinedBy: arrayUnion(riderId),
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
