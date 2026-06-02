"use client";

import Link from "next/link";

const CAT_COLORS: Record<string, string> = {
  image:     "#ec4899",
  writing:   "#6366f1",
  code:      "#0ea5e9",
  marketing: "#10b981",
  general:   "#8b5cf6",
};

const CAT_LABELS: Record<string, string> = {
  image:     "🎨 صور",
  writing:   "✍️ كتابة",
  code:      "💻 برمجة",
  marketing: "📣 تسويق",
  general:   "✨ عام",
};

export interface PromptCardData {
  id: string;
  slug: string;
  titleAr: string;
  description: string | null;
  category: string;
  featured: boolean;
  tool: { name: string; slug: string; logoUrl: string | null } | null;
}

export default function PromptCard({ prompt }: { prompt: PromptCardData }) {
  const accent = CAT_COLORS[prompt.category] ?? "#6366f1";

  return (
    <Link
      href={`/prompts/${prompt.slug}`}
      className="group relative flex items-start gap-4 rounded-[10px] border p-4 transition-all duration-200"
      style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = accent + "55";
        el.style.boxShadow = `0 4px 20px ${accent}18`;
        el.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "var(--border-subtle)";
        el.style.boxShadow = "none";
        el.style.transform = "translateY(0)";
      }}
    >
      {/* Left accent bar */}
      <div className="absolute right-0 top-4 bottom-4 w-[3px] rounded-l-full opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: accent }} />

      {/* Icon */}
      <div className="shrink-0 flex h-14 w-14 items-center justify-center rounded-[10px] text-2xl overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${accent}18, ${accent}30)`, border: `1px solid ${accent}30` }}>
        {prompt.tool?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={prompt.tool.logoUrl} alt={prompt.tool.name}
            width={44} height={44} loading="lazy"
            className="h-10 w-10 object-contain"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <span>{CAT_LABELS[prompt.category]?.split(" ")[0] ?? "✨"}</span>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Category + featured */}
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
            style={{ backgroundColor: `${accent}18`, color: accent }}>
            {CAT_LABELS[prompt.category] ?? prompt.category}
          </span>
          {prompt.featured && (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ backgroundColor: "#fef3c7", color: "#b45309" }}>
              ⭐ مميز
            </span>
          )}
        </div>

        {/* Title */}
        <p className="font-bold text-[15px] leading-snug line-clamp-2 mb-2 transition-opacity group-hover:opacity-80"
          style={{ color: "var(--text-primary)" }}>
          {prompt.titleAr}
        </p>

        {/* Description */}
        {prompt.description && (
          <p className="text-sm line-clamp-2 leading-relaxed mb-2.5" style={{ color: "var(--text-secondary)" }}>
            {prompt.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          {prompt.tool ? (
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{prompt.tool.name}</span>
          ) : (
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>يعمل مع أي AI</span>
          )}
          <span className="text-[11px] font-semibold" style={{ color: accent }}>نسخ واستخدام ←</span>
        </div>
      </div>
    </Link>
  );
}
