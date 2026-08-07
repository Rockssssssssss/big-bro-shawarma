"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
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
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/staff", label: "Staff & Roles", icon: Shield },
  { href: "/admin/riders", label: "Riders", icon: Bike },
  { href: "/admin/rewards", label: "Rewards", icon: Gift },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/support", label: "Support Messages", icon: MessageSquare },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

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

  useEffect(() => {
    if (isLoginPage || !ready || !usingFirebase) return;
    if (!user || !isAdmin) {
      router.replace("/admin/login");
    }
  }, [isLoginPage, ready, user, isAdmin, usingFirebase, router]);

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
          {nav.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(href);
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
                <Icon className="h-4.5 w-4.5" />
                {label}
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
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-bg text-secondary"
          >
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
          </button>
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
          {nav.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold",
                pathname === href || (href !== "/admin" && pathname.startsWith(href))
                  ? "bg-primary text-white"
                  : "bg-bg text-secondary",
              )}
            >
              {label}
            </Link>
          ))}
        </div>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}

