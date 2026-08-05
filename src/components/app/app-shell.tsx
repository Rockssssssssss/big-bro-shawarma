"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AppDrawer } from "./app-drawer";
import { AppTopBar } from "./app-top-bar";
import { BottomNav } from "./bottom-nav";

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

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isAuth =
    hideChrome.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    pathname === "/app";
  const showBottom =
    !isAuth && !hideBottom.some((p) => pathname.startsWith(p));

  if (isAuth) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-bg">
        {children}
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-hidden bg-bg shadow-float">
      <AppTopBar
        menuOpen={drawerOpen}
        onMenu={() => setDrawerOpen((v) => !v)}
      />
      <AppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <main className="flex-1 overflow-y-auto no-scrollbar pb-4">
        {children}
      </main>
      {showBottom && <BottomNav />}
    </div>
  );
}
