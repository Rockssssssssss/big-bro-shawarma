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
    <nav className="shrink-0 border-t border-border/70 bg-white px-2 pb-[env(safe-area-inset-bottom)] pt-1.5">
      <div className="grid grid-cols-4">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition",
                active ? "text-primary" : "text-muted",
              )}
            >
              <Icon
                className={cn("h-5 w-5", active && "stroke-[2.4]")}
                strokeWidth={active ? 2.4 : 1.8}
              />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
