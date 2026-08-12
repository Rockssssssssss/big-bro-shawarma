"use client";

import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-context";
import {
  cancelOrder,
  offerOrderToRiders,
  subscribeAllOrders,
  updateOrderStatus,
} from "@/lib/firebase/orders";
import type { Order, OrderStatus } from "@/lib/types";
import { formatCedi } from "@/lib/utils";
import Link from "next/link";

const columns: { id: OrderStatus; title: string }[] = [
  { id: "received", title: "New Orders" },
  { id: "preparing", title: "Preparing" },
  { id: "out-for-delivery", title: "Out for Delivery" },
  { id: "delivered", title: "Completed" },
];

function nextAction(
  status: OrderStatus,
  order: Order,
): { label: string; next: OrderStatus } | null {
  if (status === "received")
    return { label: "Confirm / Prepare", next: "preparing" };
  if (status === "preparing" && !order.riderRequested)
    return { label: "Assign Rider", next: "out-for-delivery" };
  if (status === "out-for-delivery")
    return { label: "Mark Completed", next: "delivered" };
  return null;
}

function RiderBlock({ order }: { order: Order }) {
  if (order.rider) {
    return (
      <div className="mt-2 rounded-xl bg-white px-2.5 py-2 text-xs">
        <p className="font-semibold text-secondary">{order.rider.name}</p>
        <p className="text-muted">{order.rider.phone}</p>
        <p className="mt-0.5 text-[10px] text-muted">ID: {order.rider.id}</p>
      </div>
    );
  }
  if (order.riderRequested && order.status === "preparing") {
    return (
      <p className="mt-2 text-[11px] font-medium text-amber-700">
        Awaiting rider acceptance…
      </p>
    );
  }
  return null;
}

export default function AdminOrdersPage() {
  const { isAdmin, ready, usingFirebase, profile } = useAuth();
  const [list, setList] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !usingFirebase) return;
    const unsub = subscribeAllOrders(
      (orders) => {
        setList(orders.filter((o) => o.status !== "cancelled"));
        setError(null);
      },
      (err) => setError(err.message),
    );
    return unsub;
  }, [ready, usingFirebase]);

  async function move(id: string, next: OrderStatus) {
    setBusyId(id);
    try {
      if (next === "out-for-delivery") {
        await offerOrderToRiders(id);
      } else {
        await updateOrderStatus(id, next);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function handleCancel(id: string) {
    try {
      await cancelOrder(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cancel failed");
    }
  }

  if (ready && usingFirebase && profile && !isAdmin) {
    return (
      <div className="rounded-[20px] bg-white p-8 text-center shadow-card">
        <p className="font-semibold text-secondary">Admin access required</p>
        <Link href="/admin/login" className="mt-4 inline-block text-primary">
          Go to Admin Login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Orders</h1>
        <p className="text-sm text-muted">
          Kitchen & dispatch
        </p>
      </div>

      {error && (
        <p className="rounded-xl bg-danger-light px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {!usingFirebase && (
        <p className="rounded-xl bg-primary-light px-3 py-2 text-sm">
          Live order updates are temporarily unavailable.
        </p>
      )}

      <div className="grid gap-4 xl:grid-cols-4">
        {columns.map((col) => {
          const cards = list.filter((o) => o.status === col.id);
          return (
            <section
              key={col.id}
              className="rounded-[20px] bg-white p-3 shadow-card"
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-sm font-bold text-secondary">{col.title}</h2>
                <span className="rounded-full bg-bg px-2 py-0.5 text-xs font-semibold text-muted">
                  {cards.length}
                </span>
              </div>
              <div className="space-y-3">
                {cards.map((order) => {
                  const action = nextAction(order.status, order);
                  return (
                    <article
                      key={order.id}
                      className="rounded-2xl border border-border/70 bg-bg p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-secondary">{order.id}</p>
                          <p className="text-sm font-medium">
                            {order.customerName}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-primary">
                          {formatCedi(order.total)}
                        </p>
                      </div>
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="mt-1 flex items-center gap-1 text-xs text-muted"
                      >
                        <Phone className="h-3 w-3" />
                        {order.customerPhone}
                      </a>
                      <p className="mt-2 text-xs text-secondary">
                        {order.address}
                      </p>
                      <p className="text-xs text-muted">{order.landmark}</p>
                      <ul className="mt-2 space-y-0.5 border-t border-border pt-2">
                        {order.items.map((item, i) => (
                          <li key={i} className="text-xs text-secondary">
                            {item.quantity}× {item.name}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-2 space-y-0.5 rounded-xl bg-white/70 px-2.5 py-2 text-[11px]">
                        <div className="flex justify-between gap-2 text-muted">
                          <span>Food Subtotal</span>
                          <span className="font-medium text-secondary">
                            {formatCedi(order.subtotal)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2 text-muted">
                          <span>Delivery Fee</span>
                          <span className="font-medium text-secondary">
                            {formatCedi(order.deliveryFee)}
                          </span>
                        </div>
                        {typeof order.discount === "number" &&
                        order.discount > 0 ? (
                          <div className="flex justify-between gap-2 text-muted">
                            <span>Discount</span>
                            <span className="font-medium text-secondary">
                              −{formatCedi(order.discount)}
                            </span>
                          </div>
                        ) : null}
                        <div className="flex justify-between gap-2 border-t border-border/60 pt-1 font-semibold text-secondary">
                          <span>Customer Total</span>
                          <span>{formatCedi(order.total)}</span>
                        </div>
                      </div>
                      <p className="mt-2 text-[10px] text-muted">
                        Ordered {order.time}
                      </p>

                      <RiderBlock order={order} />

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {action && (
                          <Button
                            size="sm"
                            className="text-xs"
                            disabled={busyId === order.id}
                            onClick={() => void move(order.id, action.next)}
                          >
                            {action.label}
                          </Button>
                        )}
                        {order.status !== "delivered" && (
                          <Button
                            size="sm"
                            variant="danger"
                            className="text-xs"
                            onClick={() => void handleCancel(order.id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </article>
                  );
                })}
                {cards.length === 0 && (
                  <p className="py-8 text-center text-xs text-muted">No orders</p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
