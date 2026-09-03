"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Clock, Upload } from "lucide-react";

interface VisitRequestButtonProps {
  membershipId: string;
  verificationMethod: "VISIT_CONFIRMATION" | "BILL";
  hasPending: boolean;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

export default function VisitRequestButton({
  membershipId,
  verificationMethod,
  hasPending,
}: VisitRequestButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billFile, setBillFile] = useState<File | null>(null);

  async function handleVisitConfirmation() {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/customer/verification-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit request.");
        setLoading(false);
        return;
      }
      setDone(true);
      setLoading(false);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  async function handleBillUpload() {
    if (!billFile) {
      setError("Please select a bill image first.");
      return;
    }

    if (!ALLOWED_TYPES.includes(billFile.type)) {
      setError("Only JPG, PNG, and WEBP images are accepted.");
      return;
    }

    if (billFile.size > MAX_BYTES) {
      setError("File must be under 5 MB.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("membershipId", membershipId);
      formData.append("file", billFile);

      const res = await fetch("/api/customer/bill-upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to upload bill.");
        setLoading(false);
        return;
      }

      setDone(true);
      setLoading(false);
      setBillFile(null);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  if (hasPending && !done) {
    return (
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
        <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <div>
          <p className="font-semibold">Pending verification</p>
          <p className="text-amber-700 mt-0.5">Your request is awaiting the business owner&apos;s approval.</p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <div>
          <p className="font-semibold">Request submitted!</p>
          <p className="text-emerald-700 mt-0.5">Awaiting owner approval.</p>
        </div>
      </div>
    );
  }

  if (verificationMethod === "VISIT_CONFIRMATION") {
    return (
      <div className="space-y-2">
        {error && (
          <p className="text-xs text-rose-600 font-medium">{error}</p>
        )}
        <button
          type="button"
          disabled={loading}
          onClick={handleVisitConfirmation}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
          ) : (
            <><CheckCircle2 className="w-4 h-4" /> I&apos;m Visiting Today</>
          )}
        </button>
      </div>
    );
  }

  // BILL upload flow
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-600 font-medium">Upload your bill to record this visit:</p>

      <label className="block">
        <span className="sr-only">Choose bill image</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="block w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
          onChange={(e) => {
            setBillFile(e.target.files?.[0] ?? null);
            setError(null);
          }}
        />
      </label>

      {billFile && (
        <p className="text-[11px] text-slate-500">
          Selected: {billFile.name} ({(billFile.size / 1024).toFixed(1)} KB)
        </p>
      )}

      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

      <button
        type="button"
        disabled={loading || !billFile}
        onClick={handleBillUpload}
        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
        ) : (
          <><Upload className="w-4 h-4" /> Submit Bill for Verification</>
        )}
      </button>

      <p className="text-[10px] text-slate-400 text-center">JPG, PNG or WEBP · Max 5 MB</p>
    </div>
  );
}
