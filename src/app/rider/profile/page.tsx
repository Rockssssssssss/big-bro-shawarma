"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Pencil, Phone, Star } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth-context";
import { subscribeRiderHistory, updateRiderInfoOnOrders } from "@/lib/firebase/orders";
import { subscribeReviews } from "@/lib/firebase/reviews";
import type { Order, Review } from "@/lib/types";
import {
  formatCedi,
  GHANA_PHONE_PLACEHOLDER,
  isValidGhanaPhone,
  maskEmail,
  maskPhone,
  normalizeGhanaPhone,
} from "@/lib/utils";

function isSameLocalDay(ts?: number, dateStr?: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (typeof ts === "number" && Number.isFinite(ts)) {
    return new Date(ts).toISOString().slice(0, 10) === today;
  }
  return dateStr === today;
}

export default function RiderProfilePage() {
  const { profile, logout, updateContact, ready, usingFirebase, isRider } =
    useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [phoneDraft, setPhoneDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const riderId = profile?.uid ?? "";
  const name = profile?.name || "Rider";
  const phone = profile?.phone || "";
  const email = profile?.email ?? "";
  const emailDisplay = email ? maskEmail(email) : "";

  useEffect(() => {
    if (!ready || !usingFirebase || !riderId || !isRider) {
      setOrders([]);
      return;
    }
    return subscribeRiderHistory(riderId, setOrders);
  }, [ready, usingFirebase, riderId, isRider]);

  useEffect(() => {
    if (!ready || !usingFirebase || !isRider) {
      setReviews([]);
      return;
    }
    return subscribeReviews(setReviews);
  }, [ready, usingFirebase, isRider]);

  const totalDeliveries = orders.length;

  const todaysOrders = useMemo(
    () =>
      orders.filter((o) =>
        isSameLocalDay(o.updatedAt ?? o.createdAt, o.date),
      ),
    [orders],
  );

  const deliveriesToday = todaysOrders.length;
  const earningsToday = useMemo(
    () => todaysOrders.reduce((sum, o) => sum + (o.deliveryFee ?? 0), 0),
    [todaysOrders],
  );

  const rating = useMemo(() => {
    const orderIds = new Set(orders.map((o) => o.id));
    const mine = reviews.filter(
      (r) => r.orderId && orderIds.has(r.orderId) && r.rating > 0,
    );
    if (mine.length === 0) return 0;
    const avg =
      mine.reduce((sum, r) => sum + r.rating, 0) / mine.length;
    return Math.round(avg * 10) / 10;
  }, [orders, reviews]);

  function openEdit() {
    setNameDraft(profile?.name ?? "");
    setPhoneDraft(normalizeGhanaPhone(profile?.phone ?? ""));
    setFormError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setFormError(null);
  }

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;

    const nextName = nameDraft.trim();
    const nextPhone = normalizeGhanaPhone(phoneDraft);

    if (!nextName) {
      setFormError("Full name is required.");
      return;
    }
    if (nextPhone && !isValidGhanaPhone(nextPhone)) {
      setFormError("Enter a valid Ghana phone number (10 digits starting with 0).");
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      await updateContact({ name: nextName, phone: nextPhone });
      await updateRiderInfoOnOrders(profile.uid, {
        name: nextName,
        phone: nextPhone,
      });
      setEditing(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Could not update profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-fade-up px-4 py-4">
      <h1 className="text-xl font-bold text-secondary">Profile</h1>

      <section className="mt-4 rounded-[24px] bg-white p-6 text-center shadow-card">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-light text-2xl font-bold text-primary">
          {name.charAt(0).toUpperCase()}
        </div>
        <h2 className="mt-3 text-xl font-bold text-secondary">{name}</h2>
        {phone ? (
          <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted">
            <Phone className="h-3.5 w-3.5" />
            {maskPhone(phone)}
          </p>
        ) : null}
        {emailDisplay ? (
          <p className="mt-1 text-sm text-muted">{emailDisplay}</p>
        ) : null}
        <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-accent-light px-3 py-1 text-xs font-semibold text-accent">
          <Star className="h-3.5 w-3.5 fill-accent" />
          {rating} rating
        </p>

        {!editing ? (
          <button
            type="button"
            onClick={openEdit}
            className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-full bg-primary-light px-4 py-2 text-sm font-semibold text-primary"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit Profile
          </button>
        ) : null}
      </section>

      {editing ? (
        <form
          onSubmit={saveProfile}
          className="mt-4 space-y-3 rounded-[24px] bg-white p-5 shadow-card"
        >
          <h3 className="font-semibold text-secondary">Edit Profile</h3>

          <div>
            <Label htmlFor="rider-name">Full Name</Label>
            <input
              id="rider-name"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-border bg-bg px-4 py-3 text-sm text-secondary outline-none focus:border-primary"
              autoComplete="name"
              required
            />
          </div>

          <div>
            <Label htmlFor="rider-phone">Phone Number</Label>
            <input
              id="rider-phone"
              inputMode="numeric"
              value={phoneDraft}
              onChange={(e) => setPhoneDraft(normalizeGhanaPhone(e.target.value))}
              placeholder={GHANA_PHONE_PLACEHOLDER}
              className="mt-1.5 w-full rounded-2xl border border-border bg-bg px-4 py-3 text-sm text-secondary outline-none focus:border-primary"
              autoComplete="tel"
              aria-invalid={
                phoneDraft.length > 0 && !isValidGhanaPhone(phoneDraft)
              }
            />
          </div>

          <div>
            <Label htmlFor="rider-email">Email</Label>
            <input
              id="rider-email"
              value={email}
              readOnly
              disabled
              className="mt-1.5 w-full cursor-not-allowed rounded-2xl border border-border bg-bg/60 px-4 py-3 text-sm text-muted"
            />
            <p className="mt-1 text-[11px] text-muted">
              Email is your login and cannot be changed here.
            </p>
          </div>

          {formError ? (
            <p className="rounded-xl bg-danger-light px-3 py-2 text-xs text-danger">
              {formError}
            </p>
          ) : null}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={cancelEdit}
              disabled={saving}
              className="flex-1 rounded-[20px] border border-border py-3 text-sm font-semibold text-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-[20px] bg-primary py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      ) : null}

      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { label: "Deliveries", value: String(totalDeliveries) },
          { label: "Today", value: String(deliveriesToday) },
          { label: "Earned", value: formatCedi(earningsToday) },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl bg-white p-3 text-center shadow-card"
          >
            <p className="text-lg font-bold text-secondary">{s.value}</p>
            <p className="text-[11px] text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={async () => {
          await logout();
          router.push("/rider/login");
        }}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-[20px] bg-danger-light py-3.5 font-semibold text-danger"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>

      <Link href="/" className="mt-3 block text-center text-xs text-muted">
        Back to website
      </Link>
    </div>
  );
}
