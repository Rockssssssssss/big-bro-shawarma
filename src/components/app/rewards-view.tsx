"use client";

import { useState } from "react";
import { Gift, Star, Zap } from "lucide-react";
import { PageHeader } from "./page-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-context";
import { rewards } from "@/lib/data";
import { cn, formatCedi } from "@/lib/utils";

export function RewardsView() {
  const { profile } = useAuth();
  const points = profile?.points ?? 0;
  const next = rewards.find((r) => r.points > points) ?? rewards[rewards.length - 1];
  const away = Math.max(0, next.points - points);
  const progress = Math.min(100, (points / next.points) * 100);
  const [selected, setSelected] = useState<string | null>(null);
  const [redeemed, setRedeemed] = useState<string | null>(null);

  return (
    <div className="animate-fade-up">
      <PageHeader title="Rewards & Loyalty" backHref="/app/home" />
      <div className="space-y-5 px-4 pb-6">
        <section className="rounded-[24px] border-2 border-primary bg-gradient-to-br from-primary-light/80 to-white p-5 shadow-soft">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted">Current Points</p>
              <p className="mt-1 text-4xl font-extrabold text-secondary">
                {points}
              </p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
              <Zap className="h-5 w-5" fill="currentColor" />
            </span>
          </div>
          <div className="mt-5 flex justify-between text-xs text-muted">
            <span>Points to next reward</span>
            <span>{away} away</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>

        <section>
          <h3 className="mb-3 font-bold text-secondary">How it works</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3 rounded-2xl bg-accent-light/60 px-4 py-3">
              <Star className="h-5 w-5 text-accent" />
              <div>
                <p className="font-semibold text-secondary">Earn Points</p>
                <p className="text-xs text-muted">
                  Get 1 point for every GH₵1 spent.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-accent-light/60 px-4 py-3">
              <Gift className="h-5 w-5 text-accent" />
              <div>
                <p className="font-semibold text-secondary">Redeem Rewards</p>
                <p className="text-xs text-muted">
                  Convert points to discount vouchers.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="mb-3 font-bold text-secondary">Available Rewards</h3>
          <div className="space-y-2.5">
            {rewards.map((reward) => {
              const canRedeem = points >= reward.points;
              const isSelected = selected === reward.id;
              return (
                <button
                  key={reward.id}
                  type="button"
                  disabled={!canRedeem}
                  onClick={() => setSelected(reward.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[20px] border-2 bg-white p-4 text-left transition",
                    isSelected
                      ? "border-primary"
                      : "border-transparent shadow-card",
                    !canRedeem && "opacity-50",
                  )}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">
                    <Gift className="h-5 w-5" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-bold text-secondary">
                      {formatCedi(reward.amount)} Voucher
                    </span>
                    <span className="text-xs text-muted">
                      {reward.points} points
                    </span>
                  </span>
                  <span
                    className={cn(
                      "h-5 w-5 rounded-full border-2",
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-border",
                    )}
                  />
                </button>
              );
            })}
          </div>
          {selected && (
            <Button
              className="mt-4 w-full"
              size="lg"
              onClick={() => {
                setRedeemed(selected);
                setSelected(null);
              }}
            >
              Redeem{" "}
              {rewards.find((r) => r.id === selected)?.label ?? "Reward"}
            </Button>
          )}
          {redeemed && (
            <p className="mt-3 text-center text-sm font-medium text-accent">
              Voucher redeemed! Apply it at checkout.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
