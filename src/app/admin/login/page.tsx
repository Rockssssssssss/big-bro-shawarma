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

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, logout, usingFirebase } = useAuth();
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
      if (profile.role !== "admin") {
        await logout();
        setError(
          profile.role === "rider"
            ? "This account is for riders. Use Rider Login instead."
            : "This account does not have admin access.",
        );
        return;
      }
      router.push("/admin");
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md rounded-[24px] bg-white p-8 shadow-card animate-fade-up">
        <Logo showText />
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-muted">
          Admin Console
        </p>
        <h1 className="mt-6 text-2xl font-bold text-secondary">Admin Login</h1>
        <p className="mt-1 text-sm text-muted">Admins only</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
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
            {loading ? "Signing in..." : "Login as Admin"}
          </Button>
        </form>
        <div className="mt-4 space-y-1 text-center text-sm text-muted">
          <Link href="/rider/login" className="block hover:text-primary">
            Rider Login
          </Link>
          <Link href="/" className="block hover:text-primary">
            Back to website
          </Link>
        </div>
      </div>
    </div>
  );
}
