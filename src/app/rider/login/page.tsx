"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Bike } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useAuth } from "@/components/auth-context";
import { formatAuthError } from "@/lib/firebase/auth";

export default function RiderLoginPage() {
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
      if (profile.role !== "rider") {
        await logout();
        setError(
          profile.role === "admin"
            ? "This account is for admins. Use Admin Login instead."
            : "This account does not have rider access.",
        );
        return;
      }
      router.push("/rider");
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col justify-center px-6 py-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white shadow-float">
        <Bike className="h-7 w-7" />
      </div>
      <h1 className="mt-6 text-center text-2xl font-bold text-secondary">
        Rider Login
      </h1>
      <p className="mt-1 text-center text-sm text-muted">Riders only</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
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
          {loading ? "Signing in..." : "Login as Rider"}
        </Button>
      </form>
      <div className="mt-6 space-y-1 text-center text-sm text-muted">
        <Link href="/admin/login" className="block hover:text-primary">
          Admin Login
        </Link>
        <Link href="/" className="block hover:text-primary">
          Back to website
        </Link>
      </div>
    </div>
  );
}
