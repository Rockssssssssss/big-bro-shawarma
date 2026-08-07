"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { Check } from "lucide-react";
import { pickCartToastMessage } from "@/lib/cart-toast-messages";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

type ToastEntry = {
  id: string;
  message: string;
  exiting: boolean;
};

interface CartToastContextValue {
  showCartToast: (category: Category) => void;
}

const CartToastContext = createContext<CartToastContextValue | null>(null);

const DISMISS_MS = 2800;
const EXIT_MS = 320;

function ToastBubble({ message, exiting }: { message: string; exiting: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex w-full max-w-sm items-center gap-3 rounded-[20px] px-4 py-3",
        "border border-accent/30 bg-accent-light/88 shadow-[0_8px_28px_rgba(34,197,94,0.16)]",
        "backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-accent-light/78",
        exiting ? "animate-toast-out" : "animate-toast-in",
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-white shadow-soft">
        <Check className="h-4 w-4" strokeWidth={2.5} />
      </span>
      <p className="font-body text-sm font-medium leading-snug text-accent">
        {message}
      </p>
    </div>
  );
}

export function CartToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const showCartToast = useCallback((category: Category) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const message = pickCartToastMessage(category);

    setToasts((prev) => [...prev, { id, message, exiting: false }]);

    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
      );
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, EXIT_MS);
    }, DISMISS_MS);
  }, []);

  return (
    <CartToastContext.Provider value={{ showCartToast }}>
      {children}
      <div
        aria-label="Cart notifications"
        className="pointer-events-none fixed inset-x-0 top-[calc(3.75rem+env(safe-area-inset-top))] z-50 mx-auto flex w-full max-w-md flex-col items-center gap-2 px-4"
      >
        {toasts.map((toast) => (
          <ToastBubble
            key={toast.id}
            message={toast.message}
            exiting={toast.exiting}
          />
        ))}
      </div>
    </CartToastContext.Provider>
  );
}

export function useCartToast() {
  const ctx = useContext(CartToastContext);
  if (!ctx) {
    throw new Error("useCartToast must be used within CartToastProvider");
  }
  return ctx;
}
