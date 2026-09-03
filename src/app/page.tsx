import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, User, Store } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="flex-1 flex flex-col justify-between p-6">
      <header className="pt-8 pb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          Looply Loyalty Engine • Phase 2
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Looply
        </h1>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          Lightweight, mobile-first, multi-tenant loyalty platform for small businesses.
        </p>
      </header>

      <div className="my-auto space-y-4">
        {user ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="flex items-center gap-2 font-semibold text-emerald-900 text-sm mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Signed in as {user.name} ({user.role})
            </div>
            <p className="text-xs text-emerald-700 mb-3">
              Your server-side session is currently active.
            </p>
            <Link
              href={user.role === UserRole.BUSINESS_OWNER ? "/business" : "/customer"}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              Go to Dashboard
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <Link
              href="/login"
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              Sign In to Looply
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/register"
              className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm rounded-xl border border-slate-300 transition-colors flex items-center justify-center gap-2"
            >
              Create New Account
            </Link>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-xs mb-1">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              Customer
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              24-Hour session lifetime across multiple businesses.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-xs mb-1">
              <Store className="w-3.5 h-3.5 text-indigo-600" />
              Business Owner
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              7-Day persistent session across browser restarts.
            </p>
          </div>
        </div>
      </div>

      <footer className="pt-6 pb-2 text-center text-xs text-slate-400">
        Looply &copy; {new Date().getFullYear()} — Built for Small Businesses
      </footer>
    </div>
  );
}
