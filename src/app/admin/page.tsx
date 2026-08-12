"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  Bike,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import { useAuth } from "@/components/auth-context";
import { useCatalog } from "@/components/catalog-context";
import { isFirebaseConfigured } from "@/lib/firebase";
import { subscribeUsers } from "@/lib/firebase/auth";
import { subscribeAllOrders } from "@/lib/firebase/orders";
import {
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

export default function AdminDashboardPage() {
  const { ready } = useAuth();
  const { products } = useCatalog();
  const [orders, setOrders] = useState<Order[]>([]);
  const [customerCount, setCustomerCount] = useState(0);

  useEffect(() => {
    if (!ready || !isFirebaseConfigured()) return;
    const unsubOrders = subscribeAllOrders(setOrders);
    const unsubUsers = subscribeUsers((users) => {
      setCustomerCount(users.filter((u) => u.role === "customer").length);
    });
    return () => {
      unsubOrders();
      unsubUsers();
    };
  }, [ready]);

  const stats = useMemo(() => {
    const today = currentDayKey();
    const month = currentMonthKey();
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
    const monthFinance = totalsForMonth(orders, month);
    const dailyRows = dailySalesBreakdown(orders, month);

    const counts = new Map<string, number>();
    for (const o of orders) {
      for (const item of o.items) {
        counts.set(item.name, (counts.get(item.name) ?? 0) + item.quantity);
      }
    }
    let popular = products[0]?.name ?? "—";
    let max = 0;
    counts.forEach((qty, name) => {
      if (qty > max) {
        max = qty;
        popular = name;
      }
    });

    return {
      salesToday: todayFinance.companySales,
      ordersToday: todayOrders.length,
      pending: pending.length,
      delivered: delivered.length,
      companySales: allTime.companySales,
      riderDeliveryFees: allTime.riderDeliveryFees,
      customerPayments: allTime.customerPayments,
      monthKey: month,
      monthLabel: formatMonthLabel(month),
      monthFinance,
      dailyRows,
      popular,
      recent: orders.slice(0, 5),
    };
  }, [orders, products]);

  const widgets = [
    {
      label: "Today's Sales",
      hint: "Company food only",
      value: formatCedi(stats.salesToday),
      icon: TrendingUp,
      tone: "bg-primary-light text-primary",
    },
    {
      label: "Orders Today",
      value: String(stats.ordersToday),
      icon: ShoppingBag,
      tone: "bg-accent-light text-accent",
    },
    {
      label: "Pending Orders",
      value: String(stats.pending),
      icon: Package,
      tone: "bg-amber-100 text-amber-700",
    },
    {
      label: "Delivered",
      value: String(stats.delivered),
      icon: Bike,
      tone: "bg-accent-light text-accent",
    },
    {
      label: "Total Sales",
      hint: "Company food only",
      value: formatCedi(stats.companySales),
      icon: TrendingUp,
      tone: "bg-primary-light text-primary",
    },
    {
      label: "Customers",
      value: String(customerCount),
      icon: Users,
      tone: "bg-secondary/10 text-secondary",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Dashboard</h1>
        <p className="text-sm text-muted">
          Live overview of Big Bro Shawarma
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {widgets.map((w) => (
          <div
            key={w.label}
            className="rounded-[20px] bg-white p-5 shadow-card"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted">{w.label}</p>
                {"hint" in w && w.hint ? (
                  <p className="text-[11px] text-muted/80">{w.hint}</p>
                ) : null}
                <p className="mt-2 text-2xl font-bold text-secondary">
                  {w.value}
                </p>
              </div>
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-2xl ${w.tone}`}
              >
                <w.icon className="h-5 w-5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      <section className="rounded-[20px] bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="font-bold text-secondary">Financial Summary</h2>
            <p className="mt-0.5 text-xs text-muted">
              Company sales exclude rider delivery fees
            </p>
          </div>
          <Link
            href="/admin/reports"
            className="text-sm font-semibold text-primary"
          >
            Full reports →
          </Link>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-bg px-4 py-3">
            <p className="text-xs text-muted">Company Sales</p>
            <p className="mt-1 text-xl font-bold text-secondary">
              {formatCedi(stats.companySales)}
            </p>
            <p className="mt-1 text-[11px] text-muted">All delivered orders</p>
          </div>
          <div className="rounded-2xl bg-bg px-4 py-3">
            <p className="text-xs text-muted">Rider Delivery Fees</p>
            <p className="mt-1 text-xl font-bold text-secondary">
              {formatCedi(stats.riderDeliveryFees)}
            </p>
            <p className="mt-1 text-[11px] text-muted">Not included in sales</p>
          </div>
          <div className="rounded-2xl bg-bg px-4 py-3">
            <div className="flex items-center gap-1.5">
              <Banknote className="h-3.5 w-3.5 text-muted" />
              <p className="text-xs text-muted">Customer Payments</p>
            </div>
            <p className="mt-1 text-xl font-bold text-secondary">
              {formatCedi(stats.customerPayments)}
            </p>
            <p className="mt-1 text-[11px] text-muted">
              Food + delivery collected
            </p>
          </div>
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <h3 className="text-sm font-bold text-secondary">
            {stats.monthLabel}
          </h3>
          <p className="mt-1 text-xs text-muted">
            Monthly company sales:{" "}
            <span className="font-semibold text-secondary">
              {formatCedi(stats.monthFinance.companySales)}
            </span>
            {" · "}
            Rider fees:{" "}
            <span className="font-semibold text-secondary">
              {formatCedi(stats.monthFinance.riderDeliveryFees)}
            </span>
            {" · "}
            Customer payments:{" "}
            <span className="font-semibold text-secondary">
              {formatCedi(stats.monthFinance.customerPayments)}
            </span>
          </p>

          {stats.dailyRows.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              No delivered sales in {stats.monthLabel} yet.
            </p>
          ) : (
            <div className="mt-3 max-h-64 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-white text-xs text-muted">
                  <tr className="border-b border-border">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Company Sales</th>
                    <th className="pb-2 font-medium">Rider Fees</th>
                    <th className="pb-2 font-medium">Customer Payments</th>
                  </tr>
                </thead>
                <tbody>
                  {[...stats.dailyRows].reverse().map((row) => (
                    <tr key={row.date} className="border-b border-border/60">
                      <td className="py-2.5">{formatDayLabel(row.date)}</td>
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
              </table>
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[20px] bg-white p-5 shadow-card">
          <h2 className="font-bold text-secondary">Popular Product</h2>
          <p className="mt-4 text-3xl font-extrabold text-primary">
            {stats.popular}
          </p>
          <Link
            href="/admin/products"
            className="mt-4 inline-block text-sm font-semibold text-primary"
          >
            Manage products →
          </Link>
        </section>

        <section className="rounded-[20px] bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-secondary">Quick links</h2>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { href: "/admin/orders", label: "Orders" },
              { href: "/admin/reports", label: "Reports" },
              { href: "/admin/support", label: "Support" },
              { href: "/admin/staff", label: "Staff" },
              { href: "/admin/settings", label: "Settings" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-full bg-bg px-3.5 py-2 text-xs font-semibold text-secondary transition hover:bg-primary-light hover:text-primary"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-[20px] bg-white p-5 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-secondary">Live Orders</h2>
          <Link
            href="/admin/orders"
            className="text-sm font-semibold text-primary"
          >
            Open Kanban →
          </Link>
        </div>
        {stats.recent.length === 0 ? (
          <p className="mt-6 text-center text-sm text-muted">
            No orders yet. New customer orders will appear here.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs text-muted">
                <tr className="border-b border-border">
                  <th className="pb-3 font-medium">Order</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Total</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((o) => (
                  <tr key={o.id} className="border-b border-border/60">
                    <td className="py-3 font-semibold">{o.id}</td>
                    <td className="py-3">{o.customerName}</td>
                    <td className="py-3">{formatCedi(o.total)}</td>
                    <td className="py-3 capitalize">
                      {o.status.replace(/-/g, " ")}
                    </td>
                    <td className="py-3 text-muted">{o.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
