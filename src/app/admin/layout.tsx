"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  Bell,
  Bike,
  Gift,
  LayoutDashboard,
  MessageSquare,
  Package,
  Search,
  Settings,
  Shield,
  ShoppingBag,
  Star,
  Users,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { useAuth } from "@/components/auth-context";
import { useAdminActivity } from "@/components/admin/use-admin-activity";
import { cn } from "@/lib/utils";
import type { AdminActivitySection } from "@/lib/admin-activity";

const nav: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  badgeKey?: AdminActivitySection;
}[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag, badgeKey: "orders" },
  { href: "/admin/products", label: "Products", icon: Package },
  {
    href: "/admin/customers",
    label: "Customers",
    icon: Users,
    badgeKey: "customers",
  },
  { href: "/admin/staff", label: "Staff & Roles", icon: Shield },
  { href: "/admin/riders", label: "Riders", icon: Bike },
  { href: "/admin/rewards", label: "Rewards", icon: Gift },
  { href: "/admin/reviews", label: "Reviews", icon: Star, badgeKey: "reviews" },
  {
    href: "/admin/support",
    label: "Support Messages",
    icon: MessageSquare,
    badgeKey: "support",
  },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold leading-none text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, ready, user, isAdmin, usingFirebase } = useAuth();
  const displayName = profile?.name || "Admin";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isLoginPage = pathname === "/admin/login";
  const activityEnabled = !isLoginPage && ready && (!usingFirebase || isAdmin);
  const {
    notifications,
    badges,
    unreadCount,
    openNotification,
    markAllRead,
  } = useAdminActivity(activityEnabled);

  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoginPage || !ready || !usingFirebase) return;
    if (!user || !isAdmin) {
      router.replace("/admin/login");
    }
  }, [isLoginPage, ready, user, isAdmin, usingFirebase, router]);

  useEffect(() => {
    if (!panelOpen) return;
    function onDocClick(e: MouseEvent) {
      if (!panelRef.current?.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [panelOpen]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg">
        <p className="text-sm text-muted">Loading...</p>
      </div>
    );
  }

  if (usingFirebase && (!user || !isAdmin)) {
    return null;
  }

  return (
    <div className="flex min-h-dvh bg-bg">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-white lg:flex">
        <div className="border-b border-border px-5 py-5">
          <Logo showText size="sm" />
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-muted">
            Admin Console
          </p>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {nav.map(({ href, label, icon: Icon, badgeKey }) => {
            const active =
              href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(href);
            const count = badgeKey ? badges[badgeKey] : 0;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-primary-light text-primary"
                    : "text-secondary-muted hover:bg-bg hover:text-secondary",
                )}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                <span className="truncate">{label}</span>
                <NavBadge count={count} />
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-white/90 px-4 backdrop-blur sm:px-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              placeholder="Search orders, customers, products..."
              className="h-10 w-full max-w-md rounded-xl border border-border bg-bg pl-9 pr-4 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="relative" ref={panelRef}>
            <button
              type="button"
              aria-label="Notifications"
              aria-expanded={panelOpen}
              onClick={() => setPanelOpen((o) => !o)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-bg text-secondary"
            >
              <Bell className="h-4.5 w-4.5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
            {panelOpen && (
              <div className="absolute right-0 top-12 z-30 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border border-border bg-white shadow-card">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <p className="text-sm font-bold text-secondary">
                    Notifications
                  </p>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => markAllRead()}
                      className="text-xs font-semibold text-primary"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-muted">
                      No new notifications
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.key}
                        type="button"
                        onClick={() => {
                          openNotification(n);
                          setPanelOpen(false);
                        }}
                        className="w-full border-b border-border/70 px-4 py-3 text-left transition hover:bg-bg"
                      >
                        <p className="text-sm font-semibold text-secondary">
                          {n.title}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                          {n.body}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 rounded-full bg-bg py-1.5 pl-1.5 pr-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
              {initials}
            </span>
            <span className="hidden max-w-[120px] truncate text-sm font-semibold sm:inline">
              {displayName}
            </span>
          </div>
        </header>

        {/* Mobile nav */}
        <div className="flex gap-2 overflow-x-auto border-b border-border bg-white px-3 py-2 no-scrollbar lg:hidden">
          {nav.map(({ href, label, badgeKey }) => {
            const count = badgeKey ? badges[badgeKey] : 0;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold",
                  pathname === href ||
                    (href !== "/admin" && pathname.startsWith(href))
                    ? "bg-primary text-white"
                    : "bg-bg text-secondary",
                )}
              >
                {label}
                {count > 0 && (
                  <span
                    className={cn(
                      "ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold",
                      pathname === href ||
                        (href !== "/admin" && pathname.startsWith(href))
                        ? "bg-white text-primary"
                        : "bg-primary text-white",
                    )}
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
