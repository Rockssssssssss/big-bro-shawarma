import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCedi(amount: number): string {
  return `GH₵${amount.toFixed(2)}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return phone;
  const last4 = digits.slice(-4);
  return `•••• •••• ${last4}`;
}

/** Hide most of the local part: jo****@gmail.com */
export function maskEmail(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");
  if (at <= 0) return trimmed;
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  const keep = Math.min(2, local.length);
  const stars = Math.min(Math.max(local.length - keep, 3), 6);
  return `${local.slice(0, keep)}${"*".repeat(stars)}@${domain}`;
}

/** Ghana mobile: exactly 10 digits starting with 0 (e.g. 0241234567). */
export function normalizeGhanaPhone(input: string): string {
  return input.replace(/\D/g, "").slice(0, 10);
}

export function isValidGhanaPhone(phone: string): boolean {
  return /^0\d{9}$/.test(normalizeGhanaPhone(phone));
}

export const GHANA_PHONE_PLACEHOLDER = "0241234567";

/** Friendly name from an email local-part when Auth has no displayName. */
export function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  if (!local) return "Guest";
  const words = local
    .replace(/[._+\-]+/g, " ")
    .replace(/\d+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return local.charAt(0).toUpperCase() + local.slice(1);
  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function greetingForHour(hour = new Date().getHours()): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** First word of a display name; falls back to full name if needed. */
export function firstNameOf(fullName?: string | null, fallback = "there"): string {
  const trimmed = fullName?.trim();
  if (!trimmed) return fallback;
  const first = trimmed.split(/\s+/)[0];
  return first || trimmed;
}
