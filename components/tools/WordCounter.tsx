"use client";

import { useMemo, useState } from "react";
import { analyzeText } from "@/lib/tools/word-count";

const SURFACE = { borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" };

export default function WordCounter() {
  const [text, setText] = useState("");
  const stats = useMemo(() => analyzeText(text), [text]);

  const cards: { label: string; value: number }[] = [
    { label: "الكلمات", value: stats.words },
    { label: "الحروف", value: stats.charsWithSpaces },
    { label: "حروف بدون مسافات", value: stats.charsNoSpaces },
    { label: "الجُمَل", value: stats.sentences },
    { label: "الأسطر", value: stats.lines },
    { label: "دقائق القراءة", value: stats.readingMinutes },
  ];

  return (
    <div className="mx-auto max-w-2xl" dir="rtl">
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-[8px] border p-4 text-center" style={SURFACE}>
            <div className="text-2xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              {c.value.toLocaleString("ar-EG")}
            </div>
            <div className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              {c.label}
            </div>
          </div>
        ))}
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          الصق أو اكتب النص
        </span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          dir="auto"
          placeholder="ابدأ بالكتابة أو الصق نصك هنا…"
          className="w-full resize-y rounded-[8px] border px-4 py-3 text-base leading-relaxed outline-none"
          style={{ ...SURFACE, color: "var(--text-primary)" }}
          aria-label="النص"
        />
      </label>

      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setText("")}
          className="text-sm font-medium hover:underline"
          style={{ color: "var(--accent)" }}
        >
          مسح النص
        </button>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          يتم العدّ داخل متصفحك — لا يُرفع نصك لأي خادم.
        </span>
      </div>
    </div>
  );
}
