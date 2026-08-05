"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
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
    const today = new Date().toISOString().slice(0, 10);
    const todayOrders = orders.filter((o) => o.date === today);
    const pending = orders.filter(
      (o) =>
        o.status === "received" ||
        o.status === "preparing" ||
        o.status === "out-for-delivery",
    );
    const delivered = orders.filter((o) => o.status === "delivered");
    const salesToday = todayOrders.reduce((s, o) => s + o.total, 0);
    const revenue = delivered.reduce((s, o) => s + o.total, 0);

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
      salesToday,
      ordersToday: todayOrders.length,
      pending: pending.length,
      delivered: delivered.length,
      revenue,
      popular,
      recent: orders.slice(0, 5),
    };
  }, [orders, products]);

  const widgets = [
    {
      label: "Today's Sales",
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
      label: "Revenue",
      value: formatCedi(stats.revenue),
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
