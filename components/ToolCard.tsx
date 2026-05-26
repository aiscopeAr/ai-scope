import Image from "next/image";
import Link from "next/link";

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

const PRICING_BADGE: Record<string, { label: string; bg: string; color: string; border: string }> = {
  free:     { label: "مجاني",          bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  freemium: { label: "مجاني + مدفوع", bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
  paid:     { label: "مدفوع",          bg: "#fff1f2", color: "#be123c", border: "#fecdd3" },
};

export default function ToolCard({ tool, compact = false }: { tool: ToolCardData; compact?: boolean }) {
  const badge = PRICING_BADGE[tool.pricing] ?? PRICING_BADGE.freemium;

  return (
    <Link
      href={`/ai-tools/${tool.slug}`}
      className="group flex flex-col rounded-[6px] border p-5 transition"
      style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-medium)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)"; }}
    >
      {/* Header */}
      <div className="mb-3 flex items-start gap-3">
        <div className="relative shrink-0">
          {tool.logoUrl ? (
            <div className="relative h-12 w-12 overflow-hidden rounded-[6px] border" style={{ borderColor: "var(--border-subtle)" }}>
              <Image src={tool.logoUrl} alt={tool.name} fill className="object-cover" unoptimized />
            </div>
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-[6px] text-lg font-black"
              style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent)" }}>
              {tool.name[0]}
            </div>
          )}
          {tool.editorPick && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-[3px] text-[9px]"
              style={{ backgroundColor: "#f59e0b", color: "#fff" }}
              title="اختيار المحرر">★</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-bold truncate transition-colors" style={{ color: "var(--text-primary)" }}>
              {tool.name}
            </h3>
            {tool.featured && (
              <span className="shrink-0 rounded-[3px] border px-1.5 py-0.5 text-[10px] font-bold"
                style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent)", borderColor: "var(--accent)" }}>
                مميز
              </span>
            )}
          </div>
          {tool.tagline && !compact && (
            <p className="mt-0.5 text-xs line-clamp-1" style={{ color: "var(--text-muted)" }}>{tool.tagline}</p>
          )}
        </div>
      </div>

      {/* Description */}
      {!compact && (
        <p className="mb-3 flex-1 text-sm line-clamp-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{tool.descriptionAr}</p>
      )}

      {/* Tags */}
      {tool.tags.length > 0 && !compact && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {tool.tags.slice(0, 3).map((t) => (
            <span key={t} className="rounded-[3px] border px-2 py-0.5 text-[11px]"
              style={{ borderColor: "var(--border-medium)", color: "var(--text-muted)", backgroundColor: "var(--bg-subtle)" }}>
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="rounded-[3px] border px-2 py-0.5 text-[11px] font-semibold"
            style={{ backgroundColor: badge.bg, color: badge.color, borderColor: badge.border }}>
            {badge.label}
            {tool.monthlyPrice && tool.pricing !== "free" ? ` · $${tool.monthlyPrice}` : ""}
          </span>
          {tool.arabicSupport && (
            <span className="rounded-[3px] border px-1.5 py-0.5 text-[10px] font-bold"
              style={{ backgroundColor: "#f0fdfa", color: "#0d9488", borderColor: "#99f6e4" }}>
              عربي ✓
            </span>
          )}
          {tool.hasApi && (
            <span className="rounded-[3px] border px-1.5 py-0.5 text-[10px] font-bold"
              style={{ backgroundColor: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe" }}>
              API
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[11px] shrink-0" style={{ color: "var(--text-muted)" }}>
          <span>👁 {tool.viewCount.toLocaleString("ar-EG")}</span>
          {tool.likes > 0 && <span>♥ {tool.likes.toLocaleString("ar-EG")}</span>}
        </div>
      </div>
    </Link>
  );
}
