import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseAuth, getDb, isFirebaseConfigured } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firebase/schema";
import { nameFromEmail } from "@/lib/utils";

export type UserRole = "customer" | "admin" | "rider";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  points: number;
  orders: number;
  totalSpent: number;
  createdAt?: unknown;
}

/** Staff emails from .env — comma-separated on ONE line each. */
export function adminEmails(): string[] {
  return (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function riderEmails(): string[] {
  return (process.env.NEXT_PUBLIC_RIDER_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Role from env staff lists.
 * Priority: admin list → rider list → customer.
 * Put each email in only ONE list.
 */
export function resolveRole(email: string): UserRole {
  const e = email.toLowerCase().trim();
  if (adminEmails().includes(e)) return "admin";
  if (riderEmails().includes(e)) return "rider";
  return "customer";
}

/** Human-readable Firebase Auth errors for customers and staff. */
export function formatAuthError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  const codeMatch = raw.match(/\(auth\/([^)]+)\)/);
  const code = codeMatch?.[1];

  switch (code) {
    case "invalid-credential":
    case "wrong-password":
    case "user-not-found":
    case "invalid-email":
      return "Wrong email or password. Please try again.";
    case "email-already-in-use":
      return "An account with this email already exists. Please log in instead.";
    case "weak-password":
      return "Password is too weak. Use at least 6 characters.";
    case "too-many-requests":
      return "Too many failed attempts. Wait a minute and try again.";
    case "network-request-failed":
      return "Network error. Check your internet connection.";
    case "user-disabled":
      return "This account has been disabled. Contact support.";
    case "missing-password":
      return "Please enter your password.";
    default:
      if (raw.includes("reserved for staff")) return raw;
      return (
        raw
          .replace("Firebase: ", "")
          .replace(/\(auth\/[^)]+\)\.?/, "")
          .trim() || "Something went wrong. Please try again."
      );
  }
}

function requireAuth() {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase Auth is not configured");
  return auth;
}

function requireDb() {
  const db = getDb();
  if (!db) throw new Error("Firestore is not configured");
  return db;
}

export async function fetchUserProfile(
  uid: string,
): Promise<UserProfile | null> {
  const db = requireDb();
  const snap = await getDoc(doc(db, COLLECTIONS.users, uid));
  if (!snap.exists()) return null;
  return { uid, ...snap.data() } as UserProfile;
}

/**
 * Creates profile on first login.
 * If the email is listed in ADMIN_EMAILS / RIDER_EMAILS, keeps Firestore role
 * in sync with that list on every login (so stuck "customer" staff get fixed).
 * Emails NOT in those lists keep whatever role Staff & Roles set.
 */
export async function ensureUserProfile(
  user: User,
  extras?: Partial<Pick<UserProfile, "name" | "phone" | "role">>,
): Promise<UserProfile> {
  const db = requireDb();
  const ref = doc(db, COLLECTIONS.users, user.uid);
  const existing = await getDoc(ref);
  const email = (user.email ?? "").toLowerCase().trim();
  const envRole = resolveRole(email);

  if (existing.exists()) {
    const profile = { uid: user.uid, ...existing.data() } as UserProfile;
    const patch: Record<string, unknown> = {};
    let next = { ...profile };

    // Env staff lists win for listed emails — fixes wrong role from first login
    if (envRole !== "customer" && profile.role !== envRole) {
      patch.role = envRole;
      next.role = envRole;
    }

    // Replace placeholder guest names with a real-looking name from email
    if (
      (!profile.name ||
        profile.name === "Big Bro Guest" ||
        profile.name === "Guest") &&
      email
    ) {
      const better = extras?.name?.trim() || user.displayName?.trim() || nameFromEmail(email);
      if (better && better !== profile.name) {
        patch.name = better;
        next.name = better;
      }
    }

    if (email && !profile.email) {
      patch.email = email;
      next.email = email;
    }

    if (Object.keys(patch).length > 0) {
      patch.updatedAt = Date.now();
      await setDoc(ref, patch, { merge: true });
    }

    return next;
  }

  const role = extras?.role ?? envRole;
  const name =
    extras?.name?.trim() ||
    user.displayName?.trim() ||
    (email ? nameFromEmail(email) : "Guest");
  const profile: UserProfile = {
    uid: user.uid,
    name,
    email: email || user.email || "",
    phone: extras?.phone ?? "",
    role,
    points: 0,
    orders: 0,
    totalSpent: 0,
    createdAt: serverTimestamp(),
  };

  await setDoc(ref, {
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    role: profile.role,
    points: profile.points,
    orders: profile.orders,
    totalSpent: profile.totalSpent,
    createdAt: serverTimestamp(),
  });

  return profile;
}

export async function registerCustomer(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
}): Promise<UserProfile> {
  if (!isFirebaseConfigured()) throw new Error("Firebase is not configured");
  const auth = requireAuth();
  const email = input.email.trim().toLowerCase();

  if (resolveRole(email) !== "customer") {
    throw new Error(
      "This email is reserved for staff. Use the Admin or Rider login page instead.",
    );
  }

  const cred = await createUserWithEmailAndPassword(
    auth,
    email,
    input.password,
  );
  await updateProfile(cred.user, { displayName: input.name.trim() });
  return ensureUserProfile(cred.user, {
    name: input.name.trim(),
    phone: input.phone.trim(),
    role: "customer",
  });
}

export async function loginWithEmail(
  email: string,
  password: string,
): Promise<UserProfile> {
  if (!isFirebaseConfigured()) throw new Error("Firebase is not configured");
  const auth = requireAuth();
  const cred = await signInWithEmailAndPassword(
    auth,
    email.trim().toLowerCase(),
    password,
  );
  return ensureUserProfile(cred.user);
}

export async function logout(): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) return;
  await fbSignOut(auth);
}

export function subscribeAuth(
  onChange: (user: User | null, profile: UserProfile | null) => void,
): () => void {
  const auth = getFirebaseAuth();
  if (!auth) {
    onChange(null, null);
    return () => undefined;
  }

  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      onChange(null, null);
      return;
    }
    try {
      const profile = await ensureUserProfile(user);
      onChange(user, profile);
    } catch {
      onChange(user, null);
    }
  });
}

export function subscribeUsers(
  onData: (users: UserProfile[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const db = requireDb();
  return onSnapshot(
    collection(db, COLLECTIONS.users),
    (snap) => {
      const list = snap.docs.map(
        (d) => ({ uid: d.id, ...d.data() }) as UserProfile,
      );
      list.sort((a, b) => a.email.localeCompare(b.email));
      onData(list);
    },
    (err) => onError?.(err),
  );
}

/** Change someone's role (admin Staff page). Does NOT create Auth accounts. */
export async function setUserRole(
  uid: string,
  role: UserRole,
): Promise<void> {
  const db = requireDb();
  await setDoc(
    doc(db, COLLECTIONS.users, uid),
    { role, updatedAt: Date.now() },
    { merge: true },
  );
}
