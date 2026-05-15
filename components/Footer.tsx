import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-white/5 bg-[#09090b]" dir="rtl">
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-12 md:grid-cols-4">

          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-500 shadow-lg shadow-violet-500/30">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
                </svg>
              </div>
              <span className="text-gradient text-lg font-black">AI Scope</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-500">
              منصة عربية متخصصة في أخبار الذكاء الاصطناعي — نغطي أحدث التطورات في عالم AI يومياً.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">روابط</h3>
            <ul className="space-y-2.5">
              {[
                { href: "/", label: "الرئيسية" },
                { href: "/about", label: "من نحن" },
                { href: "/contact", label: "اتصل بنا" },
                { href: "/search", label: "البحث" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-slate-500 transition hover:text-violet-400">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">التصنيفات</h3>
            <ul className="space-y-2.5">
              {[
                { href: "/category/ai-models", label: "نماذج AI" },
                { href: "/category/research", label: "البحوث" },
                { href: "/category/companies", label: "الشركات" },
                { href: "/category/tools", label: "الأدوات" },
                { href: "/category/policy", label: "السياسات" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-slate-500 transition hover:text-violet-400">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">قانوني</h3>
            <ul className="space-y-2.5">
              {[
                { href: "/privacy", label: "سياسة الخصوصية" },
                { href: "/terms", label: "الشروط والأحكام" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-slate-500 transition hover:text-violet-400">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 md:flex-row">
          <p className="text-sm text-slate-600">© 2026 AI Scope — نطاق الذكاء الاصطناعي. جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-slate-600">يتم التحديث يومياً بالذكاء الاصطناعي</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
