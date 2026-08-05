import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firebase/schema";
import type { SupportCategory, SupportMessage } from "@/lib/types";

function requireDb() {
  const db = getDb();
  if (!db) throw new Error("Firestore is not configured");
  return db;
}

type SupportRow = SupportMessage & { updatedAt: number };

function mapDoc(id: string, data: Record<string, unknown>): SupportRow {
  return {
    id,
    name: String(data.name ?? ""),
    email: String(data.email ?? ""),
    category: (data.category as SupportCategory) ?? "other",
    message: String(data.message ?? ""),
    date: String(data.date ?? ""),
    status: (data.status as SupportMessage["status"]) ?? "open",
    reply: data.reply ? String(data.reply) : undefined,
    updatedAt: Number(data.updatedAt ?? 0),
  };
}

export async function createSupportMessage(input: {
  name: string;
  email: string;
  category: SupportCategory;
  message: string;
}): Promise<string> {
  const db = requireDb();
  const now = new Date();
  const ref = await addDoc(collection(db, COLLECTIONS.support), {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    category: input.category,
    message: input.message.trim(),
    date: now.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    status: "open",
    createdAt: serverTimestamp(),
    updatedAt: Date.now(),
  });
  return ref.id;
}

export function subscribeSupportMessages(
  onData: (messages: SupportMessage[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const db = requireDb();
  return onSnapshot(
    collection(db, COLLECTIONS.support),
    (snap) => {
      const list = snap.docs
        .map((d) => mapDoc(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.updatedAt - a.updatedAt);
      onData(list);
    },
    (err) => onError?.(err),
  );
}

export async function replyToSupportMessage(
  id: string,
  reply: string,
): Promise<void> {
  const db = requireDb();
  await updateDoc(doc(db, COLLECTIONS.support, id), {
    reply: reply.trim(),
    status: "replied",
    updatedAt: Date.now(),
  });
}

export async function archiveSupportMessage(id: string): Promise<void> {
  const db = requireDb();
  await updateDoc(doc(db, COLLECTIONS.support, id), {
    status: "archived",
    updatedAt: Date.now(),
  });
}

/** Wipe all support messages (production reset). */
export async function clearSupportMessages(): Promise<number> {
  const db = requireDb();
  const snap = await getDocs(collection(db, COLLECTIONS.support));
  if (snap.empty) return 0;
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  return snap.size;
}
