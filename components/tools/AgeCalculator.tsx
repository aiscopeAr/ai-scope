"use client";

import { useEffect, useMemo, useState } from "react";
import { computeAge } from "@/lib/tools/age";

const SURFACE = { borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" };

function todayInput(): string {
  const n = new Date();
  return `${n.getFullYear().toString().padStart(4, "0")}-${(n.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${n.getDate().toString().padStart(2, "0")}`;
}

function parseInput(value: string): Date | null {
  const parts = value.split("-").map((p) => Number.parseInt(p, 10));
  if (parts.length !== 3 || parts.some((p) => Number.isNaN(p))) return null;
  const [y, m, d] = parts;
  const date = new Date(Date.UTC(y, m - 1, d));
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function AgeCalculator() {
  const [birth, setBirth] = useState("");
  // Start empty (same on server + client → no hydration mismatch on a
  // clock-derived value), then fill "today" on the client after mount.
  const [asOf, setAsOf] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setAsOf((cur) => cur || todayInput()), 0);
    return () => clearTimeout(id);
  }, []);

  const result = useMemo(() => {
    const b = parseInput(birth);
    const n = parseInput(asOf) ?? new Date();
    if (!b) return null;
    return computeAge(b, n);
  }, [birth, asOf]);

  const inputStyle = { ...SURFACE, color: "var(--text-primary)" };
  const inputClass = "w-full rounded-[6px] border px-3 py-2.5 text-base outline-none";

  const detailCards = result
    ? [
        { label: "بالأشهر", value: result.totalMonths },
        { label: "بالأسابيع", value: result.totalWeeks },
        { label: "بالأيام", value: result.totalDays },
        { label: "العمر بالهجري", value: result.hijriYears },
      ]
    : [];

  return (
    <div className="mx-auto max-w-2xl" dir="rtl">
      <div className="grid grid-cols-1 gap-4 rounded-[8px] border p-5 sm:grid-cols-2" style={SURFACE}>
        <label className="block">
          <span className="mb-2 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            تاريخ الميلاد
          </span>
          <input
            type="date"
            value={birth}
            max={asOf}
            onChange={(e) => setBirth(e.target.value)}
            className={inputClass}
            style={inputStyle}
            aria-label="تاريخ الميلاد"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            احسب العمر حتى تاريخ
          </span>
          <input
            type="date"
            value={asOf}
            onChange={(e) => setAsOf(e.target.value)}
            className={inputClass}
            style={inputStyle}
            aria-label="التاريخ المرجعي"
          />
        </label>
      </div>

      <div
        className="mt-6 rounded-[8px] border p-6 text-center"
        style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-subtle)" }}
        aria-live="polite"
      >
        {!birth ? (
          <p className="text-base" style={{ color: "var(--text-muted)" }}>
            أدخل تاريخ ميلادك لحساب عمرك.
          </p>
        ) : !result ? (
          <p className="text-base" style={{ color: "var(--text-muted)" }}>
            تأكد من أن تاريخ الميلاد قبل التاريخ المرجعي.
          </p>
        ) : (
          <>
            <p className="mb-1 text-sm" style={{ color: "var(--text-muted)" }}>
              عمرك الآن
            </p>
            <p className="text-2xl font-bold md:text-3xl" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              {result.years} سنة و{result.months} شهرًا و{result.days} يومًا
            </p>
            <p className="mt-3 text-sm" style={{ color: "var(--text-secondary)" }}>
              وُلدت يوم {result.weekdayBorn} · يتبقى {result.nextBirthdayInDays} يومًا على عيد ميلادك القادم
            </p>
          </>
        )}
      </div>

      {result && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {detailCards.map((c) => (
            <div key={c.label} className="rounded-[8px] border p-4 text-center" style={SURFACE}>
              <div className="text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                {c.value.toLocaleString("ar-EG")}
              </div>
              <div className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                {c.label}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
        العمر بالهجري يعتمد على تقويم أم القرى، ويُحسب بالكامل داخل متصفحك.
      </p>
    </div>
  );
}
