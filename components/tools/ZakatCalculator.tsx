"use client";

import { useMemo, useState } from "react";
import { useToolUsage } from "@/lib/tools/use-tool-usage";
import { computeZakat, nisabFromGoldPrice, NISAB_GOLD_GRAMS, type ZakatAssets } from "@/lib/tools/zakat";

const SURFACE = { borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" };

const FIELDS: { key: keyof ZakatAssets; label: string; hint?: string }[] = [
  { key: "cash", label: "النقد والحسابات البنكية" },
  { key: "gold", label: "قيمة الذهب" },
  { key: "silver", label: "قيمة الفضة" },
  { key: "investments", label: "الأسهم والاستثمارات" },
  { key: "trade", label: "عروض التجارة والمخزون" },
  { key: "debts", label: "الديون المستحقة عليك (تُطرح)" },
];

const num = (v: string) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export default function ZakatCalculator() {
  const [vals, setVals] = useState<Record<keyof ZakatAssets, string>>({
    cash: "", gold: "", silver: "", investments: "", trade: "", debts: "",
  });
  const [goldPrice, setGoldPrice] = useState("");
  const markUsed = useToolUsage("zakat-calculator");

  const result = useMemo(() => {
    const assets: ZakatAssets = {
      cash: num(vals.cash), gold: num(vals.gold), silver: num(vals.silver),
      investments: num(vals.investments), trade: num(vals.trade), debts: num(vals.debts),
    };
    const gp = num(goldPrice);
    const nisab = gp > 0 ? nisabFromGoldPrice(gp) : null;
    return computeZakat(assets, nisab);
  }, [vals, goldPrice]);

  const anyInput = Object.values(vals).some((v) => v.trim() !== "");
  const fmt = (x: number) => x.toLocaleString("ar-EG", { maximumFractionDigits: 2 });

  const inputStyle = { ...SURFACE, color: "var(--text-primary)" };
  const inputClass = "w-full rounded-[6px] border px-3 py-2.5 text-base outline-none";

  function set(key: keyof ZakatAssets, v: string) {
    markUsed();
    setVals((s) => ({ ...s, [key]: v }));
  }

  return (
    <div className="mx-auto max-w-2xl" dir="rtl">
      <div className="rounded-[8px] border p-5" style={SURFACE}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <label key={f.key} className="block">
              <span className="mb-2 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{f.label}</span>
              <input
                type="number"
                inputMode="decimal"
                value={vals[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
                placeholder="0"
                dir="ltr"
                className={`${inputClass} text-right`}
                style={inputStyle}
                aria-label={f.label}
              />
            </label>
          ))}
        </div>

        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            سعر غرام الذهب (اختياري — لحساب النصاب)
          </span>
          <input
            type="number"
            inputMode="decimal"
            value={goldPrice}
            onChange={(e) => { markUsed(); setGoldPrice(e.target.value); }}
            placeholder="مثال: 300"
            dir="ltr"
            className={`${inputClass} text-right`}
            style={inputStyle}
            aria-label="سعر غرام الذهب"
          />
        </label>
      </div>

      <div
        className="mt-6 rounded-[8px] border p-6 text-center"
        style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-subtle)" }}
        aria-live="polite"
      >
        {!anyInput ? (
          <p className="text-base" style={{ color: "var(--text-muted)" }}>أدخل ممتلكاتك لحساب الزكاة.</p>
        ) : (
          <>
            <p className="mb-1 text-sm" style={{ color: "var(--text-muted)" }}>الزكاة المستحقة (2.5%)</p>
            <p className="text-3xl font-bold md:text-4xl" style={{ color: "var(--accent)", fontFamily: "var(--font-serif)" }}>
              {fmt(result.due)}
            </p>
            <div className="mt-4 space-y-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              <p>صافي المال الخاضع للزكاة: <span style={{ fontWeight: 600 }}>{fmt(result.net)}</span></p>
              {result.nisab != null ? (
                <p>
                  النصاب (85غ ذهب): <span style={{ fontWeight: 600 }}>{fmt(result.nisab)}</span> —{" "}
                  {result.aboveNisab ? "مالك بلغ النصاب ✓" : "مالك دون النصاب، لا زكاة"}
                </p>
              ) : (
                <p style={{ color: "var(--text-muted)" }}>
                  أدخل سعر غرام الذهب لحساب النصاب ({NISAB_GOLD_GRAMS}غ)، وتأكّد أن مالك بلغه وحال عليه الحول.
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <p className="mt-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
        الحساب تقديري وإرشادي ويتم داخل متصفحك دون إرسال بياناتك؛ لحالتك الخاصة استشر أهل العلم.
      </p>
    </div>
  );
}
