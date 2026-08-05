"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bike, Clock, Home, User } from "lucide-react";
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

  if (pathname === "/rider/login") {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-bg">
        {children}
      </div>
    );
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
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
                  active ? "text-primary" : "text-muted",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
