"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VerificationMethod } from "@prisma/client";
import {
  Store,
  Sparkles,
  Award,
  Calendar,
  CheckCircle2,
  FileCheck,
  Receipt,
  ArrowRight,
  Loader2,
  AlertCircle,
  Gift,
  Link,
  Instagram,
  Star,
} from "lucide-react";

export default function BusinessSetupForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [programName, setProgramName] = useState("");
  const [requiredVisits, setRequiredVisits] = useState(5);
  const [rewardTitle, setRewardTitle] = useState("");
  const [rewardDescription, setRewardDescription] = useState("");
  const [rewardValidityDays, setRewardValidityDays] = useState(30);
  const [rewardType, setRewardType] = useState<"STANDARD" | "SCRATCH_CARD">("STANDARD");
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>(
    VerificationMethod.VISIT_CONFIRMATION
  );

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Client-side quick checks
    if (!name.trim() || name.trim().length < 2) {
      setError("Business name must be at least 2 characters.");
      return;
    }
    if (!programName.trim() || programName.trim().length < 2) {
      setError("Loyalty program name must be at least 2 characters.");
      return;
    }
    if (!rewardTitle.trim() || rewardTitle.trim().length < 2) {
      setError("Reward title must be at least 2 characters.");
      return;
    }
    if (requiredVisits < 1 || requiredVisits > 100) {
      setError("Required visits must be between 1 and 100.");
      return;
    }
    if (rewardValidityDays < 1 || rewardValidityDays > 365) {
      setError("Reward validity days must be between 1 and 365.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/business/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          programName: programName.trim(),
          requiredVisits: Number(requiredVisits),
          rewardTitle: rewardTitle.trim(),
          rewardDescription: rewardDescription.trim(),
          rewardValidityDays: Number(rewardValidityDays),
          rewardType,
          googleReviewUrl: googleReviewUrl.trim(),
          instagramHandle: instagramHandle.trim(),
          verificationMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to set up business. Please try again.");
        setLoading(false);
        return;
      }

      // Success: redirect to the owner dashboard where the QR is now available
      router.push("/business");
      router.refresh();
    } catch {
      setError("Unable to connect to server. Please check your network.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Section 1: Business Profile */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 pb-1 border-b border-slate-200">
          <Store className="w-3.5 h-3.5 text-indigo-600" />
          Business Details
        </div>

        <div>
          <label
            htmlFor="business-name"
            className="block text-xs font-semibold text-slate-800 mb-1"
          >
            Business Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="business-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Bella's Hair Studio, Sweet Crumbs Bakery"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Section 2: Loyalty Program Details */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 pb-1 border-b border-slate-200">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          Loyalty Program Setup
        </div>

        <div>
          <label
            htmlFor="program-name"
            className="block text-xs font-semibold text-slate-800 mb-1"
          >
            Program Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="program-name"
            type="text"
            required
            value={programName}
            onChange={(e) => setProgramName(e.target.value)}
            placeholder="e.g. Haircut Rewards, Bean Loyalty Club"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="required-visits"
              className="block text-xs font-semibold text-slate-800 mb-1"
            >
              Required Visits <span className="text-rose-500">*</span>
            </label>
            <input
              id="required-visits"
              type="number"
              min={1}
              max={100}
              required
              value={requiredVisits}
              onChange={(e) => setRequiredVisits(parseInt(e.target.value, 10) || 1)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">1 to 100 visits</span>
          </div>

          <div>
            <label
              htmlFor="validity-days"
              className="block text-xs font-semibold text-slate-800 mb-1"
            >
              Reward Validity <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="validity-days"
                type="number"
                min={1}
                max={365}
                required
                value={rewardValidityDays}
                onChange={(e) => setRewardValidityDays(parseInt(e.target.value, 10) || 30)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">
                days
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Valid after award</span>
          </div>
        </div>

        <div>
          <label
            htmlFor="reward-title"
            className="block text-xs font-semibold text-slate-800 mb-1"
          >
            Reward Title <span className="text-rose-500">*</span>
          </label>
          <input
            id="reward-title"
            type="text"
            required
            value={rewardTitle}
            onChange={(e) => setRewardTitle(e.target.value)}
            placeholder="e.g. Free Haircut, Free Pastry & Hot Coffee"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </div>

        <div>
          <label
            htmlFor="reward-description"
            className="block text-xs font-semibold text-slate-800 mb-1"
          >
            Reward Description <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <textarea
            id="reward-description"
            rows={2}
            value={rewardDescription}
            onChange={(e) => setRewardDescription(e.target.value)}
            placeholder="e.g. Get one complimentary haircut or blow-dry on your next visit."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-800">
            Reward Type <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRewardType("STANDARD")}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-colors ${
                rewardType === "STANDARD"
                  ? "bg-indigo-50 border-indigo-300 ring-1 ring-indigo-200 text-indigo-700"
                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
              }`}
            >
              <Gift className="w-5 h-5" />
              <span className="text-xs font-semibold">Standard Reward</span>
            </button>
            <button
              type="button"
              onClick={() => setRewardType("SCRATCH_CARD")}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-colors ${
                rewardType === "SCRATCH_CARD"
                  ? "bg-indigo-50 border-indigo-300 ring-1 ring-indigo-200 text-indigo-700"
                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
              }`}
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-xs font-semibold">Gamified Scratch Card</span>
            </button>
          </div>
          {rewardType === "SCRATCH_CARD" && (
            <p className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
              Customers will scratch to win! They get a 60% chance for a small bonus, 15% for a medium bonus, 5% for a grand bonus, and 20% to just get the standard reward.
            </p>
          )}
        </div>
      </div>

      {/* Section 3: Verification Method */}
      <div className="space-y-2.5">
        <label className="block text-xs font-semibold text-slate-800">
          How should customer visits be verified? <span className="text-rose-500">*</span>
        </label>

        <div className="space-y-2">
          <label
            className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
              verificationMethod === VerificationMethod.VISIT_CONFIRMATION
                ? "bg-indigo-50/50 border-indigo-300 ring-1 ring-indigo-200"
                : "bg-white border-slate-200 hover:bg-slate-50"
            }`}
          >
            <input
              type="radio"
              name="verificationMethod"
              checked={verificationMethod === VerificationMethod.VISIT_CONFIRMATION}
              onChange={() => setVerificationMethod(VerificationMethod.VISIT_CONFIRMATION)}
              className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
            />
            <div className="text-xs space-y-0.5">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
                Visit Confirmation
              </span>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                Customer says &quot;I&apos;m Visiting Today&quot;. You approve the visit.
              </p>
            </div>
          </label>

          <label
            className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
              verificationMethod === VerificationMethod.BILL
                ? "bg-indigo-50/50 border-indigo-300 ring-1 ring-indigo-200"
                : "bg-white border-slate-200 hover:bg-slate-50"
            }`}
          >
            <input
              type="radio"
              name="verificationMethod"
              checked={verificationMethod === VerificationMethod.BILL}
              onChange={() => setVerificationMethod(VerificationMethod.BILL)}
              className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
            />
            <div className="text-xs space-y-0.5">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                Bill Upload
              </span>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                Customer uploads their bill. You review and approve it.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Section 4: Social & Reviews */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 pb-1 border-b border-slate-200">
          <Link className="w-3.5 h-3.5 text-indigo-600" />
          Social & Reviews (Optional)
        </div>

        <div>
          <label
            htmlFor="instagram-handle"
            className="block text-xs font-semibold text-slate-800 mb-1 flex items-center gap-1"
          >
            <Instagram className="w-3 h-3 text-pink-600" /> Instagram Handle
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs text-slate-400">@</span>
            <input
              id="instagram-handle"
              type="text"
              value={instagramHandle}
              onChange={(e) => {
                const val = e.target.value.startsWith("@") ? e.target.value.substring(1) : e.target.value;
                setInstagramHandle(val);
              }}
              placeholder="looply_cafe"
              className="w-full pl-7 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="google-review"
            className="block text-xs font-semibold text-slate-800 mb-1 flex items-center gap-1"
          >
            <Star className="w-3 h-3 text-yellow-500" /> Google Review URL
          </label>
          <input
            id="google-review"
            type="url"
            value={googleReviewUrl}
            onChange={(e) => setGoogleReviewUrl(e.target.value)}
            placeholder="https://g.page/r/.../review"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
          <span className="text-[10px] text-slate-400 mt-1 block">We'll ask loyal customers to leave a review!</span>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating Business...
            </>
          ) : (
            <>
              Create My Business
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
        <p className="text-[11px] text-center text-slate-400 mt-2">
          Your permanent QR code will be generated immediately upon creation.
        </p>
      </div>
    </form>
  );
}
