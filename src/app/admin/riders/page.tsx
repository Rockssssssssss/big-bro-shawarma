"use client";

import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { useAuth } from "@/components/auth-context";
import { isFirebaseConfigured } from "@/lib/firebase";
import { subscribeUsers, type UserProfile } from "@/lib/firebase/auth";
import { cn } from "@/lib/utils";

export default function AdminRidersPage() {
  const { ready } = useAuth();
  const [riders, setRiders] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (!ready || !isFirebaseConfigured()) return;
    return subscribeUsers((users) => {
      setRiders(users.filter((u) => u.role === "rider"));
    });
  }, [ready]);

  return (
    <div className="space-y-5 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Riders</h1>
        <p className="text-sm text-muted">
          Delivery partners with rider access
        </p>
      </div>

      {riders.length === 0 ? (
        <div className="rounded-[20px] bg-white p-10 text-center shadow-card">
          <p className="font-semibold text-secondary">No riders yet</p>
          <p className="mt-1 text-sm text-muted">
            Assign the Rider role under Staff & Roles after they sign in.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {riders.map((r) => (
            <article
              key={r.uid}
              className="rounded-[20px] bg-white p-5 shadow-card"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-lg font-bold text-primary">
                  {(r.name || "?").charAt(0).toUpperCase()}
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase",
                    "bg-accent-light text-accent",
                  )}
                >
                  Active
                </span>
              </div>
              <h3 className="mt-3 font-bold text-secondary">
                {r.name || "Rider"}
              </h3>
              {r.email ? (
                <p className="mt-1 break-all text-xs text-muted">{r.email}</p>
              ) : null}
              {r.phone ? (
                <a
                  href={`tel:${r.phone}`}
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {r.phone}
                </a>
              ) : (
                <p className="mt-2 text-xs text-muted">No phone on file</p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
