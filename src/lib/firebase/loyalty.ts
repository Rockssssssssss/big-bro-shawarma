import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firebase/schema";
import { stripUndefined } from "@/lib/firebase/sanitize";
import {
  availableVouchers,
  buildRedeemedVoucher,
  calculateLoyaltyStats,
  findReward,
  isVoucherAvailable,
} from "@/lib/loyalty";
import type { CustomerVoucher, Order } from "@/lib/types";

function requireDb() {
  const db = getDb();
  if (!db) throw new Error("Firestore is not configured");
  return db;
}

function mapOrder(id: string, data: Record<string, unknown>): Order {
  return { id, ...data } as Order;
}

function readVouchers(data: Record<string, unknown> | undefined): CustomerVoucher[] {
  const raw = data?.vouchers;
  if (!Array.isArray(raw)) return [];
  return raw as CustomerVoucher[];
}

async function loadCustomerOrders(customerId: string): Promise<Order[]> {
  const db = requireDb();
  const snap = await getDocs(collection(db, COLLECTIONS.orders));
  return snap.docs
    .map((d) => mapOrder(d.id, d.data() as Record<string, unknown>))
    .filter((o) => o.customerId === customerId);
}

/**
 * Absolute sync from delivered orders + redeemed vouchers.
 * Safe to call repeatedly — never increments points on top of prior values.
 */
export async function syncCustomerLoyalty(customerId: string): Promise<{
  orders: number;
  totalSpent: number;
  points: number;
}> {
  const db = requireDb();
  const userRef = doc(db, COLLECTIONS.users, customerId);
  const [orders, userSnap] = await Promise.all([
    loadCustomerOrders(customerId),
    getDoc(userRef),
  ]);

  const vouchers = readVouchers(
    userSnap.exists() ? (userSnap.data() as Record<string, unknown>) : undefined,
  );
  const stats = calculateLoyaltyStats(orders, vouchers);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists()) return;
    const current = snap.data() as Record<string, unknown>;
    const currentVouchers = readVouchers(current);
    // Recalculate inside tx in case vouchers changed mid-flight
    const next = calculateLoyaltyStats(orders, currentVouchers);
    const same =
      Number(current.orders ?? 0) === next.orders &&
      Number(current.totalSpent ?? 0) === next.totalSpent &&
      Number(current.points ?? 0) === next.points;
    if (same) return;
    tx.set(
      userRef,
      stripUndefined({
        orders: next.orders,
        totalSpent: next.totalSpent,
        points: next.points,
        updatedAt: Date.now(),
      }),
      { merge: true },
    );
  });

  return {
    orders: stats.orders,
    totalSpent: stats.totalSpent,
    points: stats.points,
  };
}

/** Explicit reward → voucher. Deducts points via absolute recalculation. */
export async function redeemLoyaltyReward(
  customerId: string,
  rewardId: string,
): Promise<CustomerVoucher> {
  const reward = findReward(rewardId);
  if (!reward) throw new Error("Reward not found.");

  const db = requireDb();
  const userRef = doc(db, COLLECTIONS.users, customerId);
  const orders = await loadCustomerOrders(customerId);

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists()) throw new Error("Customer profile not found.");
    const data = snap.data() as Record<string, unknown>;
    const vouchers = readVouchers(data);
    const stats = calculateLoyaltyStats(orders, vouchers);
    if (stats.points < reward.points) {
      throw new Error("Not enough points to redeem this reward.");
    }

    const voucher = buildRedeemedVoucher(reward);
    const nextVouchers = [...vouchers, voucher];
    const nextStats = calculateLoyaltyStats(orders, nextVouchers);

    tx.set(
      userRef,
      stripUndefined({
        vouchers: nextVouchers,
        orders: nextStats.orders,
        totalSpent: nextStats.totalSpent,
        points: nextStats.points,
        updatedAt: Date.now(),
      }),
      { merge: true },
    );

    return voucher;
  });
}

export async function getCustomerAvailableVouchers(
  customerId: string,
): Promise<CustomerVoucher[]> {
  const db = requireDb();
  const snap = await getDoc(doc(db, COLLECTIONS.users, customerId));
  if (!snap.exists()) return [];
  return availableVouchers(readVouchers(snap.data() as Record<string, unknown>));
}

/**
 * Mark a redeemed voucher as used when applying at checkout.
 * Does not change loyalty points (already deducted at redemption).
 */
export async function markVoucherUsed(
  customerId: string,
  voucherId: string,
  orderId: string,
): Promise<CustomerVoucher> {
  const db = requireDb();
  const userRef = doc(db, COLLECTIONS.users, customerId);
  const now = Date.now();

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists()) throw new Error("Customer profile not found.");
    const data = snap.data() as Record<string, unknown>;
    const vouchers = readVouchers(data);
    const idx = vouchers.findIndex((v) => v.id === voucherId);
    if (idx < 0) throw new Error("Voucher not found.");
    const voucher = vouchers[idx];
    if (!isVoucherAvailable(voucher, now)) {
      throw new Error("This voucher is no longer available.");
    }

    const updated: CustomerVoucher = {
      ...voucher,
      status: "used",
      usedAt: now,
      usedOrderId: orderId,
    };
    const next = [...vouchers];
    next[idx] = updated;

    tx.set(
      userRef,
      stripUndefined({
        vouchers: next,
        updatedAt: now,
      }),
      { merge: true },
    );

    return updated;
  });
}

/** Sync after an order reaches delivered (idempotent). */
export async function syncLoyaltyForOrder(order: Order): Promise<void> {
  if (order.status !== "delivered" || !order.customerId) return;
  await syncCustomerLoyalty(order.customerId);
}
