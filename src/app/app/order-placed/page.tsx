"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

export default function OrderPlacedPage() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace("/app/orders"), 2400);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-8 text-center">
      <div className="relative flex h-28 w-28 items-center justify-center">
        <span className="absolute inset-0 rounded-full border-2 border-primary/20" />
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white shadow-float">
          <Check className="h-10 w-10" strokeWidth={3} />
        </span>
      </div>
      <h1 className="mt-8 text-2xl font-bold text-secondary">Order placed!</h1>
      <p className="mt-2 max-w-xs text-sm text-muted">
        Big Bro is firing up the grill. Taking you to live tracking...
      </p>
      <div className="mt-8 h-1.5 w-48 overflow-hidden rounded-full bg-border">
        <div className="h-full animate-progress rounded-full bg-primary" />
      </div>
    </div>
  );
}
