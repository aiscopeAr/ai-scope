"use client";

import { useMemo, useState } from "react";
import { normalizeArabic, DEFAULT_NORMALIZE_OPTIONS, type NormalizeOptions } from "@/lib/tools/arabic-text";

const SURFACE = { borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" };

const TOGGLES: { key: keyof Omit<NormalizeOptions, "digits">; label: string }[] = [
  { key: "removeTashkeel", label: "إزالة التشكيل" },
  { key: "removeTatweel", label: "حذف التطويل (ـــ)" },
  { key: "unifyLetters", label: "توحيد الحروف (أ إ آ→ا، ى→ي، ة→ه)" },
  { key: "collapseWhitespace", label: "تنظيف المسافات" },
];

const DIGIT_OPTIONS: { id: NormalizeOptions["digits"]; label: string }[] = [
  { id: "keep", label: "إبقاء الأرقام" },
  { id: "toLatin", label: "أرقام لاتينية (123)" },
  { id: "toArabic", label: "أرقام عربية (١٢٣)" },
];

export default function ArabicTextNormalizer() {
  const [text, setText] = useState("");
  const [opts, setOpts] = useState<NormalizeOptions>(DEFAULT_NORMALIZE_OPTIONS);
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => normalizeArabic(text, opts), [text, opts]);

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

  const boxClass = "w-full resize-y rounded-[8px] border px-4 py-3 text-base leading-relaxed outline-none";

  return (
    <div className="mx-auto max-w-3xl" dir="rtl">
      <div className="mb-5 rounded-[8px] border p-5" style={SURFACE}>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {TOGGLES.map((t) => (
            <label
              key={t.key}
              className="flex cursor-pointer items-center gap-2 rounded-[6px] border px-3 py-2.5 text-sm"
              style={{ ...SURFACE, color: "var(--text-secondary)" }}
            >
              <input
                type="checkbox"
                checked={opts[t.key]}
                onChange={(e) => setOpts({ ...opts, [t.key]: e.target.checked })}
                style={{ accentColor: "var(--accent)" }}
              />
              {t.label}
            </label>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {DIGIT_OPTIONS.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setOpts({ ...opts, digits: d.id })}
              className="rounded-[6px] border px-3 py-1.5 text-sm font-medium transition"
              style={
                opts.digits === d.id
                  ? { borderColor: "var(--accent)", backgroundColor: "var(--accent-bg)", color: "var(--accent)" }
                  : { ...SURFACE, color: "var(--text-secondary)" }
              }
              aria-pressed={opts.digits === d.id}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            النص الأصلي
          </span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            dir="auto"
            placeholder="الصق النص العربي هنا…"
            className={boxClass}
            style={{ ...SURFACE, color: "var(--text-primary)" }}
            aria-label="النص الأصلي"
          />
        </label>
        <div className="block">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              النتيجة
            </span>
            <button
              type="button"
              onClick={copy}
              disabled={!output}
              className="rounded-[6px] px-3 py-1 text-sm font-semibold transition disabled:opacity-40"
              style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent)" }}
            >
              {copied ? "✓ نُسخت" : "نسخ"}
            </button>
          </div>
          <textarea
            value={output}
            readOnly
            rows={10}
            dir="auto"
            placeholder="ستظهر النتيجة هنا…"
            className={boxClass}
            style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)" }}
            aria-label="النتيجة"
          />
        </div>
      </div>

      <p className="mt-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
        يتم التنسيق داخل متصفحك — لا يُرفع نصك إلى أي خادم.
      </p>
    </div>
  );
}
