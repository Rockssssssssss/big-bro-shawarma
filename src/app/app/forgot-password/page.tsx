"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { Check, Loader2, Mail } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isFirebaseConfigured } from "@/lib/firebase";
import {
  formatPasswordResetError,
  sendPasswordReset,
} from "@/lib/firebase/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const usingFirebase = useMemo(() => isFirebaseConfigured(), []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;

    setError(null);
    const trimmed = email.trim();

    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!usingFirebase) {
      setError("Service unavailable. Please try again later.");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordReset(trimmed);
      setSent(true);
    } catch (err) {
      // Avoid revealing whether an account exists when Firebase reports not-found
      const code =
        err instanceof Error
          ? err.message.match(/\(auth\/([^)]+)\)/)?.[1]
          : undefined;
      if (code === "user-not-found") {
        setSent(true);
      } else {
        setError(formatPasswordResetError(err));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col px-6 py-10">
      <Logo showText />
      <div className="mt-10 animate-fade-up">
        {sent ? (
          <div className="text-center">
            <div
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent-light"
              aria-hidden
            >
              <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-white shadow-soft">
                <Mail className="h-6 w-6" strokeWidth={2} />
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-accent-light bg-white text-accent shadow-soft">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
              </span>
            </div>
            <h1 className="font-heading mt-6 text-2xl text-secondary">
              Reset Link Sent!
            </h1>
            <p className="font-body mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
              If an account exists for this email, we&apos;ve sent a password
              reset link. Please check your inbox (and spam folder if needed).
            </p>
            <Link href="/app/login" className="mt-8 block">
              <Button type="button" size="lg" className="w-full">
                Back to Login
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-heading text-2xl text-secondary">
              Forgot Your Password?
            </h1>
            <p className="font-body mt-1 text-sm text-muted">
              Enter the email linked to your account and we&apos;ll send you a
              password reset link.
            </p>
            <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
              <div>
                <Label htmlFor="reset-email">Email Address</Label>
                <Input
                  id="reset-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  required
                  disabled={loading}
                  aria-invalid={!!error}
                  aria-describedby={error ? "reset-error" : undefined}
                />
              </div>
              {error && (
                <p
                  id="reset-error"
                  role="alert"
                  className="rounded-xl bg-danger-light px-3 py-2 text-sm text-danger"
                >
                  {error}
                </p>
              )}
              <Button
                type="submit"
                size="lg"
                className="w-full gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
              <Link href="/app/login" className="block">
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="w-full"
                  disabled={loading}
                >
                  Back to Login
                </Button>
              </Link>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
