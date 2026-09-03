import { ShieldCheck, Sparkles, Layers } from "lucide-react";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col justify-between p-6">
      <header className="pt-8 pb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          Looply Loyalty Engine • Phase 1 Foundation
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Looply
        </h1>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          Lightweight, mobile-first, multi-tenant loyalty platform for small businesses.
        </p>
      </header>

      <div className="my-auto space-y-4">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Core Architecture Ready
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            PostgreSQL schema, Prisma ORM, strict tenant isolation models, and deterministic development seeds are active.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm mb-1">
            <Layers className="w-4 h-4 text-indigo-600" />
            Multi-Tenant Isolation
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Customer memberships, independent business progress counters, verification requests, and atomic reward schemas verified.
          </p>
        </div>
      </div>

      <footer className="pt-6 pb-2 text-center text-xs text-slate-400">
        Looply &copy; {new Date().getFullYear()} — Built for Small Businesses
      </footer>
    </div>
  );
}
