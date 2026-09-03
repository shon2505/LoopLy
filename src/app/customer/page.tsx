import { redirect } from "next/navigation";
import { User, ShieldCheck, Clock, CheckCircle2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function CustomerDashboardPage() {
  const user = await getCurrentUser();

  // Guard: Must be authenticated and have role CUSTOMER
  if (!user || user.role !== UserRole.CUSTOMER) {
    redirect("/login");
  }

  return (
    <div className="flex-1 flex flex-col justify-between p-6">
      <div>
        <header className="pt-6 pb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold mb-3">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Authenticated Customer
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome, {user.name}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            You are signed into your global Looply Customer account.
          </p>
        </header>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Account Email</span>
              <span className="text-slate-900 font-semibold">{user.email}</span>
            </div>
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">User Role</span>
              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                {user.role}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-600" />
                Session Policy
              </span>
              <span className="text-slate-700 font-medium text-[11px]">
                24-Hour Active Lifetime
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 text-indigo-900 text-xs leading-relaxed">
            <span className="font-semibold block mb-1">Phase 2 Verification Destination</span>
            Customer authentication, role validation, and HTTP-only cookie session handling are verified.
          </div>
        </div>
      </div>

      <div className="pt-6 space-y-3">
        <LogoutButton />
        <div className="text-center text-xs text-slate-400 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Protected by server-side customer guard
        </div>
      </div>
    </div>
  );
}
