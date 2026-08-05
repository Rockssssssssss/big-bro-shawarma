"use client";

import { useState } from "react";
import { StarRating } from "@/components/star-rating";
import { Button } from "@/components/ui/button";
import type { Review } from "@/lib/types";

/** Reviews will load from Firebase when the review flow is fully wired. */
export default function AdminReviewsPage() {
  const [list] = useState<Review[]>([]);
  const [replying, setReplying] = useState<string | null>(null);
  const [text, setText] = useState("");

  return (
    <div className="space-y-5 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Reviews</h1>
        <p className="text-sm text-muted">Customer ratings & replies</p>
      </div>

      {list.length === 0 ? (
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
                    {r.product} · {r.date}
                  </p>
                </div>
                <StarRating value={r.rating} size="sm" />
              </div>
              <p className="mt-3 text-sm text-secondary">{r.comment}</p>
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
                    <Button size="sm" onClick={() => setReplying(null)}>
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
