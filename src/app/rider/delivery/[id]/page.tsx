"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, MapPin, Navigation, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  markOrderDelivered,
  subscribeAllOrders,
} from "@/lib/firebase/orders";
import type { Order } from "@/lib/types";
import { formatCedi } from "@/lib/utils";

export default function RiderDeliveryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [delivery, setDelivery] = useState<Order | null>(null);

  useEffect(() => {
    const unsub = subscribeAllOrders((orders) => {
      setDelivery(orders.find((o) => o.id === params.id) ?? null);
    });
    return unsub;
  }, [params.id]);

  if (!delivery) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="font-semibold text-secondary">Delivery not found</p>
        <Link href="/rider" className="mt-4 inline-block text-primary">
          Back to today
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-up px-4 py-3 pb-8">
      <div className="mb-3 flex items-center gap-2">
        <Link
          href="/rider"
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold text-secondary">Delivery Details</h1>
      </div>

      <div className="space-y-3">
        <section className="rounded-[20px] bg-white p-4 shadow-card">
          <p className="text-xs text-muted">{delivery.id}</p>
          <h2 className="mt-1 text-xl font-bold text-secondary">
            {delivery.customerName}
          </h2>
          <a
            href={`tel:${delivery.customerPhone}`}
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary"
          >
            <Phone className="h-4 w-4" />
            {delivery.customerPhone}
          </a>
        </section>

        <section className="rounded-[20px] bg-white p-4 shadow-card">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold text-secondary">{delivery.address}</p>
              <p className="mt-1 text-sm text-muted">{delivery.landmark}</p>
            </div>
          </div>
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(delivery.address)}`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 block"
          >
            <Button variant="outline" className="w-full gap-2">
              <Navigation className="h-4 w-4" />
              Open in Maps
            </Button>
          </a>
        </section>

        <section className="rounded-[20px] bg-white p-4 shadow-card">
          <h3 className="font-semibold text-secondary">Order items</h3>
          <ul className="mt-3 space-y-2">
            {delivery.items.map((item, i) => (
              <li key={i} className="flex justify-between text-sm">
                <span>
                  {item.quantity}× {item.name}
                  {item.extras.length > 0 && (
                    <span className="block text-xs text-muted">
                      {item.extras.join(", ")}
                    </span>
                  )}
                </span>
                <span className="font-medium">{formatCedi(item.price)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-border pt-3">
            <div className="flex justify-between">
              <span className="font-bold">Amount to collect</span>
              <span className="text-lg font-bold text-primary">
                {formatCedi(delivery.total)}
              </span>
            </div>
            <p className="mt-1 text-xs capitalize text-muted">
              Payment:{" "}
              {delivery.paymentMethod === "cash"
                ? "Cash on Delivery"
                : delivery.paymentMethod}
            </p>
          </div>
        </section>

        <Button
          size="xl"
          className="w-full"
          onClick={async () => {
            await markOrderDelivered(delivery.id);
            router.push("/rider");
          }}
        >
          Mark as Delivered
        </Button>
      </div>
    </div>
  );
}
