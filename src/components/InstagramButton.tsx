"use client";

import { Instagram } from "lucide-react";

export default function InstagramButton({ handle }: { handle: string }) {
  if (!handle) return null;
  
  return (
    <a
      href={`https://instagram.com/${handle}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-50 text-pink-600 hover:bg-pink-100 transition-colors text-[11px] font-bold mt-2"
    >
      <Instagram className="w-3.5 h-3.5" />
      Follow @{handle}
    </a>
  );
}
