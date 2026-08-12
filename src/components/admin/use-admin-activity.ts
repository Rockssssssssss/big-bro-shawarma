"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isFirebaseConfigured } from "@/lib/firebase";
import { subscribeUsers, type UserProfile } from "@/lib/firebase/auth";
import { subscribeAllOrders } from "@/lib/firebase/orders";
import { subscribeReviews } from "@/lib/firebase/reviews";
import { subscribeSupportMessages } from "@/lib/firebase/support";
import type { Order, Review, SupportMessage } from "@/lib/types";
import {
  dismissActivityKey,
  isActivityUnread,
  loadAdminActivityState,
  markSectionSeen,
  saveAdminActivityState,
  sectionFromPath,
  toMillis,
  type AdminActivitySection,
  type AdminActivityState,
} from "@/lib/admin-activity";
import { formatCedi } from "@/lib/utils";

export type AdminNotification = {
  key: string;
  section: AdminActivitySection;
  href: string;
  title: string;
  body: string;
  createdAt: number;
};

export function useAdminActivity(enabled: boolean) {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<AdminActivityState>(() =>
    typeof window === "undefined"
      ? {
          lastSeenAt: { orders: 0, reviews: 0, customers: 0, support: 0 },
          dismissed: [],
        }
      : loadAdminActivityState(),
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [support, setSupport] = useState<SupportMessage[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadAdminActivityState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveAdminActivityState(state);
  }, [state, hydrated]);

  useEffect(() => {
    if (!enabled || !isFirebaseConfigured()) return;
    const unsubs = [
      subscribeAllOrders(setOrders),
      subscribeReviews(setReviews),
      subscribeUsers((users) =>
        setCustomers(users.filter((u) => u.role === "customer")),
      ),
      subscribeSupportMessages(setSupport),
    ];
    return () => unsubs.forEach((u) => u());
  }, [enabled]);

  const activeSection = sectionFromPath(pathname);

  /** Visiting a section (or staying on it as new items arrive) clears unread. */
  useEffect(() => {
    if (!enabled || !hydrated || !activeSection) return;
    setState((prev) => markSectionSeen(prev, activeSection));
  }, [
    activeSection,
    enabled,
    hydrated,
    activeSection === "orders" ? orders : null,
    activeSection === "reviews" ? reviews : null,
    activeSection === "customers" ? customers : null,
    activeSection === "support" ? support : null,
  ]);

  const patchState = useCallback((updater: (prev: AdminActivityState) => AdminActivityState) => {
    setState((prev) => updater(prev));
  }, []);

  const notifications = useMemo(() => {
    if (!hydrated) return [] as AdminNotification[];
    const list: AdminNotification[] = [];

    for (const o of orders) {
      if (o.status === "cancelled") continue;
      const createdAt = o.createdAt ?? 0;
      if (!isActivityUnread(state, "orders", o.id, createdAt)) continue;
      list.push({
        key: `orders:${o.id}`,
        section: "orders",
        href: "/admin/orders",
        title: "New order",
        body: `${o.id} · ${o.customerName} · ${formatCedi(o.total)}`,
        createdAt,
      });
    }

    for (const r of reviews) {
      const createdAt = r.createdAt ?? 0;
      if (!isActivityUnread(state, "reviews", r.id, createdAt)) continue;
      list.push({
        key: `reviews:${r.id}`,
        section: "reviews",
        href: "/admin/reviews",
        title: "New review",
        body: `${r.name} · ${r.rating}★${r.comment ? ` · ${r.comment.slice(0, 60)}` : ""}`,
        createdAt,
      });
    }

    for (const c of customers) {
      const createdAt = toMillis(c.createdAt);
      if (!isActivityUnread(state, "customers", c.uid, createdAt)) continue;
      list.push({
        key: `customers:${c.uid}`,
        section: "customers",
        href: "/admin/customers",
        title: "New customer",
        body: c.name || c.email || "New signup",
        createdAt,
      });
    }

    for (const m of support) {
      if (m.status !== "open") continue;
      const createdAt = m.updatedAt ?? 0;
      if (!isActivityUnread(state, "support", m.id, createdAt)) continue;
      list.push({
        key: `support:${m.id}`,
        section: "support",
        href: "/admin/support",
        title: "Support message",
        body: `${m.name} · ${m.message.slice(0, 60)}`,
        createdAt,
      });
    }

    list.sort((a, b) => b.createdAt - a.createdAt);
    return list;
  }, [orders, reviews, customers, support, state, hydrated]);

  const badges = useMemo(() => {
    const counts: Record<AdminActivitySection, number> = {
      orders: 0,
      reviews: 0,
      customers: 0,
      support: 0,
    };
    for (const n of notifications) {
      counts[n.section] += 1;
    }
    return counts;
  }, [notifications]);

  const markRead = useCallback(
    (key: string) => {
      patchState((prev) => dismissActivityKey(prev, key));
    },
    [patchState],
  );

  const openNotification = useCallback(
    (n: AdminNotification) => {
      markRead(n.key);
      router.push(n.href);
    },
    [markRead, router],
  );

  const markAllRead = useCallback(() => {
    patchState((prev) => {
      let next = prev;
      (["orders", "reviews", "customers", "support"] as AdminActivitySection[]).forEach(
        (section) => {
          next = markSectionSeen(next, section);
        },
      );
      return next;
    });
  }, [patchState]);

  return {
    notifications,
    badges,
    unreadCount: notifications.length,
    markRead,
    openNotification,
    markAllRead,
  };
}
