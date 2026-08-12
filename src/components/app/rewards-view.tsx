"use client";

import { useMemo, useState } from "react";
import { Gift, Star, Zap } from "lucide-react";
import { PageHeader } from "./page-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-context";
import { rewards } from "@/lib/data";
import {
  availableVouchers,
  nextRewardTier,
  pointsToNextReward,
} from "@/lib/loyalty";
import { redeemLoyaltyReward } from "@/lib/firebase/loyalty";
import { cn, formatCedi } from "@/lib/utils";

export function RewardsView() {
  const { profile, user } = useAuth();
  const points = profile?.points ?? 0;
  const next = nextRewardTier(points);
  const away = pointsToNextReward(points);
  const progress = Math.min(100, (points / Math.max(1, next.points)) * 100);
  const vouchers = useMemo(
    () => availableVouchers(profile?.vouchers ?? []),
    [profile?.vouchers],
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRedeem() {
    if (!selected || !user) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const voucher = await redeemLoyaltyReward(user.uid, selected);
      setMessage(
        `${voucher.label} redeemed! Apply it at checkout when you place an order.`,
      );
      setSelected(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not redeem reward.");
    } finally {
      setBusy(false);
    }
  }

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

        {vouchers.length > 0 && (
          <section>
            <h3 className="mb-3 font-bold text-secondary">Your Vouchers</h3>
            <div className="space-y-2.5">
              {vouchers.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center gap-3 rounded-[20px] border-2 border-accent/40 bg-white p-4 shadow-card"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white">
                    <Gift className="h-5 w-5" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-bold text-secondary">
                      {formatCedi(v.amount)} Voucher
                    </span>
                    <span className="text-xs text-muted">
                      Ready to apply at checkout
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

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
                  disabled={!canRedeem || busy || !user}
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
              disabled={busy || !user}
              onClick={() => void handleRedeem()}
            >
              {busy
                ? "Redeeming..."
                : `Redeem ${rewards.find((r) => r.id === selected)?.label ?? "Reward"}`}
            </Button>
          )}
          {message && (
            <p className="mt-3 text-center text-sm font-medium text-accent">
              {message}
            </p>
          )}
          {error && (
            <p className="mt-3 text-center text-sm font-medium text-danger">
              {error}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
