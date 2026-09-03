import { redirect } from "next/navigation";
import Link from "next/link";
import { Store, ShieldCheck, Clock, CheckCircle2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function BusinessDashboardPage() {
  const user = await getCurrentUser();

  // Guard: Must be authenticated and have role BUSINESS_OWNER
  if (!user || user.role !== UserRole.BUSINESS_OWNER) {
    redirect("/login");
  }

  return (
    <div className="flex-1 flex flex-col justify-between p-6">
      <div>
        <header className="pt-6 pb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-3">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Authenticated Business Owner
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome, {user.name}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            You are signed into your Looply Business Owner account.
          </p>
        </header>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Owner Email</span>
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
                <Clock className="w-3 h-3 text-indigo-600" />
                Session Policy
              </span>
              <span className="text-slate-700 font-medium text-[11px]">
                7-Day Persistent Lifetime
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs leading-relaxed space-y-3">
            <span className="font-semibold block">Phase 3 Business Hub</span>
            <p className="text-slate-500">
              Manage your permanent QR code and loyalty configuration.
            </p>
            <Link
              href="/business/qr"
              className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              View Permanent Business QR
            </Link>
          </div>
        </div>
      </div>

      <div className="pt-6 space-y-3">
        <LogoutButton />
        <div className="text-center text-xs text-slate-400 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Protected by server-side owner guard
        </div>
      </div>
    </div>
  );
}
