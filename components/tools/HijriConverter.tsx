"use client";

import { useMemo, useState } from "react";
import {
  gregorianToHijri,
  hijriToGregorian,
  formatHijriAr,
  formatGregorianAr,
  weekdayAr,
  HIJRI_MONTHS_AR,
} from "@/lib/tools/hijri";

type Direction = "g2h" | "h2g";

function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

function toInputValue(d: Date): string {
  const y = d.getUTCFullYear().toString().padStart(4, "0");
  const m = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = d.getUTCDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const SURFACE = { borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" };

export default function HijriConverter() {
  const [direction, setDirection] = useState<Direction>("g2h");

  // Gregorian input (native date picker, UTC-normalized)
  const [gregValue, setGregValue] = useState<string>(() => toInputValue(todayUtc()));

  // Hijri input (year/month/day)
  const initialHijri = useMemo(() => gregorianToHijri(todayUtc()), []);
  const [hYear, setHYear] = useState<number>(initialHijri.year);
  const [hMonth, setHMonth] = useState<number>(initialHijri.month);
  const [hDay, setHDay] = useState<number>(initialHijri.day);

  const result = useMemo(() => {
    if (direction === "g2h") {
      const parts = gregValue.split("-").map((n) => Number.parseInt(n, 10));
      if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
      const [y, m, d] = parts;
      const g = new Date(Date.UTC(y, m - 1, d));
      if (Number.isNaN(g.getTime())) return null;
      const h = gregorianToHijri(g);
      return { ok: true as const, primary: formatHijriAr(h), weekday: weekdayAr(g) };
    }
    const g = hijriToGregorian(hYear, hMonth, hDay);
    if (!g) return { ok: false as const };
    return { ok: true as const, primary: formatGregorianAr(g), weekday: weekdayAr(g) };
  }, [direction, gregValue, hYear, hMonth, hDay]);

  function setToday() {
    const t = todayUtc();
    setGregValue(toInputValue(t));
    const h = gregorianToHijri(t);
    setHYear(h.year);
    setHMonth(h.month);
    setHDay(h.day);
  }

  const inputClass = "w-full rounded-[6px] border px-3 py-2.5 text-base outline-none";
  const inputStyle = { ...SURFACE, color: "var(--text-primary)" };

  return (
    <div className="mx-auto max-w-2xl" dir="rtl">
      {/* Direction toggle */}
      <div className="mb-6 grid grid-cols-2 gap-2 rounded-[8px] border p-1" style={SURFACE}>
        {([
          ["g2h", "ميلادي ← هجري"],
          ["h2g", "هجري ← ميلادي"],
        ] as const).map(([val, label]) => (
          <button
            key={val}
            type="button"
            onClick={() => setDirection(val)}
            className="rounded-[6px] px-4 py-2.5 text-sm font-semibold transition"
            style={
              direction === val
                ? { backgroundColor: "var(--accent)", color: "var(--accent-contrast, #fff)" }
                : { color: "var(--text-secondary)" }
            }
            aria-pressed={direction === val}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="rounded-[8px] border p-5" style={SURFACE}>
        {direction === "g2h" ? (
          <label className="block">
            <span className="mb-2 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              أدخل التاريخ الميلادي
            </span>
            <input
              type="date"
              value={gregValue}
              onChange={(e) => setGregValue(e.target.value)}
              className={inputClass}
              style={inputStyle}
              aria-label="التاريخ الميلادي"
            />
          </label>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <label className="block">
              <span className="mb-2 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                اليوم
              </span>
              <input
                type="number"
                min={1}
                max={30}
                value={hDay}
                onChange={(e) => setHDay(Number.parseInt(e.target.value, 10) || 0)}
                className={inputClass}
                style={inputStyle}
                aria-label="اليوم الهجري"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                الشهر
              </span>
              <select
                value={hMonth}
                onChange={(e) => setHMonth(Number.parseInt(e.target.value, 10))}
                className={inputClass}
                style={inputStyle}
                aria-label="الشهر الهجري"
              >
                {HIJRI_MONTHS_AR.map((name, i) => (
                  <option key={name} value={i + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                السنة
              </span>
              <input
                type="number"
                min={1300}
                max={1600}
                value={hYear}
                onChange={(e) => setHYear(Number.parseInt(e.target.value, 10) || 0)}
                className={inputClass}
                style={inputStyle}
                aria-label="السنة الهجرية"
              />
            </label>
          </div>
        )}

        <button
          type="button"
          onClick={setToday}
          className="mt-4 text-sm font-medium hover:underline"
          style={{ color: "var(--accent)" }}
        >
          استخدم تاريخ اليوم
        </button>
      </div>

      {/* Result */}
      <div
        className="mt-6 rounded-[8px] border p-6 text-center"
        style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-subtle)" }}
        aria-live="polite"
      >
        {result && result.ok ? (
          <>
            <p className="mb-1 text-sm" style={{ color: "var(--text-muted)" }}>
              {result.weekday}
            </p>
            <p className="text-2xl font-bold md:text-3xl" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              {result.primary}
            </p>
          </>
        ) : (
          <p className="text-base" style={{ color: "var(--text-muted)" }}>
            هذا التاريخ الهجري غير صحيح — تأكد من اليوم والشهر والسنة.
          </p>
        )}
      </div>

      <p className="mt-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
        التحويل يعتمد على تقويم أم القرى الرسمي، ويتم بالكامل داخل متصفحك دون إرسال أي بيانات.
      </p>
    </div>
  );
}
