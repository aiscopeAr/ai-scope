"use client";

import { useState } from "react";
import {
  LENGTH,
  WEIGHT,
  TEMP_UNITS,
  convertLinear,
  convertTemperature,
  roundUnit,
  type TempUnit,
} from "@/lib/tools/units";

const SURFACE = { borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" };

type CategoryId = "length" | "weight" | "temperature";

const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "length", label: "الطول" },
  { id: "weight", label: "الوزن" },
  { id: "temperature", label: "الحرارة" },
];

function optionsFor(cat: CategoryId): { id: string; label: string }[] {
  if (cat === "length") return LENGTH.units.map((u) => ({ id: u.id, label: u.labelAr }));
  if (cat === "weight") return WEIGHT.units.map((u) => ({ id: u.id, label: u.labelAr }));
  return TEMP_UNITS.map((u) => ({ id: u.id, label: u.labelAr }));
}

function defaults(cat: CategoryId): { from: string; to: string } {
  if (cat === "length") return { from: "m", to: "cm" };
  if (cat === "weight") return { from: "kg", to: "lb" };
  return { from: "c", to: "f" };
}

export default function UnitConverter() {
  const [category, setCategory] = useState<CategoryId>("length");
  const [value, setValue] = useState("1");
  const [from, setFrom] = useState("m");
  const [to, setTo] = useState("cm");

  function switchCategory(cat: CategoryId) {
    setCategory(cat);
    const d = defaults(cat);
    setFrom(d.from);
    setTo(d.to);
  }

  const opts = optionsFor(category);
  const num = Number(value);
  const valid = value.trim() !== "" && Number.isFinite(num);

  let result = "";
  if (valid) {
    if (category === "temperature") {
      result = `${roundUnit(convertTemperature(num, from as TempUnit, to as TempUnit), 2)}`;
    } else {
      const cat = category === "length" ? LENGTH : WEIGHT;
      const f = cat.units.find((u) => u.id === from)!;
      const t = cat.units.find((u) => u.id === to)!;
      result = `${roundUnit(convertLinear(num, f, t))}`;
    }
  }

  const inputStyle = { ...SURFACE, color: "var(--text-primary)" };
  const inputClass = "w-full rounded-[6px] border px-3 py-2.5 text-base outline-none";

  return (
    <div className="mx-auto max-w-xl" dir="rtl">
      <div className="mb-6 grid grid-cols-3 gap-2 rounded-[8px] border p-1" style={SURFACE}>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => switchCategory(c.id)}
            className="rounded-[6px] px-2 py-2.5 text-sm font-semibold transition"
            style={
              category === c.id
                ? { backgroundColor: "var(--accent)", color: "var(--accent-contrast, #fff)" }
                : { color: "var(--text-secondary)" }
            }
            aria-pressed={category === c.id}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="rounded-[8px] border p-5" style={SURFACE}>
        <label className="block">
          <span className="mb-2 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            القيمة
          </span>
          <input
            type="number"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={inputClass}
            style={inputStyle}
            aria-label="القيمة"
          />
        </label>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-2 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              من
            </span>
            <select value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass} style={inputStyle} aria-label="من وحدة">
              {opts.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              إلى
            </span>
            <select value={to} onChange={(e) => setTo(e.target.value)} className={inputClass} style={inputStyle} aria-label="إلى وحدة">
              {opts.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div
        className="mt-6 rounded-[8px] border p-6 text-center"
        style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-subtle)" }}
        aria-live="polite"
      >
        {valid ? (
          <p className="text-2xl font-bold md:text-3xl" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            {value} {opts.find((o) => o.id === from)?.label} = {result} {opts.find((o) => o.id === to)?.label}
          </p>
        ) : (
          <p className="text-base" style={{ color: "var(--text-muted)" }}>
            أدخل قيمة لعرض النتيجة.
          </p>
        )}
      </div>
    </div>
  );
}
