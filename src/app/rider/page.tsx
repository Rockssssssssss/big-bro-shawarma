"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MapPin, Navigation, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-context";
import {
  markOrderDelivered,
  subscribeActiveDeliveries,
} from "@/lib/firebase/orders";
import type { Order } from "@/lib/types";
import { cn, formatCedi } from "@/lib/utils";

export default function RiderHomePage() {
  const { profile, isRider, ready, usingFirebase } = useAuth();
  const [tab, setTab] = useState<"active" | "upcoming">("active");
  const [list, setList] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !usingFirebase) return;
    const unsub = subscribeActiveDeliveries(
      (orders) => {
        setList(orders);
        setError(null);
      },
      (err) => setError(err.message),
    );
    return unsub;
  }, [ready, usingFirebase]);

  const active = list.filter(
    (d) => d.status === "out-for-delivery" || d.status === "preparing",
  );
  const shown =
    tab === "active"
      ? active
      : active.filter((d) => d.status === "out-for-delivery");

  async function markDelivered(id: string) {
    try {
      await markOrderDelivered(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  if (ready && usingFirebase && profile && !isRider) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="font-semibold text-secondary">Rider access required</p>
        <p className="mt-1 text-sm text-muted">
          {profile.role === "admin"
            ? "You're logged in as Admin — use Admin Login for the console."
            : "Only rider accounts can open this screen."}
        </p>
        <Link href="/rider/login" className="mt-4 inline-block text-primary">
          Rider Login
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-up px-4 py-4">
      <h1 className="text-xl font-bold text-secondary">Today&apos;s Deliveries</h1>
      <p className="text-sm text-muted">{active.length} active runs</p>

      {error && (
        <p className="mt-2 rounded-xl bg-danger-light px-3 py-2 text-xs text-danger">
          {error}
        </p>
      )}

      <div className="mt-4 flex gap-2 rounded-2xl bg-white p-1 shadow-soft">
        {(["active", "upcoming"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-xl py-2.5 text-sm font-semibold capitalize",
              tab === t ? "bg-primary text-white" : "text-muted",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {shown.map((d) => (
          <article
            key={d.id}
            className="rounded-[20px] bg-white p-4 shadow-card"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-secondary">{d.customerName}</p>
                <p className="text-xs text-muted">{d.id}</p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase",
                  d.status === "out-for-delivery"
                    ? "bg-accent-light text-accent"
                    : "bg-primary-light text-primary",
                )}
              >
                {d.status.replace(/-/g, " ")}
              </span>
            </div>

            <div className="mt-3 flex items-start gap-2 text-sm text-secondary">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p>{d.address}</p>
                <p className="text-xs text-muted">{d.landmark}</p>
              </div>
            </div>

            <p className="mt-3 text-sm">
              <span className="text-muted">Collect </span>
              <span className="font-bold text-secondary">
                {formatCedi(d.total)}
              </span>
              <span className="text-muted">
                {" "}
                ·{" "}
                {d.paymentMethod === "cash"
                  ? "Cash"
                  : d.paymentMethod === "momo"
                    ? "MoMo"
                    : "Card"}
              </span>
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(d.address)}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button variant="outline" size="sm" className="w-full gap-1.5">
                  <Navigation className="h-3.5 w-3.5" />
                  Navigate
                </Button>
              </a>
              <a href={`tel:${d.customerPhone}`}>
                <Button variant="soft" size="sm" className="w-full gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  Call
                </Button>
              </a>
            </div>

            <Link href={`/rider/delivery/${d.id}`} className="mt-2 block">
              <Button variant="ghost" size="sm" className="w-full text-primary">
                View details
              </Button>
            </Link>

            <Button
              size="lg"
              className="mt-2 w-full"
              onClick={() => void markDelivered(d.id)}
            >
              Delivered
            </Button>
          </article>
        ))}

        {shown.length === 0 && (
          <div className="rounded-[20px] bg-white py-16 text-center shadow-card">
            <p className="font-semibold text-secondary">All clear</p>
            <p className="mt-1 text-sm text-muted">No deliveries right now</p>
          </div>
        )}
      </div>
    </div>
  );
}
