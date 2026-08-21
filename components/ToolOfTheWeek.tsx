import Image from "next/image";
import Link from "next/link";

interface Tool {
  slug: string;
  name: string;
  tagline: string | null;
  descriptionAr: string;
  logoUrl: string | null;
  pricing: string;
  monthlyPrice: number | null;
  arabicSupport: boolean;
  hasApi: boolean;
  tags: string[];
  viewCount: number;
  likes: number;
}

const PRICING_LABEL: Record<string, string> = {
  free: "مجاني",
  freemium: "مجاني + مدفوع",
  paid: "مدفوع",
};

export default function ToolOfTheWeek({ tool }: { tool: Tool }) {
  return (
    <>
      <div className="mb-7 flex items-end justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">⭐</span>
          <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            أداة الأسبوع
          </h2>
        </div>
        <Link href="/ai-tools" className="text-sm font-semibold transition hover-opacity" style={{ color: "var(--brand)" }}>
          جميع الأدوات ←
        </Link>
      </div>

      <Link href={`/ai-tools/${tool.slug}`} className="group block">
        <div
          className="overflow-hidden rounded-[14px] border transition-all duration-200 hover:-translate-y-0.5"
          style={{ borderColor: "color-mix(in srgb, var(--brand) 30%, transparent)", backgroundColor: "var(--brand-bg)" }}
        >
          <div className="grid md:grid-cols-[auto_1fr] gap-0">
            {/* Left accent bar */}
            <div className="hidden md:block w-1 rounded-r-none" style={{ backgroundColor: "var(--brand)" }} />

            <div className="flex flex-col sm:flex-row gap-6 p-6 md:p-7">
              {/* Logo */}
              <div className="shrink-0">
                {tool.logoUrl ? (
                  <div className="relative h-20 w-20 overflow-hidden rounded-[10px] border shadow-sm" style={{ borderColor: "var(--border-medium)", backgroundColor: "var(--bg-surface)" }}>
                    <Image src={tool.logoUrl} alt={tool.name} fill sizes="80px" className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-[10px] text-3xl font-black"
                    style={{ backgroundColor: "var(--bg-surface)", color: "var(--brand)" }}>
                    {tool.name[0]}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0" dir="rtl">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-bold transition-colors group-hover:opacity-80"
                    style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                    {tool.name}
                  </h3>
                  <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                    style={{ backgroundColor: "var(--brand)", color: "#ffffff" }}>
                    اختيار المحرر ★
                  </span>
                </div>

                {tool.tagline && (
                  <p className="mb-2 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{tool.tagline}</p>
                )}

                <p className="mb-4 text-sm leading-relaxed line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                  {tool.descriptionAr}
                </p>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-[3px] border px-2.5 py-1 text-xs font-semibold"
                    style={{ borderColor: "var(--border-medium)", color: "var(--text-secondary)", backgroundColor: "var(--bg-subtle)" }}>
                    {PRICING_LABEL[tool.pricing] ?? tool.pricing}
                    {tool.monthlyPrice && tool.pricing !== "free" ? ` · $${tool.monthlyPrice}/شهر` : ""}
                  </span>
                  {tool.arabicSupport && (
                    <span className="rounded-[3px] border px-2 py-1 text-xs font-bold"
                      style={{ backgroundColor: "#f0fdfa", color: "#0d9488", borderColor: "#99f6e4" }}>
                      يدعم العربية ✓
                    </span>
                  )}
                  {tool.hasApi && (
                    <span className="rounded-[3px] border px-2 py-1 text-xs font-bold"
                      style={{ backgroundColor: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe" }}>
                      API متاح
                    </span>
                  )}
                  {tool.tags.slice(0, 2).map((t) => (
                    <span key={t} className="rounded-[3px] border px-2 py-0.5 text-[11px]"
                      style={{ borderColor: "var(--border-medium)", color: "var(--text-muted)", backgroundColor: "var(--bg-subtle)" }}>
                      {t}
                    </span>
                  ))}
                  <span className="mr-auto text-xs" style={{ color: "var(--text-muted)" }}>
                    👁 {tool.viewCount.toLocaleString("ar-EG")}
                    {tool.likes > 0 && ` · ♥ ${tool.likes.toLocaleString("ar-EG")}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </>
  );
}
