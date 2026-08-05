"use client";

import { useEffect, useMemo, useState } from "react";
import { Bike, Shield, User as UserIcon } from "lucide-react";
import { useAuth } from "@/components/auth-context";
import {
  setUserRole,
  subscribeUsers,
  type UserProfile,
  type UserRole,
} from "@/lib/firebase/auth";
import { cn } from "@/lib/utils";
import Link from "next/link";

const roleMeta: Record<
  UserRole,
  { label: string; color: string; icon: typeof Shield }
> = {
  admin: {
    label: "Admin",
    color: "bg-primary-light text-primary",
    icon: Shield,
  },
  rider: {
    label: "Rider",
    color: "bg-accent-light text-accent",
    icon: Bike,
  },
  customer: {
    label: "Customer",
    color: "bg-bg text-muted",
    icon: UserIcon,
  },
};

export default function AdminStaffPage() {
  const { isAdmin, ready, usingFirebase, profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filter, setFilter] = useState<"all" | UserRole>("all");
  const [busyUid, setBusyUid] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !usingFirebase) return;
    return subscribeUsers(setUsers);
  }, [ready, usingFirebase]);

  const filtered = useMemo(() => {
    if (filter === "all") return users;
    return users.filter((u) => u.role === filter);
  }, [users, filter]);

  async function changeRole(uid: string, role: UserRole) {
    if (uid === profile?.uid && role !== "admin") {
      setMsg("You cannot remove your own admin access.");
      return;
    }
    setBusyUid(uid);
    setMsg(null);
    try {
      await setUserRole(uid, role);
      setMsg(`Updated to ${roleMeta[role].label}.`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setBusyUid(null);
    }
  }

  if (ready && usingFirebase && profile && !isAdmin) {
    return (
      <div className="rounded-[20px] bg-white p-8 text-center shadow-card">
        <p className="font-semibold">Admin access required</p>
        <Link href="/admin/login" className="mt-3 inline-block text-primary">
          Admin Login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Staff & Roles</h1>
        <p className="text-sm text-muted">
          Set who can access Admin, Rider, or stay as Customer.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Admins", value: users.filter((u) => u.role === "admin").length },
          { label: "Riders", value: users.filter((u) => u.role === "rider").length },
          { label: "Customers", value: users.filter((u) => u.role === "customer").length },
        ].map((s) => (
          <div key={s.label} className="rounded-[20px] bg-white p-4 text-center shadow-card">
            <p className="text-2xl font-bold text-secondary">{s.value}</p>
            <p className="text-xs text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {msg && (
        <p className="rounded-2xl bg-primary-light px-4 py-3 text-sm font-medium text-secondary">
          {msg}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {(["all", "admin", "rider", "customer"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize",
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
        {filtered.length === 0 && (
          <div className="rounded-[20px] bg-white p-8 text-center shadow-card">
            <p className="font-semibold text-secondary">No users yet</p>
            <p className="mt-1 text-sm text-muted">
              Users appear here after they create an account or sign in.
            </p>
          </div>
        )}

        {filtered.map((u) => {
          const meta = roleMeta[u.role];
          const Icon = meta.icon;
          return (
            <article
              key={u.uid}
              className="flex flex-col gap-3 rounded-[20px] bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-light font-bold text-primary">
                  {(u.name || u.email || "?").charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-secondary">
                    {u.name || "No name"}
                    {u.uid === profile?.uid && (
                      <span className="ml-2 text-xs font-medium text-primary">
                        (you)
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {u.email || "—"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase",
                    meta.color,
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {meta.label}
                </span>
                <select
                  disabled={busyUid === u.uid}
                  value={u.role}
                  onChange={(e) =>
                    void changeRole(u.uid, e.target.value as UserRole)
                  }
                  aria-label={`Role for ${u.name || u.email}`}
                  className="h-9 rounded-xl border border-border bg-bg px-2 text-xs font-semibold outline-none focus:border-primary"
                >
                  <option value="customer">Customer</option>
                  <option value="rider">Rider</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
