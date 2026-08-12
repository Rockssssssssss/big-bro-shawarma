"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SafeImage } from "@/components/safe-image";
import { Logo } from "@/components/logo";

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace("/app/welcome"), 2200);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-secondary">
      <SafeImage
        src="/food/SSH.PNG"
        alt=""
        fill
        className="object-cover opacity-40"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/70 via-secondary/50 to-secondary" />
      <div className="relative z-10 flex flex-col items-center px-6 text-center animate-fade-up">
        <Logo size="lg" />
        <h1 className="mt-5 text-3xl font-extrabold text-white">Big Bro</h1>
        <p className="mt-1 text-sm font-semibold tracking-[0.22em] text-primary">
          SHAWARMA
        </p>
        <div className="mt-10 h-1.5 w-36 overflow-hidden rounded-full bg-white/20">
          <div className="h-full w-1/2 animate-pulse-soft rounded-full bg-primary" />
        </div>
      </div>
    </div>
  );
}
