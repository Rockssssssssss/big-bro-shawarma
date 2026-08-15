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
import { getFulfillmentType } from "@/lib/data";
import type { Order, OrderStatus } from "@/lib/types";
import { cn, formatCedi } from "@/lib/utils";
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
): { label: string; next: OrderStatus; kind: "status" | "assign-rider" } | null {
  const isPickup = getFulfillmentType(order) === "pickup";
  if (status === "received")
    return { label: "Confirm / Prepare", next: "preparing", kind: "status" };
  if (status === "preparing" && isPickup)
    return {
      label: "Ready for Pickup",
      next: "out-for-delivery",
      kind: "status",
    };
  if (status === "preparing" && !order.riderRequested)
    return {
      label: "Assign Rider",
      next: "out-for-delivery",
      kind: "assign-rider",
    };
  if (status === "out-for-delivery")
    return {
      label: isPickup ? "Mark Picked Up" : "Mark Completed",
      next: "delivered",
      kind: "status",
    };
  return null;
}

function RiderBlock({ order }: { order: Order }) {
  if (getFulfillmentType(order) === "pickup") return null;
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

  /** Status transitions that are NOT rider assignment (Confirm / Complete). */
  async function move(orderId: string, next: OrderStatus) {
    if (!orderId) return;
    setBusyId(orderId);
    try {
      await updateOrderStatus(orderId, next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  /**
   * Assign Rider for exactly one order. Uses that card's order.id only —
   * never iterates the orders list or shared selection state.
   */
  async function assignRider(orderId: string) {
    if (!orderId) return;
    setBusyId(orderId);
    setError(null);
    try {
      await offerOrderToRiders(orderId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assign failed");
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
                  const isPickup = getFulfillmentType(order) === "pickup";
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
                        <div className="flex flex-col items-end gap-1">
                          <p className="text-sm font-bold text-primary">
                            {formatCedi(order.total)}
                          </p>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                              isPickup
                                ? "bg-amber-100 text-amber-800"
                                : "bg-primary-light text-primary",
                            )}
                          >
                            {isPickup ? "Pickup" : "Delivery"}
                          </span>
                        </div>
                      </div>
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="mt-1 flex items-center gap-1 text-xs text-muted"
                      >
                        <Phone className="h-3 w-3" />
                        {order.customerPhone}
                      </a>
                      {isPickup ? (
                        <p className="mt-2 text-xs font-medium text-secondary">
                          Pickup at restaurant
                        </p>
                      ) : (
                        <>
                          <p className="mt-2 text-xs text-secondary">
                            {order.address}
                          </p>
                          <p className="text-xs text-muted">{order.landmark}</p>
                        </>
                      )}
                      <ul className="mt-2 space-y-0.5 border-t border-border pt-2">
                        {order.items.map((item, i) => (
                          <li key={i} className="text-xs text-secondary">
                            {item.quantity}× {item.name}
                          </li>
                        ))}
                      </ul>
                      {order.note ? (
                        <p className="mt-2 rounded-xl bg-white/80 px-2.5 py-2 text-[11px] text-secondary">
                          <span className="font-semibold">Note: </span>
                          {order.note}
                        </p>
                      ) : null}
                      <div className="mt-2 space-y-0.5 rounded-xl bg-white/70 px-2.5 py-2 text-[11px]">
                        <div className="flex justify-between gap-2 text-muted">
                          <span>Food Subtotal</span>
                          <span className="font-medium text-secondary">
                            {formatCedi(order.subtotal)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2 text-muted">
                          <span>
                            {isPickup ? "Delivery Fee (Pickup)" : "Delivery Fee"}
                          </span>
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
                            data-order-id={order.id}
                            onClick={() => {
                              // Capture this card's id at click time — do not use list/global state.
                              const targetOrderId = order.id;
                              if (action.kind === "assign-rider") {
                                void assignRider(targetOrderId);
                              } else {
                                void move(targetOrderId, action.next);
                              }
                            }}
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
