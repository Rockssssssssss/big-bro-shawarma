"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-context";
import { isFirebaseConfigured } from "@/lib/firebase";
import { subscribeUsers, type UserProfile } from "@/lib/firebase/auth";
import { formatCedi, maskEmail, maskPhone } from "@/lib/utils";

export default function AdminCustomersPage() {
  const { ready } = useAuth();
  const [customers, setCustomers] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (!ready || !isFirebaseConfigured()) return;
    return subscribeUsers((users) => {
      setCustomers(users.filter((u) => u.role === "customer"));
    });
  }, [ready]);

  return (
    <div className="space-y-5 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Customers</h1>
        <p className="text-sm text-muted">
          People who registered in the customer app
        </p>
      </div>

      {customers.length === 0 ? (
        <div className="rounded-[20px] bg-white p-10 text-center shadow-card">
          <p className="font-semibold text-secondary">No customers yet</p>
          <p className="mt-1 text-sm text-muted">
            New sign-ups will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[20px] bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-bg text-xs text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Orders</th>
                  <th className="px-4 py-3 font-medium">Spent</th>
                  <th className="px-4 py-3 font-medium">Points</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.uid} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
                          {(c.name || "?").charAt(0).toUpperCase()}
                        </span>
                        <p className="font-semibold">{c.name || "Guest"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {c.phone ? maskPhone(c.phone) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {c.email ? maskEmail(c.email) : "—"}
                    </td>
                    <td className="px-4 py-3">{c.orders}</td>
                    <td className="px-4 py-3 font-semibold">
                      {formatCedi(c.totalSpent)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-primary">
                      {c.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
