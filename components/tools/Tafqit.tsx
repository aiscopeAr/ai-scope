"use client";

import { useMemo, useState } from "react";
import { tafqit, type CurrencyCode } from "@/lib/tools/tafqit";

const SURFACE = { borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" };

const CURRENCIES: { id: CurrencyCode; label: string }[] = [
  { id: "none", label: "بدون عملة (رقم)" },
  { id: "SAR", label: "ريال سعودي (SAR)" },
  { id: "AED", label: "درهم إماراتي (AED)" },
  { id: "EGP", label: "جنيه مصري (EGP)" },
  { id: "USD", label: "دولار أمريكي (USD)" },
  { id: "EUR", label: "يورو (EUR)" },
  { id: "ILS", label: "شيكل إسرائيلي (ILS)" },
];

export default function Tafqit() {
  const [value, setValue] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("none");
  const [suffix, setSuffix] = useState(true);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (value.trim() === "") return null;
    return tafqit(value, { currency, chequeSuffix: suffix });
  }, [value, currency, suffix]);

  const output = result && result.ok ? result.text : "";

  async function copy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  const inputStyle = { ...SURFACE, color: "var(--text-primary)" };
  const inputClass = "w-full rounded-[6px] border px-3 py-2.5 text-base outline-none";

  return (
    <div className="mx-auto max-w-2xl" dir="rtl">
      <div className="rounded-[8px] border p-5" style={SURFACE}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              الرقم أو المبلغ
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="مثال: 1250.75"
              dir="ltr"
              className={`${inputClass} text-right`}
              style={inputStyle}
              aria-label="الرقم أو المبلغ"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              العملة
            </span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className={inputClass}
              style={inputStyle}
              aria-label="العملة"
            >
              {CURRENCIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {currency !== "none" && (
          <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            <input type="checkbox" checked={suffix} onChange={(e) => setSuffix(e.target.checked)} style={{ accentColor: "var(--accent)" }} />
            إضافة صيغة الشيك: «فقط … لا غير»
          </label>
        )}
      </div>

      <div
        className="mt-6 rounded-[8px] border p-6"
        style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-subtle)" }}
        aria-live="polite"
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
            النتيجة بالحروف
          </span>
          {output && (
            <button
              type="button"
              onClick={copy}
              className="rounded-[6px] px-3 py-1 text-sm font-semibold transition"
              style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent)" }}
            >
              {copied ? "✓ نُسخت" : "نسخ"}
            </button>
          )}
        </div>
        {result && !result.ok ? (
          <p className="text-base" style={{ color: "var(--text-muted)" }}>
            {result.error}
          </p>
        ) : output ? (
          <p className="text-xl font-bold leading-relaxed md:text-2xl" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            {output}
          </p>
        ) : (
          <p className="text-base" style={{ color: "var(--text-muted)" }}>
            أدخل رقمًا لعرضه بالحروف.
          </p>
        )}
      </div>

      <p className="mt-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
        التفقيط يتم بالكامل داخل متصفحك دون إرسال أي بيانات. يدعم حتى مئات المليارات بدقّة.
      </p>
    </div>
  );
}
