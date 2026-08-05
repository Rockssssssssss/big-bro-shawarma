"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Phone, Star } from "lucide-react";
import { useAuth } from "@/components/auth-context";
import { riders } from "@/lib/data";
import { formatCedi, maskEmail, maskPhone } from "@/lib/utils";

export default function RiderProfilePage() {
  const { profile, logout } = useAuth();
  const router = useRouter();
  const rider = riders[0];
  const name = profile?.name || "Rider";
  const phone = profile?.phone || "";
  const email = profile?.email ? maskEmail(profile.email) : "";

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
        ) : email ? (
          <p className="mt-1 text-sm text-muted">{email}</p>
        ) : null}
        <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-accent-light px-3 py-1 text-xs font-semibold text-accent">
          <Star className="h-3.5 w-3.5 fill-accent" />
          {rider.rating} rating
        </p>
      </section>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { label: "Deliveries", value: "120" },
          { label: "Today", value: String(rider.deliveriesToday) },
          { label: "Earned", value: formatCedi(2500).replace(".00", "") },
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
