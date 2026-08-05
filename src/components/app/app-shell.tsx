"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AppDrawer } from "./app-drawer";
import { AppTopBar } from "./app-top-bar";
import { BottomNav } from "./bottom-nav";
import { cn } from "@/lib/utils";

const hideChrome = [
  "/app/welcome",
  "/app/login",
  "/app/register",
  "/app/splash",
  "/app/checkout",
  "/app/order-placed",
];

const hideBottom = [
  "/app/cart",
  "/app/product",
  "/app/checkout",
  "/app/help",
  "/app/order-placed",
];

/** Pages that own their own sticky footer + internal scroll */
const selfScroll = ["/app/cart", "/app/checkout"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isAuth =
    hideChrome.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    pathname === "/app";
  const showBottom =
    !isAuth && !hideBottom.some((p) => pathname.startsWith(p));
  const ownsScroll = selfScroll.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );

  if (isAuth) {
    return (
      <div className="mx-auto flex h-dvh max-h-dvh w-full max-w-md flex-col overflow-hidden bg-bg">
        <div
          className={cn(
            "min-h-0 flex-1",
            ownsScroll
              ? "flex flex-col overflow-hidden"
              : "overflow-y-auto no-scrollbar",
          )}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-dvh max-h-dvh w-full max-w-md flex-col overflow-hidden bg-bg shadow-float">
      <AppTopBar
        menuOpen={drawerOpen}
        onMenu={() => setDrawerOpen((v) => !v)}
      />
      <AppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          className={cn(
            "min-h-0 flex-1",
            ownsScroll
              ? "flex flex-col overflow-hidden"
              : "overflow-y-auto no-scrollbar",
            showBottom && !ownsScroll && "pb-[5.75rem]",
          )}
        >
          {children}
        </div>

        {showBottom && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40">
            <div className="pointer-events-auto">
              <BottomNav />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
