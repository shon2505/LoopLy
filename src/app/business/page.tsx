import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import LogoutButton from "@/components/LogoutButton";
import {
  Store,
  ShieldCheck,
  Clock,
  Sparkles,
  Award,
  QrCode,
  ArrowRight,
  FileCheck,
  Receipt,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BusinessDashboardPage() {
  const user = await getCurrentUser();

  // Guard: Must be authenticated and have role BUSINESS_OWNER
  if (!user || user.role !== UserRole.BUSINESS_OWNER) {
    redirect("/login");
  }

  // Intelligently check if the owner has already configured a business
  const business = await prisma.business.findUnique({
    where: { ownerId: user.id },
    include: { loyaltyProgram: true },
  });

  return (
    <div className="flex-1 flex flex-col justify-between p-6">
      <div>
        <header className="pt-6 pb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Business Owner Hub
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome, {user.name}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Signed into your Looply Business Owner account.
          </p>
        </header>

        {/* STATE 1: Unconfigured Owner Onboarding */}
        {!business && (
          <div className="my-4 p-6 rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-slate-50 border border-indigo-100 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Store className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">
                Welcome to Looply!
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Let&apos;s set up your business. Create your business profile and loyalty program to generate your permanent counter QR code.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/business/setup"
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                Set Up My Business
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* STATE 2: Configured Business Dashboard */}
        {business && business.loyaltyProgram && (
          <div className="my-4 space-y-4">
            {/* Active Business & Loyalty Summary Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-slate-50 border border-indigo-100 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                    Your Business
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 leading-tight">
                    {business.name}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {business.loyaltyProgram.programName}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                  <Award className="w-4 h-4" />
                </div>
              </div>

              <div className="pt-2 border-t border-indigo-100/60 space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Loyalty Goal:</span>
                  <span className="font-bold text-slate-900">
                    {business.loyaltyProgram.requiredVisits} visits to earn {business.loyaltyProgram.rewardTitle}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Verification Method:</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    {business.loyaltyProgram.verificationMethod === "BILL" ? (
                      <>
                        <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                        Bill Upload
                      </>
                    ) : (
                      <>
                        <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
                        Visit Confirmation
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Direct QR Action */}
              <div className="pt-3">
                <Link
                  href="/business/qr"
                  className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  View Business QR
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Account Details Box */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-medium">Owner Email</span>
            <span className="text-slate-900 font-semibold">{user.email}</span>
          </div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-medium">Account Role</span>
            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px]">
              {user.role}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3 text-indigo-600" />
              Session Lifetime
            </span>
            <span className="text-slate-700 font-medium text-[11px]">
              7 Days Persistent
            </span>
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
