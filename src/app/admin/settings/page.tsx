"use client";

import { useState } from "react";
import { Banknote, CreditCard, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCatalog,
  type PaymentSettings,
} from "@/components/catalog-context";
import { clearAllOrders } from "@/lib/firebase/orders";
import { clearSupportMessages } from "@/lib/firebase/support";
import { defaultPayments } from "@/lib/firebase/catalog";
import { restaurant } from "@/lib/data";
import type { PaymentMethod } from "@/lib/types";
import { cn } from "@/lib/utils";

function Toggle({
  on,
  onChange,
  disabled,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!on)}
      aria-pressed={on}
      className={cn(
        "relative h-7 w-12 rounded-full transition",
        on ? "bg-primary" : "bg-border",
        disabled && "opacity-50",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition",
          on ? "left-[22px]" : "left-0.5",
        )}
      />
    </button>
  );
}

const paymentMeta: {
  id: PaymentMethod;
  title: string;
  subtitle: string;
  icon: typeof Smartphone;
}[] = [
  {
    id: "cash",
    title: "Cash on Delivery",
    subtitle: "Pay the rider · available now",
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

export default function AdminSettingsPage() {
  const {
    payments,
    setPaymentEnabled,
    setPayments,
    resetCatalog,
    seedDatabase,
    usingFirebase,
  } = useCatalog();
  const [open, setOpen] = useState(true);
  const [busy, setBusy] = useState(false);
  const [radius, setRadius] = useState(restaurant.deliveryRadiusKm);
  const [fee, setFee] = useState(restaurant.deliveryFee);
  const [hours, setHours] = useState(restaurant.hours);
  const [saved, setSaved] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [localPayments, setLocalPayments] =
    useState<PaymentSettings | null>(null);

  const paymentState = localPayments ?? payments;

  async function togglePayment(id: PaymentMethod) {
    const next = { ...paymentState, [id]: !paymentState[id] };
    if (!next.momo && !next.cash && !next.card) return;
    setLocalPayments(next);
    await setPaymentEnabled(id, next[id]);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Business Settings</h1>
        <p className="text-sm text-muted">Restaurant operations</p>
      </div>

      {msg && (
        <p className="rounded-2xl bg-primary-light px-4 py-3 text-sm font-medium text-secondary">
          {msg}
        </p>
      )}

      <section className="space-y-4 rounded-[20px] bg-white p-5 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-secondary">Open / Closed</p>
            <p className="text-xs text-muted">Accept new orders</p>
          </div>
          <Toggle on={open} onChange={setOpen} />
        </div>
        <div className="flex items-center justify-between border-t border-border pt-4">
          <div>
            <p className="font-semibold text-secondary">Busy Mode</p>
            <p className="text-xs text-muted">
              Pause new orders during peak rush
            </p>
          </div>
          <Toggle on={busy} onChange={setBusy} />
        </div>
      </section>

      <section className="space-y-3 rounded-[20px] bg-white p-5 shadow-card">
        <div>
          <h2 className="font-bold text-secondary">Payment Methods</h2>
          <p className="text-xs text-muted">
            Turn methods on or off for checkout. At least one must stay on.
          </p>
        </div>
        {paymentMeta.map(({ id, title, subtitle, icon: Icon }) => (
          <div
            key={id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 px-3 py-3"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-secondary">{title}</p>
                <p className="text-xs text-muted">{subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-[10px] font-bold uppercase",
                  paymentState[id] ? "text-accent" : "text-muted",
                )}
              >
                {paymentState[id] ? "Available" : "Unavailable"}
              </span>
              <Toggle
                on={paymentState[id]}
                onChange={() => void togglePayment(id)}
              />
            </div>
          </div>
        ))}
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            setLocalPayments(defaultPayments);
            await setPayments(defaultPayments);
            setMsg("Payments set to Cash on Delivery only.");
          }}
        >
          Use launch defaults (Cash only)
        </Button>
      </section>

      <section className="space-y-4 rounded-[20px] bg-white p-5 shadow-card">
        <div>
          <Label>Delivery Radius (km)</Label>
          <Input
            type="number"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
          />
        </div>
        <div>
          <Label>Delivery Fee (GH₵)</Label>
          <Input
            type="number"
            value={fee}
            onChange={(e) => setFee(Number(e.target.value))}
          />
        </div>
        <div>
          <Label>Opening Hours</Label>
          <Input value={hours} onChange={(e) => setHours(e.target.value)} />
        </div>
      </section>

      <section className="space-y-3 rounded-[20px] bg-white p-5 shadow-card">
        <h2 className="font-bold text-secondary">Restaurant</h2>
        <p className="text-sm text-muted">{restaurant.name}</p>
        <p className="text-sm text-muted">{restaurant.address}</p>
        <p className="text-sm text-muted">{restaurant.phone}</p>
        <p className="text-sm text-muted">{restaurant.email}</p>
      </section>

      <Button
        size="lg"
        className="w-full"
        onClick={async () => {
          if (localPayments) await setPayments(localPayments);
          setSaved(true);
          setMsg("Settings saved.");
          setTimeout(() => setSaved(false), 2000);
        }}
      >
        {saved ? "Saved!" : "Save Settings"}
      </Button>

      {usingFirebase && (
        <section className="space-y-3 rounded-[20px] border border-dashed border-border bg-white/60 p-5">
          <h2 className="font-bold text-secondary">Maintenance</h2>
          <Button
            variant="outline"
            className="w-full"
            disabled={seeding}
            onClick={async () => {
              setSeeding(true);
              setMsg(null);
              try {
                await seedDatabase();
                setLocalPayments(null);
                setMsg("Menu catalog refreshed.");
              } catch (err) {
                setMsg(err instanceof Error ? err.message : "Failed");
              } finally {
                setSeeding(false);
              }
            }}
          >
            {seeding ? "Refreshing..." : "Refresh menu catalog"}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            disabled={clearing}
            onClick={async () => {
              if (
                !confirm(
                  "Clear all test orders and support messages? This cannot be undone.",
                )
              ) {
                return;
              }
              setClearing(true);
              setMsg(null);
              try {
                const o = await clearAllOrders();
                const s = await clearSupportMessages();
                setMsg(
                  `Cleared ${o} order${o === 1 ? "" : "s"} and ${s} support message${s === 1 ? "" : "s"}.`,
                );
              } catch (err) {
                setMsg(err instanceof Error ? err.message : "Clear failed");
              } finally {
                setClearing(false);
              }
            }}
          >
            {clearing ? "Clearing..." : "Clear test orders & messages"}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={async () => {
              if (!confirm("Reset local/catalog defaults?")) return;
              await resetCatalog();
              setLocalPayments(null);
              setMsg("Catalog reset.");
            }}
          >
            Reset catalog defaults
          </Button>
        </section>
      )}
    </div>
  );
}
