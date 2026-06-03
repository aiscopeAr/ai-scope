"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { track } from "@vercel/analytics";

interface Props {
  text: string;
  slug?: string;
  category?: string;
  lang?: "ar" | "en";
}

export default function CopyPromptButton({ text, slug, category, lang }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    track("prompt_copy", {
      ...(slug     && { slug }),
      ...(category && { category }),
      ...(lang     && { lang }),
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-[6px] border px-3 py-1.5 text-xs font-semibold transition-all"
      style={{
        borderColor: copied ? "#bbf7d0" : "var(--accent)",
        backgroundColor: copied ? "#f0fdf4" : "var(--accent-bg)",
        color: copied ? "#16a34a" : "var(--accent)",
      }}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "تم النسخ" : "نسخ البرومبت"}
    </button>
  );
}
