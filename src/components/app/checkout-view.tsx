"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  Check,
  Clock,
  CreditCard,
  MapPin,
  Smartphone,
} from "lucide-react";
import { PageHeader } from "./page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MtnMomoLogo,
  TelecelCashLogo,
} from "@/components/icons/momo-logos";
import { useAuth } from "@/components/auth-context";
import { useCart } from "@/components/cart-context";
import { useCatalog } from "@/components/catalog-context";
import { createOrder } from "@/lib/firebase/orders";
import {
  getCustomerAvailableVouchers,
  markVoucherUsed,
} from "@/lib/firebase/loyalty";
import { isMapboxConfigured } from "@/lib/mapbox";
import { extras, restaurant } from "@/lib/data";
import type { MapboxSelectedAddress } from "@/lib/mapbox";
import type { CustomerVoucher, OrderItem, PaymentMethod } from "@/lib/types";
import {
  cn,
  formatCedi,
  GHANA_PHONE_PLACEHOLDER,
  isValidGhanaPhone,
  normalizeGhanaPhone,
} from "@/lib/utils";

const AddressSearch = dynamic(
  () =>
    import("./address-search").then((m) => m.AddressSearch),
  {
    ssr: false,
    loading: () => (
      <Input
        disabled
        placeholder="Loading address search..."
        className="bg-bg"
      />
    ),
  },
);

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
    subtitle: "MTN MoMo · Telecel Cash",
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
  const { lines, subtotal, deliveryFee, clear, lineTotal } = useCart();
  const { payments, getProduct } = useCatalog();
  const [address, setAddress] = useState("");
  const [addressSelected, setAddressSelected] = useState(false);
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [landmark, setLandmark] = useState("");
  const [phone, setPhone] = useState(
    normalizeGhanaPhone(profile?.phone ?? ""),
  );
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vouchers, setVouchers] = useState<CustomerVoucher[]>([]);
  const [selectedVoucherId, setSelectedVoucherId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (profile?.phone) setPhone(normalizeGhanaPhone(profile.phone));
  }, [profile?.phone]);

  useEffect(() => {
    if (!usingFirebase || !user) {
      setVouchers([]);
      setSelectedVoucherId(null);
      return;
    }
    let cancelled = false;
    void getCustomerAvailableVouchers(user.uid)
      .then((list) => {
        if (cancelled) return;
        setVouchers(list);
        setSelectedVoucherId((prev) =>
          prev && list.some((v) => v.id === prev) ? prev : null,
        );
      })
      .catch(() => {
        if (!cancelled) setVouchers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [usingFirebase, user, profile?.vouchers]);

  const selectedVoucher = useMemo(
    () => vouchers.find((v) => v.id === selectedVoucherId) ?? null,
    [vouchers, selectedVoucherId],
  );

  const discount = selectedVoucher
    ? Math.min(selectedVoucher.amount, subtotal + deliveryFee)
    : 0;
  const payableTotal = Math.max(0, subtotal + deliveryFee - discount);

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

  const isGuest = usingFirebase && !user;

  const addressReady = isMapboxConfigured()
    ? addressSelected && address.trim().length > 0
    : address.trim().length >= 5;

  const canPlaceOrder =
    addressReady &&
    isValidGhanaPhone(phone) &&
    enabledCount > 0 &&
    !!payments[payment] &&
    lines.length > 0 &&
    !loading &&
    !isGuest;

  function handleAddressSelect(place: MapboxSelectedAddress) {
    setAddress(place.fullAddress);
    setCoords({ latitude: place.latitude, longitude: place.longitude });
    setAddressSelected(true);
    setError(null);
  }

  function handleAddressType(value: string) {
    setAddress(value);
    if (isMapboxConfigured()) {
      setAddressSelected(false);
      setCoords(null);
    } else {
      setAddressSelected(value.trim().length >= 5);
      setCoords(null);
    }
  }

  async function placeOrder() {
    if (isGuest) {
      setError("Please log in to place your order.");
      router.push("/app/login");
      return;
    }
    if (!addressReady) {
      setError(
        isMapboxConfigured()
          ? "Please select a delivery location from the suggestions."
          : "Please enter your delivery address (at least 5 characters).",
      );
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
        const order = await createOrder({
          customerId: user?.uid,
          customerEmail: profile?.email ?? user?.email ?? undefined,
          customerName: profile?.name ?? "Guest",
          customerPhone: normalizeGhanaPhone(phone),
          address: address.trim(),
          landmark: landmark.trim(),
          ...(coords
            ? { latitude: coords.latitude, longitude: coords.longitude }
            : {}),
          items,
          subtotal,
          deliveryFee,
          total: payableTotal,
          ...(discount > 0 && selectedVoucher
            ? { discount, voucherId: selectedVoucher.id }
            : {}),
          paymentMethod: payment,
        });

        if (user?.uid && selectedVoucher && discount > 0) {
          await markVoucherUsed(user.uid, selectedVoucher.id, order.id);
        }
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
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0">
        <PageHeader title="Checkout" backHref="/app/cart" />
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-4 no-scrollbar">
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

          <AddressSearch
            value={address}
            onChange={handleAddressType}
            onSelect={handleAddressSelect}
            selected={addressSelected}
          />

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
              maxLength={120}
              onChange={(e) => setLandmark(e.target.value.slice(0, 120))}
              placeholder="Apartment, Landmark, House Number, Floor, Behind..."
              className="bg-bg"
            />
            <span className="mt-1 block text-right text-[10px] text-muted">
              {landmark.length}/120
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
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-secondary">
                        {title}
                      </span>
                      {id === "momo" && available ? (
                        <span className="mt-1.5 flex items-center gap-2">
                          <MtnMomoLogo className="h-7 w-7 shrink-0 rounded-lg shadow-soft" />
                          <TelecelCashLogo className="h-7 w-7 shrink-0 rounded-lg shadow-soft" />
                        </span>
                      ) : (
                        <span className="text-xs text-muted">
                          {available ? subtitle : "Unavailable for now"}
                        </span>
                      )}
                    </span>
                    {available ? (
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
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

        {vouchers.length > 0 && (
          <section>
            <h2 className="mb-3 font-semibold text-secondary">
              Apply Voucher
            </h2>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setSelectedVoucherId(null)}
                className={cn(
                  "flex w-full items-center justify-between rounded-[20px] border-2 bg-white p-4 text-left transition",
                  !selectedVoucherId
                    ? "border-primary shadow-soft"
                    : "border-transparent shadow-card",
                )}
              >
                <span className="font-semibold text-secondary">No voucher</span>
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                    !selectedVoucherId
                      ? "border-primary bg-primary text-white"
                      : "border-border",
                  )}
                >
                  {!selectedVoucherId && <Check className="h-3.5 w-3.5" />}
                </span>
              </button>
              {vouchers.map((v) => {
                const selected = selectedVoucherId === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVoucherId(v.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-[20px] border-2 bg-white p-4 text-left transition",
                      selected
                        ? "border-primary shadow-soft"
                        : "border-transparent shadow-card",
                    )}
                  >
                    <span>
                      <span className="block font-semibold text-secondary">
                        {formatCedi(v.amount)} off
                      </span>
                      <span className="text-xs text-muted">{v.label}</span>
                    </span>
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                        selected
                          ? "border-primary bg-primary text-white"
                          : "border-border",
                      )}
                    >
                      {selected && <Check className="h-3.5 w-3.5" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {error && (
          <p className="rounded-xl bg-danger-light px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
      </div>

      {/* Pinned place-order summary — never scrolls */}
      <div className="relative z-20 shrink-0">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-gradient-to-b from-transparent to-white/60"
        />
        <div className="border-t border-white/45 bg-white/70 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-16px_48px_rgba(75,46,43,0.14)] backdrop-blur-2xl backdrop-saturate-150 supports-[backdrop-filter]:bg-white/55">
          <div className="mb-3 space-y-1.5 rounded-[18px] bg-white/90 px-3.5 py-3 shadow-soft">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span className="font-semibold text-secondary">
                {formatCedi(subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Delivery Fee</span>
              <span className="font-semibold text-secondary">
                {formatCedi(deliveryFee)}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">Voucher</span>
                <span className="font-semibold text-accent">
                  −{formatCedi(discount)}
                </span>
              </div>
            )}
            <div className="my-1.5 border-t border-border/80" />
            <div className="flex justify-between">
              <span className="font-bold text-secondary">Total</span>
              <span className="text-lg font-bold text-secondary">
                {formatCedi(payableTotal)}
              </span>
            </div>
          </div>
          <Button
            size="xl"
            className="w-full justify-between px-5"
            onClick={() => void placeOrder()}
            disabled={!canPlaceOrder}
          >
            <span>
              {loading
                ? "Placing..."
                : isGuest
                  ? "Log in to order"
                  : "Place Order"}
            </span>
            <span>{formatCedi(payableTotal)}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
