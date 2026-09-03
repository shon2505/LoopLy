"use client";

import { useState } from "react";
import { Check, Copy, Download, QrCode } from "lucide-react";

interface QRCodeDisplayProps {
  businessName: string;
  joinUrl: string;
  qrDataUrl: string;
}

export default function QRCodeDisplay({
  businessName,
  joinUrl,
  qrDataUrl,
}: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `${businessName.toLowerCase().replace(/\s+/g, "-")}-loyalty-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-4">
      {/* Printable QR Card Container */}
      <div className="p-6 bg-white rounded-2xl border-2 border-slate-900 shadow-sm flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-[11px] font-bold uppercase tracking-wider mb-3">
          <QrCode className="w-3.5 h-3.5 text-indigo-600" />
          Permanent Counter QR
        </div>
        <h3 className="text-xl font-bold text-slate-900">{businessName}</h3>
        <p className="text-xs text-slate-500 mt-0.5 mb-4">
          Scan with your phone camera to join our loyalty club
        </p>

        {/* QR Code */}
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDataUrl}
            alt={`${businessName} Permanent QR Code`}
            width={240}
            height={240}
            className="w-56 h-56 object-contain"
          />
        </div>

        <p className="text-[11px] font-mono text-slate-500 mt-3 break-all px-2 select-all">
          {joinUrl}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleCopy}
          className="w-full py-2.5 px-3 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              Copy Link
            </>
          )}
        </button>

        <button
          onClick={handleDownload}
          className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          <Download className="w-3.5 h-3.5" />
          Download QR
        </button>
      </div>
    </div>
  );
}
