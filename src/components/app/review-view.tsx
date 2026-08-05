"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "./page-header";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";

const feedback: Record<number, string> = {
  1: "We're sorry — tell us what went wrong.",
  2: "Thanks for the honesty. We'll do better.",
  3: "Appreciate the feedback!",
  4: "Glad you enjoyed it!",
  5: "You're amazing — thank you!",
};

export function ReviewView({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!rating) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    router.push("/app/orders");
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="Rate Your Order" backHref="/app/orders" />
      <div className="px-4 pb-8">
        <div className="rounded-[24px] bg-white p-6 text-center shadow-card">
          <p className="text-sm text-muted">Order {orderId}</p>
          <h2 className="mt-2 text-xl font-bold text-secondary">
            How was your meal?
          </h2>
          <div className="mt-5 flex justify-center">
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>
          {rating > 0 && (
            <p className="mt-3 text-sm text-muted">{feedback[rating]}</p>
          )}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 500))}
            rows={4}
            placeholder="Share more details (optional)"
            className="mt-5 w-full resize-none rounded-2xl border border-border bg-bg px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-1 text-right text-[10px] text-muted">
            {comment.length}/500
          </p>
          <Button
            className="mt-4 w-full"
            size="lg"
            disabled={!rating || loading}
            onClick={submit}
          >
            {loading ? "Submitting..." : "Submit Review"}
          </Button>
        </div>
      </div>
    </div>
  );
}
