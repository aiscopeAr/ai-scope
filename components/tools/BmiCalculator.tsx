"use client";

import { useMemo, useState } from "react";
import { computeBmi, bmiCategory, healthyWeightRange } from "@/lib/tools/bmi";

const SURFACE = { borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" };

const CATEGORY_COLOR: Record<string, string> = {
  underweight: "#d97706",
  normal: "var(--accent)",
  overweight: "#d97706",
  obese1: "#dc2626",
  obese2: "#dc2626",
  obese3: "#dc2626",
};

function toNum(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function BmiCalculator() {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");

  const result = useMemo(() => {
    const w = toNum(weight);
    const h = toNum(height);
    const bmi = computeBmi(w, h);
    if (bmi === null) return null;
    return { bmi, category: bmiCategory(bmi), range: healthyWeightRange(h)! };
  }, [weight, height]);

  const inputStyle = { ...SURFACE, color: "var(--text-primary)" };
  const inputClass = "w-full rounded-[6px] border px-3 py-2.5 text-base outline-none text-right";

  return (
    <div className="mx-auto max-w-xl" dir="rtl">
      <div className="rounded-[8px] border p-5" style={SURFACE}>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-2 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              الوزن (كغ)
            </span>
            <input
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="70"
              dir="ltr"
              className={inputClass}
              style={inputStyle}
              aria-label="الوزن بالكيلوغرام"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              الطول (سم)
            </span>
            <input
              type="number"
              inputMode="decimal"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="175"
              dir="ltr"
              className={inputClass}
              style={inputStyle}
              aria-label="الطول بالسنتيمتر"
            />
          </label>
        </div>
      </div>

      <div
        className="mt-6 rounded-[8px] border p-6 text-center"
        style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-subtle)" }}
        aria-live="polite"
      >
        {result ? (
          <>
            <p className="mb-1 text-sm" style={{ color: "var(--text-muted)" }}>
              مؤشر كتلة الجسم
            </p>
            <p className="text-4xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              {result.bmi.toLocaleString("ar-EG")}
            </p>
            <p className="mt-2 text-lg font-semibold" style={{ color: CATEGORY_COLOR[result.category.id] ?? "var(--text-primary)" }}>
              {result.category.labelAr}
            </p>
            <p className="mt-3 text-sm" style={{ color: "var(--text-secondary)" }}>
              وزنك الصحي لهذا الطول:{" "}
              <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                {result.range.min.toLocaleString("ar-EG")} – {result.range.max.toLocaleString("ar-EG")} كغ
              </span>
            </p>
          </>
        ) : (
          <p className="text-base" style={{ color: "var(--text-muted)" }}>
            أدخل وزنك وطولك لحساب المؤشر.
          </p>
        )}
      </div>

      <p className="mt-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
        المؤشر دليل عام للوزن وليس تشخيصًا طبيًا؛ استشر مختصًا عند الحاجة. الحساب يتم داخل متصفحك فقط.
      </p>
    </div>
  );
}
