"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t font-sans" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-subtle)" }} dir="rtl">
      <div className="container mx-auto px-6 py-12 md:px-12">
        <div className="grid gap-10 md:grid-cols-4">

          {/* Brand */}
          <div className="md:col-span-1">
            <div className="mb-4 flex items-center gap-2.5">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="footer-logo-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#6366f1"/>
                    <stop offset="100%" stopColor="#8b5cf6"/>
                  </linearGradient>
                </defs>
                <rect width="32" height="32" rx="8" fill="url(#footer-logo-grad)"/>
                <rect x="9" y="8" width="3.5" height="16" rx="1.5" fill="white"/>
                <rect x="9" y="20.5" width="10" height="3.5" rx="1.5" fill="white"/>
                <circle cx="23" cy="10" r="2.5" fill="white" opacity="0.9"/>
              </svg>
              <span className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Lumiq</span>
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

        {/* Telegram banner */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-[8px] px-6 py-4" style={{ background: "linear-gradient(135deg, #0088cc12, #0088cc06)", border: "1px solid #0088cc25" }}>
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0" fill="#0088cc"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 14.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z"/></svg>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              تابع آخر أخبار الذكاء الاصطناعي على قناة لوميك في تيليغرام
            </p>
          </div>
          <a
            href="https://t.me/lumiq_news"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-[6px] px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
            style={{ backgroundColor: "#0088cc" }}
          >
            انضم الآن
          </a>
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t pt-6 md:flex-row" style={{ borderColor: "var(--border-subtle)" }}>
          <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>© 2026 Lumiq. جميع الحقوق محفوظة.</p>
          <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>مبني على Next.js · محتوى آلي مع مراجعة تحريرية</p>
        </div>
      </div>
    </footer>
  );
}
