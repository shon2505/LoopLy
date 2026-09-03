import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { getBusinessJoinUrl, generateQRCodeDataUrl } from "@/lib/qr";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import { ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BusinessQRPage() {
  const user = await getCurrentUser();

  // Guard: Must be authenticated and have role BUSINESS_OWNER
  if (!user || user.role !== UserRole.BUSINESS_OWNER) {
    redirect("/login");
  }

  // Resolve owned business server-side
  const business = await prisma.business.findUnique({
    where: { ownerId: user.id },
    include: { loyaltyProgram: true },
  });

  // If owner hasn't set up business yet, redirect to setup page
  if (!business) {
    redirect("/business");
  }

  const joinUrl = getBusinessJoinUrl(business.businessToken);
  const qrDataUrl = await generateQRCodeDataUrl(joinUrl);

  return (
    <div className="flex-1 flex flex-col justify-between p-6">
      <div>
        <header className="pt-4 pb-4">
          <Link
            href="/business"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Business QR Code
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                One permanent code for customer discovery and onboarding.
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
        </header>

        {/* QR Code Presentation */}
        <div className="my-4">
          <QRCodeDisplay
            businessName={business.name}
            joinUrl={joinUrl}
            qrDataUrl={qrDataUrl}
          />
        </div>

        {/* Permanence Assurance Box */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5 leading-relaxed">
          <span className="font-semibold text-slate-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Permanent & Immutable Identifier
          </span>
          <p>
            This QR code encodes your business join token. It will <strong>never expire</strong> or change, even if you update your business name or loyalty reward settings.
          </p>
        </div>
      </div>

      <footer className="pt-6 pb-2 text-center text-xs text-slate-400">
        Looply &copy; {new Date().getFullYear()} — Built for Small Businesses
      </footer>
    </div>
  );
}
