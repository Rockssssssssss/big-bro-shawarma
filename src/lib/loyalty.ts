import { rewards } from "@/lib/data";
import type { CustomerVoucher, Order, Reward } from "@/lib/types";

/** Eligible for loyalty: completed deliveries only (not cancelled / in-progress). */
export function isLoyaltyEligibleOrder(order: Order): boolean {
  return order.status === "delivered";
}

/** GH₵1 spent = 1 point (integer cedis from order total paid). */
export function pointsFromOrderTotal(total: number): number {
  if (!Number.isFinite(total) || total <= 0) return 0;
  return Math.floor(total);
}

export function filterEligibleOrders(orders: Order[]): Order[] {
  return orders.filter(isLoyaltyEligibleOrder);
}

export function calculateEarnedPoints(orders: Order[]): number {
  return filterEligibleOrders(orders).reduce(
    (sum, o) => sum + pointsFromOrderTotal(o.total),
    0,
  );
}

export function calculateTotalSpent(orders: Order[]): number {
  return filterEligibleOrders(orders).reduce(
    (sum, o) => sum + (Number(o.total) || 0),
    0,
  );
}

export function calculateOrderCount(orders: Order[]): number {
  return filterEligibleOrders(orders).length;
}

/** Points already spent on redeemed vouchers (available + used). */
export function calculatePointsRedeemed(vouchers: CustomerVoucher[]): number {
  return vouchers.reduce((sum, v) => sum + (Number(v.pointsCost) || 0), 0);
}

export function calculateAvailablePoints(
  orders: Order[],
  vouchers: CustomerVoucher[],
): number {
  return Math.max(
    0,
    calculateEarnedPoints(orders) - calculatePointsRedeemed(vouchers),
  );
}

export type LoyaltyStats = {
  orders: number;
  totalSpent: number;
  points: number;
  earnedPoints: number;
  pointsRedeemed: number;
};

export function calculateLoyaltyStats(
  orders: Order[],
  vouchers: CustomerVoucher[] = [],
): LoyaltyStats {
  const earnedPoints = calculateEarnedPoints(orders);
  const pointsRedeemed = calculatePointsRedeemed(vouchers);
  return {
    orders: calculateOrderCount(orders),
    totalSpent: calculateTotalSpent(orders),
    earnedPoints,
    pointsRedeemed,
    points: Math.max(0, earnedPoints - pointsRedeemed),
  };
}

const VOUCHER_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function isVoucherAvailable(
  voucher: CustomerVoucher,
  now = Date.now(),
): boolean {
  if (voucher.status === "used") return false;
  if (voucher.status === "expired") return false;
  if (voucher.expiresAt <= now) return false;
  return voucher.status === "available";
}

export function availableVouchers(
  vouchers: CustomerVoucher[],
  now = Date.now(),
): CustomerVoucher[] {
  return vouchers.filter((v) => isVoucherAvailable(v, now));
}

export function nextRewardTier(points: number): Reward {
  return rewards.find((r) => r.points > points) ?? rewards[rewards.length - 1];
}

export function pointsToNextReward(points: number): number {
  const next = nextRewardTier(points);
  return Math.max(0, next.points - points);
}

export function findReward(rewardId: string): Reward | undefined {
  return rewards.find((r) => r.id === rewardId);
}

export function makeVoucherId(): string {
  return `v-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export function buildRedeemedVoucher(
  reward: Reward,
  now = Date.now(),
): CustomerVoucher {
  return {
    id: makeVoucherId(),
    rewardId: reward.id,
    amount: reward.amount,
    label: reward.label,
    pointsCost: reward.points,
    redeemedAt: now,
    expiresAt: now + VOUCHER_TTL_MS,
    status: "available",
  };
}
