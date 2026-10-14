"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readConsent, writeConsent } from "@/lib/ads/consent";

/**
 * CMP-lite cookie-consent banner. Appears once until the visitor chooses; the
 * choice drives Google Consent Mode v2 and the ScriptAd gate (consent-gated
 * networks load only after "granted"). Essential site function is unaffected
 * either way — only ad personalization/storage is gated.
 */
export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Defer the state write out of the effect body (project lint rule).
    const t = setTimeout(() => setVisible(readConsent() === null), 0);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  function choose(value: "granted" | "denied") {
    writeConsent(value);
    setVisible(false);
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[300] border-t border-slate-200 bg-white/95 p-4 shadow-[0_-4px_24px_rgba(0,0,0,0.1)] backdrop-blur"
      dir="rtl"
      role="dialog"
      aria-label="موافقة ملفات تعريف الارتباط"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-slate-600">
          نستخدم ملفات تعريف الارتباط لعرض إعلانات مناسبة وتحليل الزيارات. يمكنك القبول أو الرفض —
          الرفض لا يؤثّر على استخدامك للموقع.{" "}
          <Link href="/privacy" className="font-medium text-indigo-600 underline">
            سياسة الخصوصية
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => choose("denied")}
            className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            رفض
          </button>
          <button
            onClick={() => choose("granted")}
            className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            قبول الكل
          </button>
        </div>
      </div>
    </div>
  );
}
