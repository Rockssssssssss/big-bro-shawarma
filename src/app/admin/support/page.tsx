"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-context";
import { isFirebaseConfigured } from "@/lib/firebase";
import {
  archiveSupportMessage,
  replyToSupportMessage,
  subscribeSupportMessages,
} from "@/lib/firebase/support";
import type { SupportCategory, SupportMessage } from "@/lib/types";
import { cn, maskEmail } from "@/lib/utils";

const filters: { id: SupportCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "food-quality", label: "Food Quality" },
  { id: "delivery", label: "Delivery" },
  { id: "bug", label: "Bug" },
  { id: "suggestion", label: "Suggestion" },
  { id: "other", label: "Other" },
];

export default function AdminSupportPage() {
  const { ready } = useAuth();
  const [list, setList] = useState<SupportMessage[]>([]);
  const [filter, setFilter] = useState<SupportCategory | "all">("all");
  const [active, setActive] = useState<string>("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !isFirebaseConfigured()) return;
    return subscribeSupportMessages(setList, (err) => setError(err.message));
  }, [ready]);

  useEffect(() => {
    if (!active && list[0]) setActive(list[0].id);
    if (active && list.length > 0 && !list.some((m) => m.id === active)) {
      setActive(list[0]?.id ?? "");
    }
  }, [list, active]);

  const filtered =
    filter === "all" ? list : list.filter((m) => m.category === filter);
  const current = list.find((m) => m.id === active) ?? filtered[0];

  async function sendReply() {
    if (!current || !reply.trim()) return;
    setBusy(true);
    try {
      await replyToSupportMessage(current.id, reply);
      setReply("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reply");
    } finally {
      setBusy(false);
    }
  }

  async function archive() {
    if (!current) return;
    setBusy(true);
    try {
      await archiveSupportMessage(current.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not archive");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Support Messages</h1>
        <p className="text-sm text-muted">
          Messages customers send from Help & Support
        </p>
      </div>

      {error && (
        <p className="rounded-2xl bg-danger-light px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold",
              filter === f.id
                ? "bg-primary text-white"
                : "bg-white text-secondary shadow-soft",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[20px] bg-white p-10 text-center shadow-card">
          <p className="font-semibold text-secondary">No messages yet</p>
          <p className="mt-1 text-sm text-muted">
            When customers submit a report from the app, it will show up here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="overflow-hidden rounded-[20px] bg-white shadow-card">
            {filtered.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setActive(m.id)}
                className={cn(
                  "w-full border-b border-border px-4 py-3 text-left transition",
                  current?.id === m.id ? "bg-primary-light/50" : "hover:bg-bg",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-secondary">{m.name}</p>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                      m.status === "open"
                        ? "bg-primary-light text-primary"
                        : m.status === "replied"
                          ? "bg-accent-light text-accent"
                          : "bg-border text-muted",
                    )}
                  >
                    {m.status}
                  </span>
                </div>
                <p className="mt-0.5 text-xs capitalize text-muted">
                  {m.category.replace("-", " ")} · {m.date}
                </p>
                <p className="mt-1 line-clamp-1 text-xs text-secondary">
                  {m.message}
                </p>
              </button>
            ))}
          </div>

          {current && (
            <div className="rounded-[20px] bg-white p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-secondary">
                    {current.name}
                  </h2>
                  <p className="text-sm text-muted">
                    {maskEmail(current.email)}
                  </p>
                  <p className="mt-1 text-xs capitalize text-muted">
                    {current.category.replace("-", " ")} · {current.date}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void archive()}
                >
                  Archive
                </Button>
              </div>
              <p className="mt-5 rounded-2xl bg-bg p-4 text-sm leading-relaxed text-secondary">
                {current.message}
              </p>
              {current.reply && (
                <div className="mt-3 rounded-2xl border border-accent/30 bg-accent-light/40 p-4 text-sm">
                  <p className="font-semibold text-accent">Your reply</p>
                  <p className="mt-1 text-secondary">{current.reply}</p>
                </div>
              )}
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={4}
                placeholder="Type your reply..."
                className="mt-4 w-full rounded-2xl border border-border bg-bg px-4 py-3 text-sm outline-none focus:border-primary"
              />
              <Button
                className="mt-3"
                disabled={busy || !reply.trim()}
                onClick={() => void sendReply()}
              >
                Send Reply
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
