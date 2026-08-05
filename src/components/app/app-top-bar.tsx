"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, ShoppingBag, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { useCart } from "@/components/cart-context";
import { cn } from "@/lib/utils";

interface AppTopBarProps {
  onMenu?: () => void;
  menuOpen?: boolean;
}

export function AppTopBar({ onMenu, menuOpen }: AppTopBarProps) {
  const { itemCount, bumpVersion } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (bumpVersion === 0) return;
    setJustAdded(true);
    const t = window.setTimeout(() => setJustAdded(false), 520);
    return () => window.clearTimeout(t);
  }, [bumpVersion]);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between bg-bg/95 px-4 py-3 backdrop-blur-md">
      <button
        type="button"
        onClick={onMenu}
        className="flex h-10 w-10 items-center justify-center rounded-full text-secondary transition hover:bg-white"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
      >
        {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      <Logo size="sm" />
      <Link
        href="/app/cart"
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-full text-secondary transition hover:bg-white",
          justAdded && "animate-cart-bounce",
        )}
        aria-label={`Cart${itemCount > 0 ? `, ${itemCount} items` : ""}`}
      >
        <ShoppingBag
          className={cn(
            "h-5 w-5 transition-transform duration-300",
            justAdded && "text-primary",
          )}
        />
        {itemCount > 0 && (
          <span
            key={`badge-${bumpVersion}-${itemCount}`}
            className={cn(
              "absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white will-change-transform",
              justAdded ? "animate-badge-enter" : "animate-badge-nudge",
            )}
          >
            {itemCount}
          </span>
        )}
      </Link>
    </header>
  );
}
