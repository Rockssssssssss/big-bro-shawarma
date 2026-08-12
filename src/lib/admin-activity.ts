/** Admin unread activity — persisted locally, driven by live Firebase data. */

export type AdminActivitySection =
  | "orders"
  | "reviews"
  | "customers"
  | "support";

export type AdminActivityState = {
  /** Items created at or before this time are considered seen for the section. */
  lastSeenAt: Record<AdminActivitySection, number>;
  /** Individually dismissed notification keys (e.g. "order:BB-…"). */
  dismissed: string[];
};

const STORAGE_KEY = "bigbro.adminActivity.v1";

const SECTIONS: AdminActivitySection[] = [
  "orders",
  "reviews",
  "customers",
  "support",
];

function nowSeed(): AdminActivityState {
  const t = Date.now();
  return {
    lastSeenAt: {
      orders: t,
      reviews: t,
      customers: t,
      support: t,
    },
    dismissed: [],
  };
}

export function loadAdminActivityState(): AdminActivityState {
  if (typeof window === "undefined") return nowSeed();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = nowSeed();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw) as Partial<AdminActivityState>;
    const seed = nowSeed();
    return {
      lastSeenAt: {
        orders: Number(parsed.lastSeenAt?.orders ?? seed.lastSeenAt.orders),
        reviews: Number(parsed.lastSeenAt?.reviews ?? seed.lastSeenAt.reviews),
        customers: Number(
          parsed.lastSeenAt?.customers ?? seed.lastSeenAt.customers,
        ),
        support: Number(parsed.lastSeenAt?.support ?? seed.lastSeenAt.support),
      },
      dismissed: Array.isArray(parsed.dismissed)
        ? parsed.dismissed.map(String)
        : [],
    };
  } catch {
    return nowSeed();
  }
}

export function saveAdminActivityState(state: AdminActivityState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota */
  }
}

export function markSectionSeen(
  state: AdminActivityState,
  section: AdminActivitySection,
): AdminActivityState {
  const prefix = `${section}:`;
  return {
    lastSeenAt: { ...state.lastSeenAt, [section]: Date.now() },
    dismissed: state.dismissed.filter((k) => !k.startsWith(prefix)),
  };
}

export function dismissActivityKey(
  state: AdminActivityState,
  key: string,
): AdminActivityState {
  if (state.dismissed.includes(key)) return state;
  return { ...state, dismissed: [...state.dismissed, key] };
}

export function isActivityUnread(
  state: AdminActivityState,
  section: AdminActivitySection,
  id: string,
  createdAt: number,
): boolean {
  const key = `${section}:${id}`;
  if (state.dismissed.includes(key)) return false;
  return createdAt > (state.lastSeenAt[section] ?? 0);
}

export function sectionFromPath(pathname: string): AdminActivitySection | null {
  for (const section of SECTIONS) {
    if (pathname === `/admin/${section}` || pathname.startsWith(`/admin/${section}/`)) {
      return section;
    }
  }
  return null;
}

/** Normalize Firestore Timestamp | number | unknown → epoch ms */
export function toMillis(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (
    value &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof (value as { toMillis: () => number }).toMillis === "function"
  ) {
    try {
      return (value as { toMillis: () => number }).toMillis();
    } catch {
      return 0;
    }
  }
  if (
    value &&
    typeof value === "object" &&
    "seconds" in value &&
    typeof (value as { seconds: unknown }).seconds === "number"
  ) {
    return (value as { seconds: number }).seconds * 1000;
  }
  return 0;
}
