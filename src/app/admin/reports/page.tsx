"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  Bike,
  Package,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/components/auth-context";
import { isFirebaseConfigured } from "@/lib/firebase";
import { subscribeAllOrders } from "@/lib/firebase/orders";
import {
  availableMonthKeys,
  currentDayKey,
  currentMonthKey,
  dailySalesBreakdown,
  formatDayLabel,
  formatMonthLabel,
  sumFinancials,
  totalsForDay,
  totalsForMonth,
} from "@/lib/sales-report";
import type { Order } from "@/lib/types";
import { formatCedi } from "@/lib/utils";

export default function AdminReportsPage() {
  const { ready } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());

  useEffect(() => {
    if (!ready || !isFirebaseConfigured()) return;
    return subscribeAllOrders(setOrders);
  }, [ready]);

  const stats = useMemo(() => {
    const today = currentDayKey();
    const todayOrders = orders.filter((o) => o.date === today);
    const pending = orders.filter(
      (o) =>
        o.status === "received" ||
        o.status === "preparing" ||
        o.status === "out-for-delivery",
    );
    const delivered = orders.filter((o) => o.status === "delivered");

    const todayFinance = totalsForDay(orders, today);
    const allTime = sumFinancials(orders);
    const monthKeys = availableMonthKeys(orders);
    const month = monthKeys.includes(selectedMonth)
      ? selectedMonth
      : currentMonthKey();
    const monthFinance = totalsForMonth(orders, month);
    const dailyRows = dailySalesBreakdown(orders, month);

    return {
      salesToday: todayFinance.companySales,
      ordersToday: todayOrders.length,
      pending: pending.length,
      delivered: delivered.length,
      companySales: allTime.companySales,
      riderDeliveryFees: allTime.riderDeliveryFees,
      customerPayments: allTime.customerPayments,
      total: orders.length,
      byPayment: {
        cash: orders.filter((o) => o.paymentMethod === "cash").length,
        momo: orders.filter((o) => o.paymentMethod === "momo").length,
        card: orders.filter((o) => o.paymentMethod === "card").length,
      },
      avgCompanyTicket: delivered.length
        ? allTime.companySales / delivered.length
        : 0,
      monthKeys,
      month,
      monthLabel: formatMonthLabel(month),
      monthFinance,
      dailyRows,
    };
  }, [orders, selectedMonth]);

  const cards = [
    {
      label: "Today's Sales",
      hint: "Company food only",
      value: formatCedi(stats.salesToday),
      icon: TrendingUp,
    },
    {
      label: "Orders Today",
      value: String(stats.ordersToday),
      icon: ShoppingBag,
    },
    {
      label: "Active Orders",
      value: String(stats.pending),
      icon: Package,
    },
    {
      label: "Delivered",
      value: String(stats.delivered),
      icon: Bike,
    },
    {
      label: "Total Sales",
      hint: "Company food only",
      value: formatCedi(stats.companySales),
      icon: Banknote,
    },
    {
      label: "Avg. Company Sale",
      value: formatCedi(stats.avgCompanyTicket),
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-5 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Reports</h1>
        <p className="text-sm text-muted">
          Company sales vs rider delivery fees from real delivered orders
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-[20px] bg-white p-5 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted">{c.label}</p>
                {"hint" in c && c.hint ? (
                  <p className="text-[11px] text-muted/80">{c.hint}</p>
                ) : null}
                <p className="mt-2 text-2xl font-bold text-secondary">
                  {c.value}
                </p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-light text-primary">
                <c.icon className="h-5 w-5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      <section className="rounded-[20px] bg-white p-5 shadow-card">
        <h2 className="font-bold text-secondary">Financial Separation</h2>
        <p className="mt-1 text-xs text-muted">
          All-time totals from delivered orders only
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-bg px-4 py-3">
            <p className="text-xs text-muted">Company Sales</p>
            <p className="mt-1 text-xl font-bold text-secondary">
              {formatCedi(stats.companySales)}
            </p>
            <p className="mt-1 text-[11px] text-muted">Product / food subtotals</p>
          </div>
          <div className="rounded-2xl bg-bg px-4 py-3">
            <p className="text-xs text-muted">Rider Delivery Fees</p>
            <p className="mt-1 text-xl font-bold text-secondary">
              {formatCedi(stats.riderDeliveryFees)}
            </p>
            <p className="mt-1 text-[11px] text-muted">Excluded from company sales</p>
          </div>
          <div className="rounded-2xl bg-bg px-4 py-3">
            <p className="text-xs text-muted">Customer Payments Collected</p>
            <p className="mt-1 text-xl font-bold text-secondary">
              {formatCedi(stats.customerPayments)}
            </p>
            <p className="mt-1 text-[11px] text-muted">Food + delivery</p>
          </div>
        </div>
      </section>

      <section className="rounded-[20px] bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-bold text-secondary">Monthly Sales</h2>
            <p className="mt-1 text-xs text-muted">
              Calendar month / year separation from real order dates
            </p>
          </div>
          <label className="flex flex-col gap-1 text-xs text-muted">
            Month
            <select
              value={stats.month}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-xl border border-border bg-bg px-3 py-2 text-sm font-semibold text-secondary outline-none focus:border-primary"
            >
              {stats.monthKeys.map((key) => (
                <option key={key} value={key}>
                  {formatMonthLabel(key)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-primary-light/40 px-4 py-3">
            <p className="text-xs text-muted">
              {stats.monthLabel} — Company Sales
            </p>
            <p className="mt-1 text-2xl font-bold text-secondary">
              {formatCedi(stats.monthFinance.companySales)}
            </p>
          </div>
          <div className="rounded-2xl bg-bg px-4 py-3">
            <p className="text-xs text-muted">Rider Delivery Fees</p>
            <p className="mt-1 text-xl font-bold text-secondary">
              {formatCedi(stats.monthFinance.riderDeliveryFees)}
            </p>
          </div>
          <div className="rounded-2xl bg-bg px-4 py-3">
            <p className="text-xs text-muted">Customer Payments</p>
            <p className="mt-1 text-xl font-bold text-secondary">
              {formatCedi(stats.monthFinance.customerPayments)}
            </p>
          </div>
        </div>

        <h3 className="mt-6 text-sm font-bold text-secondary">
          Daily breakdown
        </h3>
        <p className="mt-0.5 text-xs text-muted">
          Company sales per day (delivery fees shown separately)
        </p>

        {stats.dailyRows.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            No delivered sales in {stats.monthLabel}.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs text-muted">
                <tr className="border-b border-border">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Orders</th>
                  <th className="pb-2 font-medium">Company Sales</th>
                  <th className="pb-2 font-medium">Rider Delivery Fees</th>
                  <th className="pb-2 font-medium">Customer Payments</th>
                </tr>
              </thead>
              <tbody>
                {[...stats.dailyRows].reverse().map((row) => (
                  <tr key={row.date} className="border-b border-border/60">
                    <td className="py-2.5">
                      <span className="font-medium text-secondary">
                        {formatDayLabel(row.date)}
                      </span>
                      <span className="ml-2 text-xs text-muted">{row.date}</span>
                    </td>
                    <td className="py-2.5">{row.orderCount}</td>
                    <td className="py-2.5 font-semibold text-secondary">
                      {formatCedi(row.companySales)}
                    </td>
                    <td className="py-2.5">
                      {formatCedi(row.riderDeliveryFees)}
                    </td>
                    <td className="py-2.5">
                      {formatCedi(row.customerPayments)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border text-sm font-bold text-secondary">
                  <td className="pt-3">Month total</td>
                  <td className="pt-3">{stats.monthFinance.orderCount}</td>
                  <td className="pt-3">
                    {formatCedi(stats.monthFinance.companySales)}
                  </td>
                  <td className="pt-3">
                    {formatCedi(stats.monthFinance.riderDeliveryFees)}
                  </td>
                  <td className="pt-3">
                    {formatCedi(stats.monthFinance.customerPayments)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-[20px] bg-white p-5 shadow-card">
        <h2 className="font-bold text-secondary">Payment mix</h2>
        <p className="mt-1 text-xs text-muted">
          Based on {stats.total} order{stats.total === 1 ? "" : "s"}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Cash on Delivery", count: stats.byPayment.cash },
            { label: "Mobile Money", count: stats.byPayment.momo },
            { label: "Card", count: stats.byPayment.card },
          ].map((p) => (
            <div key={p.label} className="rounded-2xl bg-bg px-4 py-3">
              <p className="text-xs text-muted">{p.label}</p>
              <p className="mt-1 text-xl font-bold text-secondary">{p.count}</p>
            </div>
          ))}
        </div>
      </section>

      {stats.total === 0 && (
        <p className="text-center text-sm text-muted">
          No orders yet — reports will fill in as customers place orders.
        </p>
      )}
    </div>
  );
}
