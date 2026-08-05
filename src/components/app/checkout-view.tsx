"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  Check,
  Clock,
  CreditCard,
  MapPin,
  Navigation,
  Smartphone,
} from "lucide-react";
import { PageHeader } from "./page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth-context";
import { useCart } from "@/components/cart-context";
import { useCatalog } from "@/components/catalog-context";
import { createOrder } from "@/lib/firebase/orders";
import { extras, restaurant } from "@/lib/data";
import type { OrderItem, PaymentMethod } from "@/lib/types";
import {
  cn,
  formatCedi,
  GHANA_PHONE_PLACEHOLDER,
  isValidGhanaPhone,
  normalizeGhanaPhone,
} from "@/lib/utils";

const paymentMeta: {
  id: PaymentMethod;
  title: string;
  subtitle: string;
  icon: typeof Smartphone;
}[] = [
  {
    id: "cash",
    title: "Cash on Delivery",
    subtitle: "Pay the rider",
    icon: Banknote,
  },
  {
    id: "momo",
    title: "Mobile Money",
    subtitle: "MTN · Telecel · AT",
    icon: Smartphone,
  },
  {
    id: "card",
    title: "Card",
    subtitle: "Visa · Mastercard",
    icon: CreditCard,
  },
];

export function CheckoutView() {
  const router = useRouter();
  const { profile, user, usingFirebase } = useAuth();
  const { lines, subtotal, deliveryFee, total, clear, lineTotal } = useCart();
  const { payments, getProduct } = useCatalog();
  const [address, setAddress] = useState(restaurant.address);
  const [landmark, setLandmark] = useState("");
  const [phone, setPhone] = useState(
    normalizeGhanaPhone(profile?.phone ?? ""),
  );
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.phone) setPhone(normalizeGhanaPhone(profile.phone));
  }, [profile?.phone]);

  const enabledCount = useMemo(
    () => paymentMeta.filter((p) => payments[p.id]).length,
    [payments],
  );

  useEffect(() => {
    if (!payments[payment]) {
      const first = paymentMeta.find((p) => payments[p.id]);
      if (first) setPayment(first.id);
    }
  }, [payments, payment]);

  async function placeOrder() {
    if (!address.trim()) {
      setError("Please enter a delivery address.");
      return;
    }
    if (!isValidGhanaPhone(phone)) {
      setError("Enter a valid Ghana phone number (10 digits starting with 0).");
      return;
    }
    if (!payments[payment]) {
      setError("That payment method is unavailable. Choose an available option.");
      return;
    }
    if (lines.length === 0) {
      setError("Your cart is empty");
      return;
    }
    if (usingFirebase && !user) {
      router.push("/app/login");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const items: OrderItem[] = lines.map((line) => {
        const product = getProduct(line.productId);
        const extraNames = line.extras
          .map((id) => extras.find((e) => e.id === id)?.name ?? id)
          .filter(Boolean);
        return {
          productId: line.productId,
          name: product?.name ?? "Item",
          quantity: line.quantity,
          price: lineTotal(line),
          extras: extraNames,
        };
      });

      if (usingFirebase) {
        await createOrder({
          customerId: user?.uid,
          customerEmail: profile?.email ?? user?.email ?? undefined,
          customerName: profile?.name ?? "Guest",
          customerPhone: normalizeGhanaPhone(phone),
          address: address.trim(),
          landmark: landmark.trim(),
          items,
          subtotal,
          deliveryFee,
          total,
          paymentMethod: payment,
        });
      }

      clear();
      router.push("/app/order-placed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place order");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pb-28 animate-fade-up">
      <PageHeader title="Checkout" backHref="/app/cart" />

      <div className="space-y-5 px-4">
        {!user && usingFirebase && (
          <div className="rounded-2xl bg-primary-light px-4 py-3 text-sm text-secondary">
            Please{" "}
            <button
              type="button"
              className="font-semibold text-primary underline"
              onClick={() => router.push("/app/login")}
            >
              log in
            </button>{" "}
            to place your order.
          </div>
        )}

        <section className="rounded-[20px] bg-white p-4 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-secondary">Delivery Address</h2>
          </div>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Search your delivery location"
            className="bg-bg"
          />
          <button
            type="button"
            onClick={() => setAddress(restaurant.address)}
            className="mt-2.5 flex items-center gap-1.5 text-sm font-medium text-primary"
          >
            <Navigation className="h-3.5 w-3.5" />
            Use Current Location
          </button>
          <label className="mt-3 block">
            <span className="mb-1.5 block text-xs font-medium text-muted">
              Phone
            </span>
            <Input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(normalizeGhanaPhone(e.target.value))}
              placeholder={GHANA_PHONE_PLACEHOLDER}
              className="bg-bg"
              aria-invalid={phone.length > 0 && !isValidGhanaPhone(phone)}
            />
            <span className="mt-1 block text-[10px] text-muted">
              10 digits starting with 0
            </span>
          </label>
          <label className="mt-3 block">
            <span className="mb-1.5 block text-xs font-medium text-muted">
              Landmark / House Description
            </span>
            <Input
              value={landmark}
              maxLength={100}
              onChange={(e) => setLandmark(e.target.value.slice(0, 100))}
              placeholder="e.g. Blue gate near the pharmacy"
              className="bg-bg"
            />
            <span className="mt-1 block text-right text-[10px] text-muted">
              {landmark.length}/100
            </span>
          </label>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-bg px-3 py-2 text-sm text-secondary">
            <Clock className="h-4 w-4 text-accent" />
            Estimated delivery {restaurant.deliveryEta}
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-semibold text-secondary">Payment Method</h2>
          {enabledCount === 0 ? (
            <p className="rounded-2xl bg-danger-light px-4 py-3 text-sm text-danger">
              No payment methods available. Please contact the restaurant.
            </p>
          ) : (
            <div className="space-y-2.5">
              {paymentMeta.map(({ id, title, subtitle, icon: Icon }) => {
                const available = payments[id];
                const selected = payment === id;
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={!available}
                    onClick={() => {
                      if (!available) {
                        setError(
                          `${title} is unavailable right now. Please choose another method.`,
                        );
                        return;
                      }
                      setError(null);
                      setPayment(id);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-[20px] border-2 bg-white p-4 text-left transition",
                      !available && "cursor-not-allowed opacity-55",
                      selected && available
                        ? "border-primary shadow-soft"
                        : "border-transparent shadow-card",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-2xl",
                        available
                          ? "bg-primary-light text-primary"
                          : "bg-bg text-muted",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="flex-1">
                      <span className="block font-semibold text-secondary">
                        {title}
                      </span>
                      <span className="text-xs text-muted">
                        {available ? subtitle : "Unavailable for now"}
                      </span>
                    </span>
                    {available ? (
                      <span
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full border-2",
                          selected
                            ? "border-primary bg-primary text-white"
                            : "border-border",
                        )}
                      >
                        {selected && <Check className="h-3.5 w-3.5" />}
                      </span>
                    ) : (
                      <span className="rounded-full bg-bg px-2 py-1 text-[10px] font-bold uppercase text-muted">
                        Soon
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-2 px-1 pb-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted">Subtotal</span>
            <span className="font-semibold">{formatCedi(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Delivery</span>
            <span className="font-semibold">{formatCedi(deliveryFee)}</span>
          </div>
        </section>

        {error && (
          <p className="rounded-xl bg-danger-light px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
      </div>

      <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-border/60 bg-bg/95 px-4 py-4 backdrop-blur">
        <Button
          size="xl"
          className="w-full justify-between px-5"
          onClick={() => void placeOrder()}
          disabled={
            !address.trim() ||
            enabledCount === 0 ||
            !payments[payment] ||
            loading ||
            lines.length === 0
          }
        >
          <span>{loading ? "Placing..." : "Place Order"}</span>
          <span>{formatCedi(total)}</span>
        </Button>
      </div>
    </div>
  );
}
