import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firebase/schema";
import { getOrder, markOrderReviewed } from "@/lib/firebase/orders";
import { stripUndefined } from "@/lib/firebase/sanitize";
import type { Review } from "@/lib/types";

function requireDb() {
  const db = getDb();
  if (!db) throw new Error("Firestore is not configured");
  return db;
}

function mapReview(id: string, data: Record<string, unknown>): Review {
  return {
    id,
    name: String(data.name ?? ""),
    rating: Number(data.rating ?? 0),
    comment: String(data.comment ?? ""),
    date: String(data.date ?? ""),
    product: data.product ? String(data.product) : undefined,
    reply: data.reply ? String(data.reply) : undefined,
    orderId: data.orderId ? String(data.orderId) : undefined,
    customerId: data.customerId ? String(data.customerId) : undefined,
    createdAt: data.createdAt ? Number(data.createdAt) : undefined,
  };
}

export async function createReview(input: {
  orderId: string;
  customerId?: string;
  name: string;
  rating: number;
  comment: string;
}): Promise<string> {
  const db = requireDb();
  const order = await getOrder(input.orderId);
  if (!order) throw new Error("Order not found.");
  if (order.status !== "delivered") {
    throw new Error("Only completed orders can be reviewed.");
  }
  if (order.reviewed) {
    throw new Error("This order was already reviewed.");
  }
  if (input.rating < 1 || input.rating > 5) {
    throw new Error("Please choose a rating.");
  }

  const now = Date.now();
  const productLabel =
    order.items.map((i) => i.name).filter(Boolean).slice(0, 2).join(", ") ||
    `Order ${order.id}`;

  const payload = stripUndefined({
    name: input.name.trim() || order.customerName,
    rating: input.rating,
    comment: input.comment.trim(),
    date: new Date(now).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    product: productLabel,
    orderId: order.id,
    customerId: input.customerId || order.customerId,
    createdAt: now,
    updatedAt: now,
  });

  const ref = await addDoc(collection(db, COLLECTIONS.reviews), payload);
  await markOrderReviewed(order.id);
  return ref.id;
}

export function subscribeReviews(
  onData: (reviews: Review[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const db = requireDb();
  return onSnapshot(
    collection(db, COLLECTIONS.reviews),
    (snap) => {
      const list = snap.docs
        .map((d) => mapReview(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      onData(list);
    },
    (err) => onError?.(err),
  );
}

export async function replyToReview(id: string, reply: string): Promise<void> {
  const db = requireDb();
  await updateDoc(doc(db, COLLECTIONS.reviews, id), {
    reply: reply.trim(),
    updatedAt: Date.now(),
  });
}
