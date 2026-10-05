"use client";

import { useState } from "react";
import { percentOf, whatPercent, percentChange, roundSmart } from "@/lib/tools/percentage";

const SURFACE = { borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" };

type Mode = "of" | "isWhat" | "change";

const MODES: { id: Mode; label: string }[] = [
  { id: "of", label: "٪ من رقم" },
  { id: "isWhat", label: "نسبة رقم من آخر" },
  { id: "change", label: "الزيادة / النقصان" },
];

function toNum(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function PercentageCalculator() {
  const [mode, setMode] = useState<Mode>("of");
  const [a, setA] = useState("");
  const [b, setB] = useState("");

  const na = toNum(a);
  const nb = toNum(b);

  let result: string | null = null;
  let invalid = false;
  if (na !== null && nb !== null) {
    if (mode === "of") {
      result = `${roundSmart(percentOf(na, nb))}`;
    } else if (mode === "isWhat") {
      const r = whatPercent(na, nb);
      if (r === null) invalid = true;
      else result = `${roundSmart(r)}٪`;
    } else {
      const r = percentChange(na, nb);
      if (r === null) invalid = true;
      else result = `${r >= 0 ? "+" : ""}${roundSmart(r)}٪`;
    }
  }

  const labels =
    mode === "of"
      ? ["النسبة المئوية (٪)", "من الرقم"]
      : mode === "isWhat"
        ? ["الرقم", "من إجمالي"]
        : ["القيمة الأصلية", "القيمة الجديدة"];

  const sentence =
    mode === "of"
      ? `كم يساوي ${a || "س"}٪ من ${b || "ص"}؟`
      : mode === "isWhat"
        ? `${a || "س"} يمثّل كم ٪ من ${b || "ص"}؟`
        : `نسبة التغيّر من ${a || "س"} إلى ${b || "ص"}`;

  const inputStyle = { ...SURFACE, color: "var(--text-primary)" };
  const inputClass = "w-full rounded-[6px] border px-3 py-2.5 text-base outline-none";

  return (
    <div className="mx-auto max-w-xl" dir="rtl">
      <div className="mb-6 grid grid-cols-3 gap-2 rounded-[8px] border p-1" style={SURFACE}>
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className="rounded-[6px] px-2 py-2.5 text-sm font-semibold transition"
            style={
              mode === m.id
                ? { backgroundColor: "var(--accent)", color: "var(--accent-contrast, #fff)" }
                : { color: "var(--text-secondary)" }
            }
            aria-pressed={mode === m.id}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="rounded-[8px] border p-5" style={SURFACE}>
        <p className="mb-4 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          {sentence}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[0, 1].map((i) => (
            <label key={i} className="block">
              <span className="mb-2 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                {labels[i]}
              </span>
              <input
                type="number"
                inputMode="decimal"
                value={i === 0 ? a : b}
                onChange={(e) => (i === 0 ? setA(e.target.value) : setB(e.target.value))}
                className={inputClass}
                style={inputStyle}
                aria-label={labels[i]}
              />
            </label>
          ))}
        </div>
      </div>

      <div
        className="mt-6 rounded-[8px] border p-6 text-center"
        style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-subtle)" }}
        aria-live="polite"
      >
        {invalid ? (
          <p className="text-base" style={{ color: "var(--text-muted)" }}>
            لا يمكن القسمة على صفر — أدخل قيمة أخرى.
          </p>
        ) : result !== null ? (
          <p className="text-3xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            {result}
          </p>
        ) : (
          <p className="text-base" style={{ color: "var(--text-muted)" }}>
            أدخل الرقمين لعرض النتيجة.
          </p>
        )}
      </div>
    </div>
  );
}
