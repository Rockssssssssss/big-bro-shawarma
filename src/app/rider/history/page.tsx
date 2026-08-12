"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-context";
import { subscribeRiderHistory } from "@/lib/firebase/orders";
import type { Order } from "@/lib/types";
import { formatCedi } from "@/lib/utils";

function historyTime(order: Order): string {
  const ts = order.updatedAt ?? order.createdAt;
  if (ts) {
    return new Date(ts).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }
  return [order.date, order.time].filter(Boolean).join(" · ");
}

export default function RiderHistoryPage() {
  const { profile, ready, usingFirebase, isRider } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const riderId = profile?.uid ?? "";

  useEffect(() => {
    if (!ready || !usingFirebase || !riderId || !isRider) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeRiderHistory(
      riderId,
      (list) => {
        setOrders(list);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [ready, usingFirebase, riderId, isRider]);

  const totalEarnings = useMemo(
    () => orders.reduce((sum, o) => sum + (o.deliveryFee ?? 0), 0),
    [orders],
  );

  return (
    <div className="animate-fade-up px-4 py-4">
      <h1 className="text-xl font-bold text-secondary">History</h1>
      <p className="text-sm text-muted">Completed deliveries</p>

      {error && (
        <p className="mt-2 rounded-xl bg-danger-light px-3 py-2 text-xs text-danger">
          {error}
        </p>
      )}

      <div className="mt-4 rounded-[20px] bg-secondary p-5 text-white shadow-card">
        <p className="text-sm text-white/70">Earnings (recent)</p>
        <p className="mt-1 text-3xl font-extrabold">
          {formatCedi(totalEarnings)}
        </p>
        <p className="mt-1 text-xs text-white/60">
          {orders.length} completed{" "}
          {orders.length === 1 ? "delivery" : "deliveries"}
        </p>
      </div>

      <div className="mt-4 space-y-2.5">
        {loading ? (
          <p className="py-8 text-center text-sm text-muted">Loading…</p>
        ) : orders.length === 0 ? (
          <div className="rounded-[20px] bg-white p-8 text-center shadow-card">
            <p className="font-semibold text-secondary">No completed deliveries</p>
            <p className="mt-1 text-sm text-muted">
              Finished deliveries will show here with your earnings.
            </p>
          </div>
        ) : (
          orders.map((o) => {
            const earning = o.deliveryFee ?? 0;
            return (
              <article
                key={o.id}
                className="rounded-[20px] bg-white p-4 shadow-card"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-secondary">{o.customerName}</p>
                    <p className="text-xs text-muted">
                      {o.id} · {o.address}
                    </p>
                  </div>
                  <p className="font-bold text-accent">
                    +{formatCedi(earning)}
                  </p>
                </div>
                <div className="mt-2 flex justify-between text-xs text-muted">
                  <span>Collected {formatCedi(o.total)}</span>
                  <span>{historyTime(o)}</span>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
