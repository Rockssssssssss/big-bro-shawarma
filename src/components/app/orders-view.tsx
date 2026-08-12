"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Phone } from "lucide-react";
import { PageHeader } from "./page-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-context";
import { useCart } from "@/components/cart-context";
import { orderStatusLabel } from "@/lib/data";
import {
  subscribeCustomerOrders,
} from "@/lib/firebase/orders";
import type { Order, OrderStatus } from "@/lib/types";
import { cn, formatCedi } from "@/lib/utils";

const steps: OrderStatus[] = [
  "received",
  "preparing",
  "out-for-delivery",
  "delivered",
];

function StatusBadge({ status }: { status: OrderStatus }) {
  const colors: Record<OrderStatus, string> = {
    received: "bg-primary-light text-primary",
    preparing: "bg-amber-100 text-amber-700",
    "out-for-delivery": "bg-accent-light text-accent",
    delivered: "bg-accent-light text-accent",
    cancelled: "bg-danger-light text-danger",
  };
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-semibold",
        colors[status],
      )}
    >
      {orderStatusLabel[status]}
    </span>
  );
}

function Timeline({ status }: { status: OrderStatus }) {
  if (status === "cancelled") return null;
  const idx = steps.indexOf(status);
  return (
    <div className="mt-4 space-y-0">
      {steps.map((step, i) => {
        const done = i <= idx;
        return (
          <div key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "mt-0.5 h-3 w-3 rounded-full",
                  done ? "bg-primary" : "bg-border",
                )}
              />
              {i < steps.length - 1 && (
                <span
                  className={cn(
                    "my-0.5 min-h-4 w-0.5 flex-1",
                    i < idx ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </div>
            <p
              className={cn(
                "pb-3 text-sm",
                done ? "font-medium text-secondary" : "text-muted",
              )}
            >
              {orderStatusLabel[step]}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function OrdersView() {
  const { user, usingFirebase, ready } = useAuth();
  const { addItem } = useCart();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!usingFirebase) {
      setLoading(false);
      return;
    }
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const unsub = subscribeCustomerOrders(
      user.uid,
      (list) => {
        setOrders(list);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [ready, usingFirebase, user]);

  function orderAgain(order: Order) {
    order.items.forEach((item) => {
      addItem(item.productId, item.quantity, []);
    });
    router.push("/app/cart");
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="Orders" />
      <div className="space-y-3 px-4 pb-6">
        {!user && usingFirebase && (
          <div className="rounded-[20px] bg-white p-6 text-center shadow-card">
            <p className="font-semibold text-secondary">Log in to see orders</p>
            <Link href="/app/login" className="mt-4 inline-block">
              <Button>Login</Button>
            </Link>
          </div>
        )}

        {loading && (
          <p className="py-8 text-center text-sm text-muted">Loading orders...</p>
        )}

        {error && (
          <p className="rounded-xl bg-danger-light px-3 py-2 text-xs text-danger">
            {error}
          </p>
        )}

        {!loading && user && orders.length === 0 && (
          <div className="rounded-[20px] bg-white p-8 text-center shadow-card">
            <p className="font-semibold text-secondary">No orders yet</p>
            <p className="mt-1 text-sm text-muted">
              Place your first shawarma order and track it here.
            </p>
            <Link href="/app/home" className="mt-4 inline-block">
              <Button>Browse Menu</Button>
            </Link>
          </div>
        )}

        {orders.map((order) => (
          <article
            key={order.id}
            className="rounded-[20px] bg-white p-4 shadow-card"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-secondary">{order.id}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {order.date} · {order.time}
                </p>
              </div>
              <StatusBadge status={order.status} />
            </div>

            <ul className="mt-3 space-y-1">
              {order.items.map((item, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span className="text-secondary">
                    {item.quantity}× {item.name}
                  </span>
                  <span className="text-muted">{formatCedi(item.price)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm text-muted">Total</span>
              <span className="font-bold text-secondary">
                {formatCedi(order.total)}
              </span>
            </div>

            {(order.status === "preparing" ||
              order.status === "out-for-delivery" ||
              order.status === "received") && (
              <>
                <Timeline status={order.status} />
                {order.rider && order.status === "out-for-delivery" && (
                  <div className="mt-2 flex items-center justify-between rounded-2xl bg-bg p-3">
                    <div>
                      <p className="text-sm font-semibold text-secondary">
                        {order.rider.name}
                      </p>
                      <p className="text-xs text-muted">{order.rider.phone}</p>
                    </div>
                    <a href={`tel:${order.rider.phone}`}>
                      <Button size="sm" variant="soft" className="gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        Call Rider
                      </Button>
                    </a>
                  </div>
                )}
              </>
            )}

            <div className="mt-3 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => orderAgain(order)}
              >
                Order Again
              </Button>
              {order.status === "delivered" && !order.reviewed && (
                <Link
                  href={`/app/orders/${order.id}/review`}
                  className="flex-1"
                >
                  <Button size="sm" className="w-full">
                    Review
                  </Button>
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
