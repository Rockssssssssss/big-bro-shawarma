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
import {
  GHANA_PHONE_PLACEHOLDER,
  isValidGhanaPhone,
  normalizeGhanaPhone,
} from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const { register, usingFirebase } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!isValidGhanaPhone(phone)) {
      setError("Phone must be 10 digits and start with 0 (e.g. 0241234567).");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (!usingFirebase) {
        setError("Service unavailable. Please try again later.");
        return;
      }
      await register({
        name: name.trim(),
        email,
        phone: normalizeGhanaPhone(phone),
        password,
      });
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
      <div className="mt-8 animate-fade-up">
        <h1 className="text-2xl font-bold text-secondary">Create account</h1>
        <p className="mt-1 text-sm text-muted">Join Big Bro in under a minute</p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Nana Adjei"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder={GHANA_PHONE_PLACEHOLDER}
              value={phone}
              onChange={(e) => setPhone(normalizeGhanaPhone(e.target.value))}
              autoComplete="tel"
              required
            />
            <p className="mt-1 text-[11px] text-muted">
              Ghana number · 10 digits starting with 0
            </p>
          </div>
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
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              autoComplete="new-password"
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
            {loading ? "Creating..." : "Create Account"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/app/login" className="font-semibold text-primary">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
