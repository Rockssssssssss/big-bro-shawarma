import type { Order } from "@/lib/types";

/** Existing eligible-sale rule: only completed (delivered) orders. */
export function isEligibleSaleOrder(order: Order): boolean {
  return order.status === "delivered";
}

/** Company product/food sales — excludes delivery fee. */
export function companySalesOf(order: Order): number {
  return Number(order.subtotal) || 0;
}

/** Rider delivery-fee earnings for an order. */
export function riderDeliveryFeeOf(order: Order): number {
  return Number(order.deliveryFee) || 0;
}

/** Amount collected from the customer (food + delivery − discount). */
export function customerPaymentOf(order: Order): number {
  return Number(order.total) || 0;
}

export type FinancialTotals = {
  companySales: number;
  riderDeliveryFees: number;
  customerPayments: number;
  orderCount: number;
};

export type DailySalesRow = FinancialTotals & {
  date: string;
};

export function emptyTotals(): FinancialTotals {
  return {
    companySales: 0,
    riderDeliveryFees: 0,
    customerPayments: 0,
    orderCount: 0,
  };
}

export function sumFinancials(orders: Order[]): FinancialTotals {
  const totals = emptyTotals();
  for (const o of orders) {
    if (!isEligibleSaleOrder(o)) continue;
    totals.companySales += companySalesOf(o);
    totals.riderDeliveryFees += riderDeliveryFeeOf(o);
    totals.customerPayments += customerPaymentOf(o);
    totals.orderCount += 1;
  }
  return totals;
}

/** YYYY-MM from an order date string (YYYY-MM-DD). */
export function monthKeyFromDate(date: string): string {
  return date.slice(0, 7);
}

export function currentMonthKey(d = new Date()): string {
  return d.toISOString().slice(0, 10).slice(0, 7);
}

export function currentDayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** "2026-10" → "October 2026" */
export function formatMonthLabel(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  if (!y || !m) return yearMonth;
  const label = new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return label;
}

/** "2026-10-01" → "Thursday 1st" style label */
export function formatDayLabel(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return date;
  const dt = new Date(Date.UTC(y, m - 1, d));
  const weekday = dt.toLocaleString("en-GB", {
    weekday: "long",
    timeZone: "UTC",
  });
  const day = d;
  const suffix =
    day % 10 === 1 && day % 100 !== 11
      ? "st"
      : day % 10 === 2 && day % 100 !== 12
        ? "nd"
        : day % 10 === 3 && day % 100 !== 13
          ? "rd"
          : "th";
  return `${weekday} ${day}${suffix}`;
}

/**
 * One row per calendar day that has eligible sales.
 * Optionally filter to a single YYYY-MM month (year-aware).
 */
export function dailySalesBreakdown(
  orders: Order[],
  yearMonth?: string,
): DailySalesRow[] {
  const byDay = new Map<string, FinancialTotals>();

  for (const o of orders) {
    if (!isEligibleSaleOrder(o)) continue;
    if (!o.date) continue;
    if (yearMonth && monthKeyFromDate(o.date) !== yearMonth) continue;

    const row = byDay.get(o.date) ?? emptyTotals();
    row.companySales += companySalesOf(o);
    row.riderDeliveryFees += riderDeliveryFeeOf(o);
    row.customerPayments += customerPaymentOf(o);
    row.orderCount += 1;
    byDay.set(o.date, row);
  }

  return Array.from(byDay.entries())
    .map(([date, totals]) => ({ date, ...totals }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Distinct YYYY-MM keys that have eligible sales, newest first. Always includes current month. */
export function availableMonthKeys(orders: Order[], now = new Date()): string[] {
  const keys = new Set<string>();
  keys.add(currentMonthKey(now));
  for (const o of orders) {
    if (!isEligibleSaleOrder(o) || !o.date) continue;
    keys.add(monthKeyFromDate(o.date));
  }
  return Array.from(keys).sort((a, b) => b.localeCompare(a));
}

export function totalsForMonth(
  orders: Order[],
  yearMonth: string,
): FinancialTotals {
  return sumFinancials(
    orders.filter(
      (o) => isEligibleSaleOrder(o) && monthKeyFromDate(o.date) === yearMonth,
    ),
  );
}

export function totalsForDay(orders: Order[], day: string): FinancialTotals {
  return sumFinancials(
    orders.filter((o) => isEligibleSaleOrder(o) && o.date === day),
  );
}
