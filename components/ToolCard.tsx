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

const PRICING_BADGE: Record<string, { label: string; cls: string }> = {
  free:     { label: "مجاني",          cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  freemium: { label: "مجاني + مدفوع", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  paid:     { label: "مدفوع",          cls: "bg-red-500/15 text-red-400 border-red-500/30" },
};

export default function ToolCard({ tool, compact = false }: { tool: ToolCardData; compact?: boolean }) {
  const badge = PRICING_BADGE[tool.pricing] ?? PRICING_BADGE.freemium;

  return (
    <Link href={`/ai-tools/${tool.slug}`} className="group flex flex-col rounded-2xl border border-white/6 bg-white/3 p-5 transition hover:border-violet-500/30 hover:bg-violet-500/5 card-hover">
      {/* Header */}
      <div className="mb-3 flex items-start gap-3">
        <div className="relative shrink-0">
          {tool.logoUrl ? (
            <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/10 bg-white/5">
              <Image src={tool.logoUrl} alt={tool.name} fill className="object-cover" unoptimized />
            </div>
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-lg font-black text-violet-400">
              {tool.name[0]}
            </div>
          )}
          {tool.editorPick && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[9px]" title="اختيار المحرر">★</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-bold text-slate-100 group-hover:text-violet-300 transition-colors truncate">
              {tool.name}
            </h3>
            {tool.featured && (
              <span className="shrink-0 rounded-full bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-bold text-violet-400 border border-violet-500/30">مميز</span>
            )}
          </div>
          {tool.tagline && !compact && (
            <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{tool.tagline}</p>
          )}
        </div>
      </div>

      {/* Description */}
      {!compact && (
        <p className="mb-3 flex-1 text-sm text-slate-400 line-clamp-2 leading-relaxed">{tool.descriptionAr}</p>
      )}

      {/* Tags */}
      {tool.tags.length > 0 && !compact && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {tool.tags.slice(0, 3).map((t) => (
            <span key={t} className="rounded-full border border-white/8 bg-white/4 px-2 py-0.5 text-[11px] text-slate-500">{t}</span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/5 pt-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${badge.cls}`}>
            {badge.label}
            {tool.monthlyPrice && tool.pricing !== "free" ? ` · $${tool.monthlyPrice}` : ""}
          </span>
          {tool.arabicSupport && (
            <span className="rounded-full border border-teal-500/30 bg-teal-500/10 px-1.5 py-0.5 text-[10px] font-bold text-teal-400">عربي ✓</span>
          )}
          {tool.hasApi && (
            <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-400">API</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-600 shrink-0">
          <span>👁 {tool.viewCount.toLocaleString("ar-EG")}</span>
          {tool.likes > 0 && <span>♥ {tool.likes.toLocaleString("ar-EG")}</span>}
        </div>
      </div>
    </Link>
  );
}
