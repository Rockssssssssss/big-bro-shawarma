import Link from "next/link";
import { SafeImage } from "@/components/safe-image";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function WelcomePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <div className="relative h-[48vh] min-h-[280px] overflow-hidden bg-border/40">
        <SafeImage
          src="/food/login.PNG"
          alt="Fresh shawarma"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg/20 to-bg" />
        <div className="absolute left-5 top-5">
          <Logo showText size="sm" />
        </div>
      </div>
      <div className="-mt-8 flex flex-1 flex-col px-6 pb-10 animate-fade-up">
        <h1 className="text-3xl font-extrabold leading-tight text-secondary">
          Fresh Shawarma
          <br />
          <span className="text-primary">Delivered Fast</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Order premium, flame-grilled shawarma and get it hot at your door in
          minutes.
        </p>
        <div className="mt-8 space-y-3">
          <Link href="/app/home" className="block">
            <Button size="xl" className="w-full">
              Order Now
            </Button>
          </Link>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/app/login">
              <Button variant="outline" size="lg" className="w-full">
                Login
              </Button>
            </Link>
            <Link href="/app/register">
              <Button variant="secondary" size="lg" className="w-full">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
