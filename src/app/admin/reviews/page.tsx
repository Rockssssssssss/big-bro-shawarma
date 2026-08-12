"use client";

import { useEffect, useState } from "react";
import { StarRating } from "@/components/star-rating";
import { Button } from "@/components/ui/button";
import { replyToReview, subscribeReviews } from "@/lib/firebase/reviews";
import { isFirebaseConfigured } from "@/lib/firebase";
import type { Review } from "@/lib/types";

export default function AdminReviewsPage() {
  const [list, setList] = useState<Review[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [replying, setReplying] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [savingReply, setSavingReply] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setList([]);
      setLoading(false);
      setError("Firebase is not configured.");
      return;
    }
    const unsub = subscribeReviews(
      (reviews) => {
        setList(reviews);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  async function saveReply(id: string) {
    if (!text.trim() || savingReply) return;
    setSavingReply(true);
    setError(null);
    try {
      await replyToReview(id, text);
      setReplying(null);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save reply");
    } finally {
      setSavingReply(false);
    }
  }

  return (
    <div className="space-y-5 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Reviews</h1>
        <p className="text-sm text-muted">Customer ratings & replies</p>
      </div>

      {error && (
        <p className="rounded-xl bg-danger-light px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted">Loading reviews…</p>
      ) : list.length === 0 ? (
        <div className="rounded-[20px] bg-white p-10 text-center shadow-card">
          <p className="font-semibold text-secondary">No reviews yet</p>
          <p className="mt-1 text-sm text-muted">
            Customer reviews will show here after delivered orders are rated.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((r) => (
            <article
              key={r.id}
              className="rounded-[20px] bg-white p-5 shadow-card"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-secondary">{r.name}</p>
                  <p className="text-xs text-muted">
                    {[r.orderId ? `Order ${r.orderId}` : null, r.product, r.date]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <StarRating value={r.rating} size="sm" />
              </div>
              {r.comment ? (
                <p className="mt-3 text-sm text-secondary">{r.comment}</p>
              ) : (
                <p className="mt-3 text-sm italic text-muted">No written comment</p>
              )}
              {r.reply && (
                <div className="mt-3 rounded-2xl bg-accent-light/40 p-3 text-sm">
                  <p className="font-semibold text-accent">Reply</p>
                  <p className="mt-1 text-secondary">{r.reply}</p>
                </div>
              )}
              {replying === r.id ? (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={3}
                    className="w-full rounded-2xl border border-border bg-bg px-4 py-3 text-sm outline-none focus:border-primary"
                    placeholder="Write a reply..."
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={!text.trim() || savingReply}
                      onClick={() => void saveReply(r.id)}
                    >
                      {savingReply ? "Saving…" : "Send reply"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={savingReply}
                      onClick={() => setReplying(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                !r.reply && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => {
                      setReplying(r.id);
                      setText("");
                    }}
                  >
                    Reply
                  </Button>
                )
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
