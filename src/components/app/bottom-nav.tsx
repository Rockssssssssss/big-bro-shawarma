"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gift, Home, Receipt, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/app/home", label: "Home", icon: Home },
  { href: "/app/orders", label: "Orders", icon: Receipt },
  { href: "/app/rewards", label: "Rewards", icon: Gift },
  { href: "/app/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "shrink-0 border-t border-white/50 px-2 pb-[env(safe-area-inset-bottom)] pt-1.5",
        "bg-white/55 shadow-[0_-10px_40px_rgba(75,46,43,0.08)]",
        "backdrop-blur-2xl backdrop-saturate-150",
        "supports-[backdrop-filter]:bg-white/45",
      )}
      aria-label="Primary"
    >
      <div className="grid grid-cols-4">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-all duration-300 ease-out",
                "active:scale-95",
                active ? "text-primary" : "text-muted hover:text-secondary",
              )}
            >
              <span
                className={cn(
                  "flex items-center justify-center rounded-2xl transition-all duration-300 ease-out",
                  active
                    ? "scale-110 bg-primary-light/80 px-3 py-1 shadow-soft"
                    : "scale-100 px-2 py-1",
                )}
              >
                <Icon
                  className={cn(
                    "transition-all duration-300 ease-out",
                    active ? "h-6 w-6" : "h-5 w-5",
                  )}
                  strokeWidth={active ? 2.45 : 1.8}
                />
              </span>
              <span
                className={cn(
                  "transition-all duration-300",
                  active ? "text-[12px] font-semibold" : "font-medium",
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
