"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronRight,
  HelpCircle,
  Lock,
  LogOut,
  MapPin,
  Phone,
  Shield,
} from "lucide-react";
import { PageHeader } from "./page-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-context";
import { useCatalog } from "@/components/catalog-context";
import { restaurant } from "@/lib/data";
import { formatCedi, maskEmail, maskPhone } from "@/lib/utils";

const settings = [
  { href: "/app/profile", label: "Notifications", icon: Bell },
  { href: "/app/profile", label: "Change Password", icon: Lock },
  { href: "/app/profile", label: "Privacy", icon: Shield },
  { href: "/app/help", label: "Help & Support", icon: HelpCircle },
];

export function ProfileView() {
  const { profile, user, logout, usingFirebase } = useAuth();
  const { businessSettings } = useCatalog();
  const router = useRouter();

  const name = profile?.name || (user ? "Guest" : "Welcome");
  const email = profile?.email ?? "";
  const phone = profile?.phone || "";
  const points = profile?.points ?? 0;
  const orders = profile?.orders ?? 0;
  const spent = profile?.totalSpent ?? 0;

  const initials = (name === "Welcome" || name === "Guest" ? "BB" : name)
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleLogout() {
    await logout();
    router.push("/app/welcome");
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="Profile" />
      <div className="space-y-4 px-4 pb-6">
        {!user && usingFirebase && (
          <div className="rounded-[20px] bg-white p-5 text-center shadow-card">
            <p className="font-semibold text-secondary">You&apos;re browsing as a guest</p>
            <Link href="/app/login" className="mt-3 inline-block">
              <Button size="sm">Login</Button>
            </Link>
          </div>
        )}

        <section className="rounded-[24px] bg-white p-5 text-center shadow-card">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-light text-2xl font-bold text-primary">
            {initials}
          </div>
          <h2 className="mt-3 text-xl font-bold text-secondary">{name}</h2>
          {email ? (
            <p className="text-sm text-muted">{maskEmail(email)}</p>
          ) : null}
          {phone ? (
            <p className="mt-1 text-sm text-muted">{maskPhone(phone)}</p>
          ) : null}
          <span className="mt-3 inline-block rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
            Big Bro Member
          </span>
        </section>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Orders", value: String(orders) },
            {
              label: "Spent",
              value: formatCedi(spent).replace(".00", ""),
            },
            { label: "Points", value: String(points) },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl bg-white p-3 text-center shadow-card"
            >
              <p className="text-lg font-bold text-secondary">{stat.value}</p>
              <p className="text-[11px] text-muted">{stat.label}</p>
            </div>
          ))}
        </div>

        <section className="rounded-[20px] bg-white p-4 shadow-card">
          <h3 className="mb-3 font-semibold text-secondary">Restaurant</h3>
          <div className="space-y-2.5 text-sm">
            <p className="flex items-start gap-2 text-muted">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {restaurant.address}
            </p>
            <p className="flex items-center gap-2 text-muted">
              <Phone className="h-4 w-4 text-primary" />
              {restaurant.phone}
            </p>
            <p className="text-xs text-muted">{businessSettings.hours}</p>
          </div>
        </section>

        <section className="overflow-hidden rounded-[20px] bg-white shadow-card">
          {settings.map(({ href, label, icon: Icon }, i) => (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-3 px-4 py-3.5 transition hover:bg-bg ${
                i > 0 ? "border-t border-border" : ""
              }`}
            >
              <Icon className="h-4.5 w-4.5 text-primary" />
              <span className="flex-1 font-medium text-secondary">{label}</span>
              <ChevronRight className="h-4 w-4 text-muted" />
            </Link>
          ))}
        </section>

        <button
          type="button"
          onClick={() => void handleLogout()}
          className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-danger-light py-3.5 font-semibold text-danger"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
