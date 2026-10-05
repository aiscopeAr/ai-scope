"use client";

import { useEffect, useState } from "react";
import {
  generatePassword,
  estimateStrength,
  buildCharset,
  clampLength,
  MIN_LENGTH,
  MAX_LENGTH,
  type PasswordOptions,
} from "@/lib/tools/password";

const SURFACE = { borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" };

const DEFAULT_OPTS: PasswordOptions = { length: 16, lower: true, upper: true, digits: true, symbols: true };

const TOGGLES: { key: keyof Omit<PasswordOptions, "length">; label: string }[] = [
  { key: "lower", label: "أحرف صغيرة (a-z)" },
  { key: "upper", label: "أحرف كبيرة (A-Z)" },
  { key: "digits", label: "أرقام (2-9)" },
  { key: "symbols", label: "رموز (!@#)" },
];

export default function PasswordGenerator() {
  const [opts, setOpts] = useState<PasswordOptions>(DEFAULT_OPTS);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  // Generate the first password only on the client (deferred via setTimeout,
  // so it neither runs during SSR — avoiding a hydration mismatch on random
  // text — nor fires setState synchronously inside the effect body. setTimeout
  // also fires in a backgrounded tab, unlike requestAnimationFrame).
  useEffect(() => {
    const id = setTimeout(() => setPassword(generatePassword(DEFAULT_OPTS)), 0);
    return () => clearTimeout(id);
  }, []);

  function regenerate(o: PasswordOptions = opts) {
    setPassword(generatePassword(o));
    setCopied(false);
  }

  function update(patch: Partial<PasswordOptions>) {
    const next = { ...opts, ...patch };
    // Never let every character set be disabled (empty pool).
    if (!buildCharset(next)) return;
    setOpts(next);
    regenerate(next);
  }

  async function copy() {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  const strength = estimateStrength(opts);
  const strengthColor =
    strength.label === "ضعيفة"
      ? "#dc2626"
      : strength.label === "متوسطة"
        ? "#d97706"
        : "var(--accent)";

  return (
    <div className="mx-auto max-w-2xl" dir="rtl">
      {/* Output */}
      <div className="flex items-center gap-3 rounded-[8px] border p-4" style={SURFACE}>
        <code
          className="flex-1 overflow-x-auto whitespace-nowrap text-lg font-bold tracking-wide"
          dir="ltr"
          style={{ color: "var(--text-primary)" }}
        >
          {password || "…"}
        </code>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-[6px] px-3 py-2 text-sm font-semibold transition"
          style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent)" }}
        >
          {copied ? "✓ نُسخت" : "نسخ"}
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span style={{ color: "var(--text-muted)" }}>
          القوة: <span style={{ color: strengthColor, fontWeight: 600 }}>{strength.label}</span> ({strength.bits} بِت)
        </span>
        <button type="button" onClick={() => regenerate()} className="font-medium hover:underline" style={{ color: "var(--accent)" }}>
          توليد كلمة جديدة ↻
        </button>
      </div>

      {/* Controls */}
      <div className="mt-6 rounded-[8px] border p-5" style={SURFACE}>
        <label className="block">
          <span className="mb-2 flex items-center justify-between text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            <span>الطول</span>
            <span style={{ color: "var(--text-primary)" }}>{opts.length}</span>
          </span>
          <input
            type="range"
            min={MIN_LENGTH}
            max={MAX_LENGTH}
            value={opts.length}
            onChange={(e) => update({ length: clampLength(Number.parseInt(e.target.value, 10)) })}
            className="w-full"
            style={{ accentColor: "var(--accent)" }}
            aria-label="طول كلمة المرور"
          />
        </label>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {TOGGLES.map((t) => (
            <label
              key={t.key}
              className="flex cursor-pointer items-center gap-2 rounded-[6px] border px-3 py-2.5 text-sm"
              style={{ ...SURFACE, color: "var(--text-secondary)" }}
            >
              <input
                type="checkbox"
                checked={opts[t.key]}
                onChange={(e) => update({ [t.key]: e.target.checked })}
                style={{ accentColor: "var(--accent)" }}
              />
              {t.label}
            </label>
          ))}
        </div>
      </div>

      <p className="mt-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
        تُولَّد كلمة المرور داخل متصفحك باستخدام مولّد عشوائي آمن، ولا تُرسل إلى أي خادم أبدًا.
      </p>
    </div>
  );
}
