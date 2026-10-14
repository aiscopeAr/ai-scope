"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import AdBody from "./AdBody";

export interface OverlayAdData {
  id: string;
  name: string;
  type: string;
  code: string;
  format: string; // popup | interstitial | sticky-bottom | sidebar-sticky
  dismissible: boolean;
  network?: string;
}

/** How long an interstitial forces the viewer to wait before the X enables. */
const INTERSTITIAL_COUNTDOWN = 5;

/**
 * Renders one overlay ad. popup & interstitial always carry a close button
 * (interstitial after a short countdown) — the owner asked for ads that must be
 * closed. sticky-bottom & sidebar-sticky show an X only when `dismissible`.
 * `onClose` lets AdManager record the dismissal for frequency capping.
 */
export default function OverlayAd({ ad, onClose }: { ad: OverlayAdData; onClose: () => void }) {
  const [left, setLeft] = useState(ad.format === "interstitial" ? INTERSTITIAL_COUNTDOWN : 0);

  useEffect(() => {
    if (ad.format !== "interstitial") return;
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [ad.format, left]);

  const canClose = ad.format === "popup" || ad.format === "interstitial" ? left <= 0 : ad.dismissible;

  const CloseBtn = (
    <button
      onClick={onClose}
      disabled={!canClose}
      aria-label="إغلاق الإعلان"
      className="absolute -top-3 -left-3 z-10 flex size-9 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {left > 0 ? <span className="text-sm font-bold">{left}</span> : <X className="size-5" />}
    </button>
  );

  const label = (
    <span className="absolute -top-2 right-3 rounded-full bg-slate-900/70 px-2 py-0.5 text-[10px] font-medium text-white">
      إعلان
    </span>
  );

  // Blocking modal formats: popup (card) and interstitial (full screen).
  if (ad.format === "popup" || ad.format === "interstitial") {
    const full = ad.format === "interstitial";
    return (
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4"
        dir="rtl"
        role="dialog"
        aria-modal="true"
      >
        <div
          className={`relative rounded-2xl bg-white p-4 shadow-2xl ${full ? "h-full w-full max-w-3xl" : "w-full max-w-md"}`}
        >
          {label}
          {CloseBtn}
          <div className="flex h-full items-center justify-center overflow-auto">
            <AdBody type={ad.type} code={ad.code} name={ad.name} network={ad.network} />
          </div>
        </div>
      </div>
    );
  }

  // Anchored formats.
  if (ad.format === "sticky-bottom") {
    return (
      <div className="fixed inset-x-0 bottom-0 z-[150] border-t border-slate-200 bg-white/95 p-2 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur" dir="rtl">
        <div className="relative mx-auto flex max-w-5xl items-center justify-center">
          {ad.dismissible && CloseBtn}
          <AdBody type={ad.type} code={ad.code} name={ad.name} network={ad.network} />
        </div>
      </div>
    );
  }

  // sidebar-sticky → floating card anchored to the start corner (RTL: right).
  return (
    <div className="fixed bottom-4 right-4 z-[150] hidden w-[300px] rounded-2xl bg-white p-3 shadow-2xl ring-1 ring-slate-200 lg:block" dir="rtl">
      <div className="relative">
        {ad.dismissible && CloseBtn}
        <AdBody type={ad.type} code={ad.code} name={ad.name} network={ad.network} />
      </div>
    </div>
  );
}
