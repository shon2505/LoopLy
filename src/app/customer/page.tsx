import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import LogoutButton from "@/components/LogoutButton";
import {
  Sparkles,
  ShieldCheck,
  Users,
  Award,
  QrCode,
  ArrowRight,
  Store,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CustomerDashboardPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== UserRole.CUSTOMER) {
    redirect("/login");
  }

  // Fetch customer's joined businesses with loyalty progress
  const memberships = await prisma.membership.findMany({
    where: { customerId: user.id },
    include: {
      business: {
        include: { loyaltyProgram: true },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900">
                Looply
              </span>
            </Link>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
              My Rewards
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right text-xs">
              <span className="font-bold text-slate-900">{user.name}</span>
              <span className="text-[10px] text-slate-400">{user.email}</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Welcome, {user.name}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Track your loyalty progress across all your favourite local businesses.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 font-semibold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              {memberships.length} {memberships.length === 1 ? "Business" : "Businesses"} Joined
            </div>
          </div>
        </div>

        {/* STATE: No memberships yet */}
        {memberships.length === 0 && (
          <div className="max-w-md mx-auto my-12 p-8 rounded-3xl bg-white border border-slate-200 shadow-sm text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <QrCode className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">
                No Loyalty Programs Yet
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                Scan the QR code at any participating Looply business to instantly join their loyalty program and start earning rewards.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-2.5 text-xs text-slate-600">
              <p className="font-semibold text-slate-800">How to get started:</p>
              <ol className="space-y-1.5 list-decimal list-inside">
                <li>Visit any participating Looply business</li>
                <li>Scan the counter QR code with your phone camera</li>
                <li>You&apos;ll be automatically joined to their loyalty club</li>
                <li>Complete verified visits to earn your free reward</li>
              </ol>
            </div>
          </div>
        )}

        {/* STATE: Memberships grid */}
        {memberships.length > 0 && (
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {memberships.map((membership) => {
              const program = membership.business.loyaltyProgram;
              if (!program) return null;

              const progress = Math.min(membership.currentVisits, program.requiredVisits);
              const progressPercent = Math.round((progress / program.requiredVisits) * 100);
              const isComplete = membership.currentVisits >= program.requiredVisits;

              return (
                <div
                  key={membership.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col"
                >
                  {/* Card Header */}
                  <div className="p-5 pb-4 border-b border-slate-100">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                        <Store className="w-4.5 h-4.5" />
                      </div>
                      {isComplete && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold flex items-center gap-1">
                          <Award className="w-2.5 h-2.5" />
                          Reward Ready!
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2 text-sm font-bold text-slate-900 leading-tight">
                      {membership.business.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">{program.programName}</p>
                  </div>

                  {/* Progress Section */}
                  <div className="p-5 flex-1 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">Visit Progress</span>
                      <span className={`font-bold ${isComplete ? "text-emerald-600" : "text-indigo-700"}`}>
                        {progress} / {program.requiredVisits}
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isComplete ? "bg-emerald-500" : "bg-indigo-500"
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    <div className="pt-1 space-y-1 text-[11px] text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Reward</span>
                        <span className="font-semibold text-slate-800">{program.rewardTitle}</span>
                      </div>
                      {!isComplete && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Visits needed</span>
                          <span className="font-semibold text-slate-800">
                            {program.requiredVisits - progress} more
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  {isComplete && (
                    <div className="px-5 pb-4">
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 text-center font-semibold">
                        🎉 Show this to claim your reward!
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Looply &copy; {new Date().getFullYear()} — Simple Small Business Loyalty</span>
          <span className="flex items-center gap-1 text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Server-side 24-hour customer session
          </span>
        </div>
      </footer>
    </div>
  );
}
