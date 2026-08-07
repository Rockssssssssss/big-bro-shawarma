"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useAuth } from "@/components/auth-context";
import { formatAuthError } from "@/lib/firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const { login, usingFirebase } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!usingFirebase) {
        setError("Service unavailable. Please try again later.");
        return;
      }
      const profile = await login(email, password);
      if (profile.role === "admin") {
        router.push("/admin");
        return;
      }
      if (profile.role === "rider") {
        router.push("/rider");
        return;
      }
      router.push("/app/home");
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col px-6 py-10">
      <Logo showText />
      <div className="mt-10 animate-fade-up">
        <h1 className="text-2xl font-bold text-secondary">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">Sign in to continue ordering</p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="mt-2 text-right">
              <Link
                href="/app/forgot-password"
                className="text-xs font-medium text-muted transition hover:text-primary focus-visible:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded"
              >
                Forgot Password?
              </Link>
            </div>
          </div>
          {error && (
            <p
              role="alert"
              className="rounded-xl bg-danger-light px-3 py-2 text-sm text-danger"
            >
              {error}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/app/register" className="font-semibold text-primary">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
