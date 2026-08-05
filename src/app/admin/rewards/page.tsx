import { rewards } from "@/lib/data";
import { formatCedi } from "@/lib/utils";
import { Gift } from "lucide-react";

export default function AdminRewardsPage() {
  return (
    <div className="space-y-5 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Rewards</h1>
        <p className="text-sm text-muted">Loyalty voucher tiers</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {rewards.map((r) => (
          <div
            key={r.id}
            className="rounded-[20px] border-2 border-primary/30 bg-white p-5 shadow-card"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">
              <Gift className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-xl font-bold text-secondary">
              {formatCedi(r.amount)}
            </h3>
            <p className="text-sm text-muted">{r.points} points required</p>
          </div>
        ))}
      </div>
      <div className="rounded-[20px] bg-white p-5 shadow-card">
        <h2 className="font-bold text-secondary">Program rules</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li>· Earn 1 point for every GH₵1 spent</li>
          <li>· Points redeemable for discount vouchers at checkout</li>
          <li>· Vouchers expire 30 days after redemption</li>
        </ul>
      </div>
    </div>
  );
}
