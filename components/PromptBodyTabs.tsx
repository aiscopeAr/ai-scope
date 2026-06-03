"use client";

import { useState } from "react";
import CopyPromptButton from "@/components/CopyPromptButton";

interface Props {
  body: string;
  bodyAr: string | null;
  slug?: string;
  category?: string;
}

export default function PromptBodyTabs({ body, bodyAr, slug, category }: Props) {
  const [lang, setLang] = useState<"en" | "ar">(bodyAr ? "ar" : "en");

  const activeText = lang === "ar" && bodyAr ? bodyAr : body;
  const isAr = lang === "ar" && !!bodyAr;

  return (
    <div className="rounded-[6px] border p-6"
      style={{ borderColor: "var(--accent)", backgroundColor: "var(--accent-bg)" }}>

      {/* Header row */}
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <span className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
          نص البرومبت
        </span>

        <div className="flex items-center gap-2">
          {/* Language tabs — only show if Arabic version exists */}
          {bodyAr && (
            <div className="flex rounded-[6px] border overflow-hidden text-xs font-semibold"
              style={{ borderColor: "var(--border-medium)" }}>
              <button
                onClick={() => setLang("ar")}
                className="px-3 py-1.5 transition-colors"
                style={{
                  backgroundColor: lang === "ar" ? "var(--accent)" : "var(--bg-surface)",
                  color: lang === "ar" ? "#fff" : "var(--text-muted)",
                }}
              >
                عربي
              </button>
              <button
                onClick={() => setLang("en")}
                className="px-3 py-1.5 transition-colors"
                style={{
                  backgroundColor: lang === "en" ? "var(--accent)" : "var(--bg-surface)",
                  color: lang === "en" ? "#fff" : "var(--text-muted)",
                }}
              >
                English
              </button>
            </div>
          )}

          <CopyPromptButton text={activeText} slug={slug} category={category} lang={lang} />
        </div>
      </div>

      {/* Prompt text */}
      <pre
        className="whitespace-pre-wrap font-mono text-sm leading-relaxed overflow-x-auto"
        dir={isAr ? "rtl" : "ltr"}
        style={{
          color: "var(--text-primary)",
          textAlign: isAr ? "right" : "left",
        }}
      >
        {activeText}
      </pre>

      {/* No Arabic badge */}
      {!bodyAr && (
        <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
          النسخة العربية غير متوفرة لهذا البرومبت بعد
        </p>
      )}
    </div>
  );
}
