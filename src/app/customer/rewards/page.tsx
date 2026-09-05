import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import LogoutButton from "@/components/LogoutButton";
import RewardCard from "@/components/RewardCard";
import { ArrowLeft, Sparkles, Gift, Award, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CustomerRewardsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.CUSTOMER) redirect("/login");

  const rewards = await prisma.reward.findMany({
    where: { customerId: user.id },
    include: { business: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const available = rewards.filter((r) => r.status === "AVAILABLE" && r.expiresAt > now);
  const redeemed = rewards.filter((r) => r.status === "REDEEMED");
  const expired = rewards.filter((r) => r.status === "EXPIRED" || (r.status === "AVAILABLE" && r.expiresAt <= now));

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900">Looply</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/customer"
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> My Memberships
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <Gift className="w-6 h-6 text-indigo-600" /> My Reward Wallet
          </h1>
          <p className="text-xs text-slate-500 mt-1">All your earned loyalty rewards in one place.</p>
        </div>

        {/* Available */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Available ({available.length})
          </h2>
          {available.length === 0 ? (
            <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
              No available rewards yet. Keep visiting to earn your first reward!
            </div>
          ) : (
            available.map((r) => (
              <RewardCard key={r.id} reward={r} />
            ))
          )}
        </section>

        {/* Redeemed */}
        {redeemed.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Redeemed ({redeemed.length})</h2>
            {redeemed.map((r) => (
              <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-3">
                <div className="text-xs">
                  <p className="font-semibold text-slate-700">{r.title}</p>
                  <p className="text-slate-500">{r.business.name}</p>
                  <p className="text-slate-400 mt-0.5">
                    Redeemed: {r.redeemedAt ? new Date(r.redeemedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold whitespace-nowrap">Redeemed</span>
              </div>
            ))}
          </section>
        )}

        {/* Expired */}
        {expired.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Expired ({expired.length})</h2>
            {expired.map((r) => (
              <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-3 opacity-60">
                <div className="text-xs">
                  <p className="font-semibold text-slate-600">{r.title}</p>
                  <p className="text-slate-500">{r.business.name}</p>
                  <p className="text-slate-400 mt-0.5">Expired: {r.expiresAt.toLocaleDateString()}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-500 text-[10px] font-bold whitespace-nowrap">Expired</span>
              </div>
            ))}
          </section>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-5 text-center text-xs text-slate-400">
        <div className="max-w-3xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Looply &copy; {new Date().getFullYear()}</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Rewards are securely tied to your account
          </span>
        </div>
      </footer>
    </div>
  );
}
