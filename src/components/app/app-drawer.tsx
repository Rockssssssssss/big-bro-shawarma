"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Gift,
  HelpCircle,
  LogOut,
  Receipt,
  Settings,
  User,
  X,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { useAuth } from "@/components/auth-context";
import { cn, maskEmail } from "@/lib/utils";

const links = [
  { href: "/app/profile", label: "Profile", icon: User },
  { href: "/app/orders", label: "Order History", icon: Receipt },
  { href: "/app/rewards", label: "Loyalty Rewards", icon: Gift },
  { href: "/app/profile", label: "Settings", icon: Settings },
  { href: "/app/help", label: "Help", icon: HelpCircle },
];

interface AppDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function AppDrawer({ open, onClose }: AppDrawerProps) {
  const { profile, logout } = useAuth();
  const router = useRouter();
  const name = profile?.name || "Guest";
  const email = profile?.email ? maskEmail(profile.email) : "";

  async function handleLogout() {
    onClose();
    await logout();
    router.push("/app/welcome");
  }

  return (
    <>
      <div
        className={cn(
          "absolute inset-0 z-40 bg-secondary/40 backdrop-blur-[2px] transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "absolute inset-y-0 left-0 z-50 flex w-[82%] max-w-[320px] flex-col bg-white shadow-float transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-5 pb-4 pt-5">
          <Logo showText size="sm" />
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-secondary hover:bg-bg"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mx-5 border-t border-border" />
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-lg font-bold text-primary">
            {name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-secondary">{name}</p>
            {email ? (
              <p className="truncate text-xs text-muted">{email}</p>
            ) : null}
          </div>
        </div>
        <div className="mx-5 border-t border-border" />
        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              onClick={onClose}
              className="flex items-center gap-3 rounded-2xl px-3 py-3 text-secondary transition hover:bg-bg"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light text-primary">
                <Icon className="h-4.5 w-4.5" strokeWidth={1.8} />
              </span>
              <span className="font-medium">{label}</span>
            </Link>
          ))}
        </nav>
        <div className="mx-5 border-t border-border" />
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="m-4 flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-danger transition hover:bg-danger-light"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-danger-light">
            <LogOut className="h-4.5 w-4.5" />
          </span>
          <span className="font-semibold">Logout</span>
        </button>
      </aside>
    </>
  );
}
