import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t font-sans" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-subtle)" }} dir="rtl">
      <div className="container mx-auto px-6 py-12 md:px-12">
        <div className="grid gap-10 md:grid-cols-4">

          {/* Brand */}
          <div className="md:col-span-1">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-[6px]" style={{ backgroundColor: "var(--accent)" }}>
                <span className="font-serif text-lg font-bold leading-none" style={{ color: "var(--text-on-accent)" }}>ن</span>
              </div>
              <span className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>AI Scope</span>
            </div>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              منصة عربية متخصصة في أخبار وتحليلات الذكاء الاصطناعي، مع دليل أدوات ومقارنات تحريرية تساعد القارئ العربي على الفهم والاختيار.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>روابط سريعة</h3>
            <ul className="space-y-2.5">
              {[
                { href: "/",        label: "الرئيسية" },
                { href: "/reviews", label: "التقارير" },
                { href: "/ai-tools",label: "أدوات AI" },
                { href: "/compare", label: "المقارنات" },
                { href: "/search",  label: "البحث" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="group flex items-center gap-2 text-[13px] transition-colors"
                    style={{ color: "var(--text-secondary)" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--accent)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"}
                  >
                    <span className="h-px w-2.5 transition-colors" style={{ backgroundColor: "var(--border-medium)" }} />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>التصنيفات</h3>
            <ul className="space-y-2.5">
              {[
                { href: "/category/ai-models",    label: "نماذج AI" },
                { href: "/category/research",      label: "البحوث" },
                { href: "/category/ai-companies",  label: "الشركات" },
                { href: "/category/ai-tools",      label: "الأدوات" },
                { href: "/category/ai-policy",     label: "السياسات" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="group flex items-center gap-2 text-[13px] transition-colors"
                    style={{ color: "var(--text-secondary)" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--accent)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"}
                  >
                    <span className="h-px w-2.5" style={{ backgroundColor: "var(--border-medium)" }} />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Site + status */}
          <div>
            <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>الموقع</h3>
            <ul className="space-y-2.5">
              {[
                { href: "/about",   label: "من نحن" },
                { href: "/contact", label: "تواصل معنا" },
                { href: "/privacy", label: "سياسة الخصوصية" },
                { href: "/terms",   label: "الشروط والأحكام" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="flex items-center gap-2 text-[13px] transition-colors"
                    style={{ color: "var(--text-secondary)" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--accent)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"}
                  >
                    <span className="h-px w-2.5" style={{ backgroundColor: "var(--border-medium)" }} />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-[6px] border p-3" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ backgroundColor: "#16a34a" }} />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#16a34a" }} />
                </span>
                <span className="text-[11px] font-semibold" style={{ color: "#16a34a" }}>النظام يعمل</span>
              </div>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>تحديث تلقائي يومي للمحتوى.</p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t pt-6 md:flex-row" style={{ borderColor: "var(--border-subtle)" }}>
          <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>© 2026 AI Scope. جميع الحقوق محفوظة.</p>
          <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>مبني على Next.js · محتوى آلي مع مراجعة تحريرية</p>
        </div>
      </div>
    </footer>
  );
}
