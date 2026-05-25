import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-white/5 bg-gradient-to-b from-[#09090b] to-[#0d0d14]" dir="rtl">
      <div className="h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-500 shadow-lg shadow-violet-500/30">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
                </svg>
              </div>
              <div>
                <span className="text-gradient text-lg font-black">AI Scope</span>
                <p className="mt-0.5 text-[10px] leading-none text-slate-600">نطاق الذكاء الاصطناعي</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-500">
              منصة عربية متخصصة في أخبار وتحليلات الذكاء الاصطناعي، مع دليل أدوات ومقارنات تحريرية تساعد القارئ العربي على الفهم والاختيار.
            </p>
          </div>

          <div>
            <h3 className="mb-5 text-xs font-bold uppercase tracking-wider text-slate-500">روابط سريعة</h3>
            <ul className="space-y-3">
              {[
                { href: "/", label: "الرئيسية" },
                { href: "/reviews", label: "التقارير" },
                { href: "/ai-tools", label: "أدوات AI" },
                { href: "/compare", label: "المقارنات" },
                { href: "/search", label: "البحث" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="group flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-violet-400">
                    <span className="h-px w-3 bg-slate-700 transition-colors group-hover:bg-violet-500" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-5 text-xs font-bold uppercase tracking-wider text-slate-500">التصنيفات</h3>
            <ul className="space-y-3">
              {[
                { href: "/category/ai-models", label: "نماذج AI" },
                { href: "/category/research", label: "البحوث" },
                { href: "/category/ai-companies", label: "الشركات" },
                { href: "/category/ai-tools", label: "الأدوات" },
                { href: "/category/ai-policy", label: "السياسات" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="group flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-violet-400">
                    <span className="h-px w-3 bg-slate-700 transition-colors group-hover:bg-violet-500" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-5 text-xs font-bold uppercase tracking-wider text-slate-500">الموقع</h3>
            <ul className="space-y-3">
              {[
                { href: "/about", label: "من نحن" },
                { href: "/contact", label: "تواصل معنا" },
                { href: "/privacy", label: "سياسة الخصوصية" },
                { href: "/terms", label: "الشروط والأحكام" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="group flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-violet-400">
                    <span className="h-px w-3 bg-slate-700 transition-colors group-hover:bg-violet-500" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-xl border border-white/6 bg-white/3 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <span className="text-xs font-semibold text-emerald-400">النظام يعمل</span>
              </div>
              <p className="text-xs text-slate-600">الروابط العامة، السايتماپ، ومحركات البحث أصبحت ضمن هيكل موحد وواضح.</p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 md:flex-row">
          <p className="text-sm text-slate-600">© 2026 AI Scope. جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span>مبني على</span>
            <span className="text-violet-400">Next.js 16</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
