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
  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => pathname.startsWith(tab.href)),
  );

  return (
    <nav
      className={cn(
        "w-full px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2",
        "border-t border-white/40",
        "bg-white/55 shadow-[0_-6px_24px_rgba(75,46,43,0.08)]",
        "backdrop-blur-xl backdrop-saturate-150",
        "supports-[backdrop-filter]:bg-white/40",
      )}
      aria-label="Primary"
    >
      <div className="relative grid grid-cols-4 gap-1">
        {/* Sliding active capsule */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-1 left-0 w-1/4 px-0.5 transition-transform duration-300 ease-[cubic-bezier(0.34,1.2,0.64,1)]"
          style={{ transform: `translateX(${activeIndex * 100}%)` }}
        >
          <div
            className="h-full w-full rounded-full shadow-[0_4px_14px_rgba(255,122,0,0.35)]"
            style={{ backgroundColor: "#FF7A00" }}
          />
        </div>

        {tabs.map(({ href, label, icon: Icon }, index) => {
          const active = index === activeIndex;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative z-10 flex flex-col items-center justify-center gap-0.5 rounded-full px-1 py-2.5",
                "transition-colors duration-300 ease-out active:scale-[0.97]",
                active ? "text-white" : "text-muted hover:text-secondary",
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-transform duration-300 ease-out",
                  active && "scale-110",
                )}
                strokeWidth={active ? 2.4 : 1.8}
              />
              <span
                className={cn(
                  "text-[11px] transition-all duration-300 ease-out",
                  active ? "font-semibold" : "font-medium",
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
