"use client";

import Link from "next/link";
import { track } from "@vercel/analytics";

export interface ToolCardData {
  slug: string;
  name: string;
  tagline: string | null;
  descriptionAr: string;
  logoUrl: string | null;
  toolCategory: string;
  pricing: string;
  monthlyPrice: number | null;
  arabicSupport: boolean;
  hasApi: boolean;
  tags: string[];
  viewCount: number;
  likes: number;
  featured: boolean;
  editorPick: boolean;
}

const PRICING_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  free:     { label: "مجاني",         color: "#16a34a", bg: "#f0fdf4" },
  freemium: { label: "مجاني+",        color: "#b45309", bg: "#fffbeb" },
  paid:     { label: "مدفوع",         color: "#be123c", bg: "#fff1f2" },
};

const CAT_COLORS: Record<string, string> = {
  writing:          "#6366f1",
  coding:           "#0ea5e9",
  image:            "#ec4899",
  video:            "#f97316",
  voice:            "#8b5cf6",
  marketing:        "#10b981",
  education:        "#f59e0b",
  startups:         "#14b8a6",
  ecommerce:        "#ef4444",
  automation:       "#3b82f6",
  "customer-support":"#64748b",
  productivity:     "#7c3aed",
  legal:            "#0f172a",
  finance:          "#059669",
  healthcare:       "#dc2626",
  students:         "#f59e0b",
  "no-code":        "#6366f1",
  presentations:    "#e11d48",
  other:            "#94a3b8",
};

export default function ToolCard({ tool }: { tool: ToolCardData }) {
  const badge  = PRICING_BADGE[tool.pricing] ?? PRICING_BADGE.freemium;
  const accent = CAT_COLORS[tool.toolCategory] ?? "#6366f1";

  return (
    <Link
      href={`/ai-tools/${tool.slug}`}
      onClick={() => track("tool_click", { slug: tool.slug, category: tool.toolCategory })}
      className="group relative flex items-start gap-4 rounded-[10px] border p-4 transition-all duration-200"
      style={{
        borderColor: "var(--border-subtle)",
        backgroundColor: "var(--bg-surface)",
      }}
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
      <div
        className="absolute right-0 top-4 bottom-4 w-[3px] rounded-l-full opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: accent }}
      />

      {/* Logo */}
      <div
        className="shrink-0 flex h-14 w-14 items-center justify-center rounded-[10px] text-xl font-black overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${accent}18, ${accent}30)`, border: `1px solid ${accent}30` }}
      >
        {tool.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tool.logoUrl}
            alt={tool.name}
            width={44}
            height={44}
            loading="lazy"
            className="h-10 w-10 object-contain"
            onError={e => {
              const img = e.currentTarget as HTMLImageElement;
              img.style.display = "none";
              img.parentElement!.innerHTML = `<span style="font-size:1.3rem;font-weight:900;color:${accent}">${tool.name[0]}</span>`;
            }}
          />
        ) : (
          <span style={{ fontSize: "1.3rem", fontWeight: 900, color: accent }}>{tool.name[0]}</span>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Top row: name + badges */}
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-bold text-[15px] transition-colors group-hover:opacity-80" style={{ color: "var(--text-primary)" }}>
            {tool.name}
          </span>
          {tool.editorPick && (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ backgroundColor: "#fef3c7", color: "#b45309" }}>
              ⭐ اختيار المحرر
            </span>
          )}
          {tool.featured && (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ backgroundColor: `${accent}18`, color: accent }}>
              مميز
            </span>
          )}
        </div>

        {/* Tagline / description */}
        <p className="text-sm line-clamp-2 leading-relaxed mb-2.5" style={{ color: "var(--text-secondary)" }}>
          {tool.tagline ?? tool.descriptionAr}
        </p>

        {/* Bottom row: pricing + badges + stats */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Pricing */}
          <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
            style={{ backgroundColor: badge.bg, color: badge.color }}>
            {badge.label}
            {tool.monthlyPrice && tool.pricing !== "free" ? ` · $${tool.monthlyPrice}` : ""}
          </span>

          {/* Arabic support */}
          {tool.arabicSupport && (
            <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
              style={{ backgroundColor: "#f0fdfa", color: "#0d9488" }}>
              عربي ✓
            </span>
          )}

          {/* API */}
          {tool.hasApi && (
            <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
              style={{ backgroundColor: "#eff6ff", color: "#2563eb" }}>
              API
            </span>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Stats */}
          <div className="flex items-center gap-2.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
            {tool.likes > 0 && (
              <span className="flex items-center gap-0.5">
                <span>▲</span>
                <span>{tool.likes.toLocaleString("ar-EG")}</span>
              </span>
            )}
            <span className="flex items-center gap-0.5">
              <span>👁</span>
              <span>{tool.viewCount.toLocaleString("ar-EG")}</span>
            </span>
          </div>
        </div>

        {/* Tags */}
        {tool.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tool.tags.slice(0, 3).map(t => (
              <span key={t} className="rounded-[4px] px-1.5 py-0.5 text-[10px]"
                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-muted)" }}>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
