"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bike, Clock, Home, User } from "lucide-react";
import { useAuth } from "@/components/auth-context";
import {
  isPendingOfferForRider,
  subscribeActiveDeliveries,
} from "@/lib/firebase/orders";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/rider", label: "Today", icon: Home, exact: true },
  { href: "/rider/history", label: "History", icon: Clock },
  { href: "/rider/profile", label: "Profile", icon: User },
];

export default function RiderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, user, isRider, usingFirebase, profile } = useAuth();
  const [pendingOffers, setPendingOffers] = useState(0);
  const [badgePulse, setBadgePulse] = useState(0);
  const prevCount = useRef(0);

  const isLoginPage = pathname === "/rider/login";
  const riderId = profile?.uid ?? "";

  useEffect(() => {
    if (isLoginPage || !ready || !usingFirebase) return;
    if (!user || !isRider) {
      router.replace("/rider/login");
    }
  }, [isLoginPage, ready, user, isRider, usingFirebase, router]);

  useEffect(() => {
    if (isLoginPage || !ready || !usingFirebase || !riderId || !isRider) {
      setPendingOffers(0);
      return;
    }
    const unsub = subscribeActiveDeliveries(riderId, (orders) => {
      const count = orders.filter((o) =>
        isPendingOfferForRider(o, riderId),
      ).length;
      setPendingOffers(count);
      if (count !== prevCount.current) {
        if (count > 0) setBadgePulse((n) => n + 1);
        prevCount.current = count;
      }
    });
    return unsub;
  }, [isLoginPage, ready, usingFirebase, riderId, isRider]);

  if (isLoginPage) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-bg">
        {children}
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg">
        <p className="text-sm text-muted">Loading...</p>
      </div>
    );
  }

  if (usingFirebase && (!user || !isRider)) {
    return null;
  }

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col bg-bg shadow-float">
      <header className="flex items-center gap-3 border-b border-border/60 bg-white px-4 py-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
          <Bike className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Rider
          </p>
          <p className="font-bold text-secondary">Big Bro Deliveries</p>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto no-scrollbar pb-4">{children}</main>
      <nav className="shrink-0 border-t border-border/70 bg-white px-2 pb-[env(safe-area-inset-bottom)] pt-1.5">
        <div className="grid grid-cols-3">
          {tabs.map(({ href, label, icon: Icon, exact }) => {
            const active = exact
              ? pathname === href
              : pathname.startsWith(href);
            const showBadge = href === "/rider" && pendingOffers > 0;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
                  active ? "text-primary" : "text-muted",
                )}
                aria-label={
                  showBadge
                    ? `${label}, ${pendingOffers} pending offer${pendingOffers === 1 ? "" : "s"}`
                    : label
                }
              >
                <span className="relative">
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
                  {showBadge && (
                    <span
                      key={`offer-badge-${badgePulse}-${pendingOffers}`}
                      className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-white animate-badge-enter"
                    >
                      {pendingOffers > 99 ? "99+" : pendingOffers}
                    </span>
                  )}
                </span>
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
