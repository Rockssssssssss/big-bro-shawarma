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
import type { Order } from "@/lib/types";
import { formatCedi } from "@/lib/utils";

export default function AdminReportsPage() {
  const { ready } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!ready || !isFirebaseConfigured()) return;
    return subscribeAllOrders(setOrders);
  }, [ready]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayOrders = orders.filter((o) => o.date === today);
    const delivered = orders.filter((o) => o.status === "delivered");
    const pending = orders.filter(
      (o) =>
        o.status === "received" ||
        o.status === "preparing" ||
        o.status === "out-for-delivery",
    );
    const salesToday = todayOrders.reduce((s, o) => s + o.total, 0);
    const revenue = delivered.reduce((s, o) => s + o.total, 0);
    const byPayment = {
      cash: orders.filter((o) => o.paymentMethod === "cash").length,
      momo: orders.filter((o) => o.paymentMethod === "momo").length,
      card: orders.filter((o) => o.paymentMethod === "card").length,
    };
    return {
      salesToday,
      ordersToday: todayOrders.length,
      pending: pending.length,
      delivered: delivered.length,
      revenue,
      total: orders.length,
      byPayment,
      avgTicket: delivered.length ? revenue / delivered.length : 0,
    };
  }, [orders]);

  const cards = [
    {
      label: "Today's Sales",
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
      label: "Total Revenue",
      value: formatCedi(stats.revenue),
      icon: Banknote,
    },
    {
      label: "Avg. Order",
      value: formatCedi(stats.avgTicket),
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-5 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Reports</h1>
        <p className="text-sm text-muted">
          Live order analytics from Firebase
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-[20px] bg-white p-5 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted">{c.label}</p>
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
