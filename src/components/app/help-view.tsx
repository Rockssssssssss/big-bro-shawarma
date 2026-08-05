"use client";

import { useState } from "react";
import { ChevronDown, Globe, Mail, MessageSquare, Phone } from "lucide-react";
import { PageHeader } from "./page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth-context";
import { isFirebaseConfigured } from "@/lib/firebase";
import { createSupportMessage } from "@/lib/firebase/support";
import { faqs, restaurant } from "@/lib/data";
import type { SupportCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

const categories: { label: string; value: SupportCategory }[] = [
  { label: "Food Quality", value: "food-quality" },
  { label: "Delivery Service", value: "delivery" },
  { label: "App Bug", value: "bug" },
  { label: "Suggestion", value: "suggestion" },
  { label: "Other", value: "other" },
];

const faqFilters = ["All", "Orders", "Delivery", "Payments", "Account"];

export function HelpView() {
  const { profile, user } = useAuth();
  const [filter, setFilter] = useState("All");
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [topic, setTopic] = useState<SupportCategory>("food-quality");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered =
    filter === "All" ? faqs : faqs.filter((f) => f.category === filter);

  async function submitMessage() {
    if (!message.trim()) return;
    setError(null);
    setLoading(true);
    try {
      if (!isFirebaseConfigured()) {
        throw new Error("Messaging is unavailable right now. Please call or email us.");
      }
      if (!user) {
        throw new Error("Please log in to send a message.");
      }
      await createSupportMessage({
        name: profile?.name || user.displayName || "Customer",
        email: profile?.email || user.email || "",
        category: topic,
        message: message.trim(),
      });
      setSent(true);
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send message");
      setSent(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="Help & Support" backHref="/app/profile" />
      <div className="space-y-5 px-4 pb-8">
        <div className="grid grid-cols-2 gap-2.5">
          {[
            {
              icon: Phone,
              label: "Call Us",
              href: `tel:${restaurant.phones[0]}`,
            },
            {
              icon: Mail,
              label: "Email",
              href: `mailto:${restaurant.email}`,
            },
            {
              icon: Globe,
              label: "Website",
              href: `https://${restaurant.website}`,
            },
            {
              icon: MessageSquare,
              label: "Send Message",
              href: "#message",
            },
          ].map(({ icon: Icon, label, href }) => (
            <a
              key={label}
              href={href}
              className="flex flex-col items-center gap-2 rounded-[20px] bg-white p-4 shadow-card transition hover:shadow-soft"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-light text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-secondary">
                {label}
              </span>
            </a>
          ))}
        </div>

        <section>
          <h3 className="mb-3 font-bold text-secondary">FAQ</h3>
          <div className="mb-3 flex gap-2 overflow-x-auto no-scrollbar">
            {faqFilters.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold",
                  filter === f
                    ? "bg-primary text-white"
                    : "bg-white text-secondary shadow-soft",
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {filtered.map((faq) => {
              const open = openFaq === faq.id;
              return (
                <div
                  key={faq.id}
                  className="overflow-hidden rounded-2xl bg-white shadow-card"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : faq.id)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
                  >
                    <span className="text-sm font-semibold text-secondary">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-muted transition",
                        open && "rotate-180",
                      )}
                    />
                  </button>
                  {open && (
                    <p className="border-t border-border px-4 py-3 text-sm text-muted">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section id="message" className="rounded-[20px] bg-white p-4 shadow-card">
          <h3 className="mb-3 font-bold text-secondary">Send a Message</h3>
          <Label htmlFor="topic">Topic</Label>
          <select
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value as SupportCategory)}
            className="mb-3 h-12 w-full rounded-2xl border border-border bg-bg px-4 text-sm outline-none focus:border-primary"
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <Label htmlFor="msg">Message</Label>
          <textarea
            id="msg"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setSent(false);
            }}
            rows={4}
            placeholder="Tell us how we can help..."
            className="mb-3 w-full resize-none rounded-2xl border border-border bg-bg px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {error && (
            <p className="mb-2 rounded-xl bg-danger-light px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
          <Button
            className="w-full"
            disabled={!message.trim() || loading}
            onClick={() => void submitMessage()}
          >
            {loading ? "Sending..." : "Submit"}
          </Button>
          {sent && (
            <p className="mt-2 text-center text-sm text-accent">
              Message sent — we&apos;ll get back to you soon.
            </p>
          )}
        </section>

        <p className="text-center text-xs text-muted">
          Or email {restaurant.email}
        </p>
      </div>
    </div>
  );
}
