import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-white/5 bg-gradient-to-b from-[#09090b] to-[#0d0d14]" dir="rtl">
      {/* Top accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-12 md:grid-cols-4">

          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-500 shadow-lg shadow-violet-500/30">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
                </svg>
              </div>
              <div>
                <span className="text-gradient text-lg font-black">AI Scope</span>
                <p className="text-[10px] leading-none mt-0.5 text-slate-600">نطاق الذكاء الاصطناعي</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-500">
              منصة عربية متخصصة في أخبار الذكاء الاصطناعي — نغطي أحدث التطورات في عالم AI يومياً.
            </p>
            {/* Social links placeholder */}
            <div className="mt-5 flex gap-2">
              {["𝕏", "📱", "📢"].map((icon, i) => (
                <div key={i} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 bg-white/4 text-sm text-slate-500 transition hover:border-violet-500/40 hover:text-violet-400 cursor-pointer">
                  {icon}
                </div>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-5 text-xs font-bold uppercase tracking-wider text-slate-500">روابط سريعة</h3>
            <ul className="space-y-3">
              {[
                { href: "/", label: "الرئيسية" },
                { href: "/tools", label: "مكتبة Prompts" },
                { href: "/about", label: "من نحن" },
                { href: "/contact", label: "اتصل بنا" },
                { href: "/search", label: "البحث" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-slate-500 transition hover:text-violet-400 flex items-center gap-1.5 group">
                    <span className="h-px w-3 bg-slate-700 group-hover:bg-violet-500 transition-colors" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="mb-5 text-xs font-bold uppercase tracking-wider text-slate-500">التصنيفات</h3>
            <ul className="space-y-3">
              {[
                { href: "/category/ai-models", label: "نماذج AI" },
                { href: "/category/research", label: "البحوث" },
                { href: "/category/companies", label: "الشركات" },
                { href: "/category/tools", label: "الأدوات" },
                { href: "/category/policy", label: "السياسات" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-slate-500 transition hover:text-violet-400 flex items-center gap-1.5 group">
                    <span className="h-px w-3 bg-slate-700 group-hover:bg-violet-500 transition-colors" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal + status */}
          <div>
            <h3 className="mb-5 text-xs font-bold uppercase tracking-wider text-slate-500">قانوني</h3>
            <ul className="space-y-3">
              {[
                { href: "/privacy", label: "سياسة الخصوصية" },
                { href: "/terms", label: "الشروط والأحكام" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-slate-500 transition hover:text-violet-400 flex items-center gap-1.5 group">
                    <span className="h-px w-3 bg-slate-700 group-hover:bg-violet-500 transition-colors" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Status card */}
            <div className="mt-8 rounded-xl border border-white/6 bg-white/3 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <span className="text-xs font-semibold text-emerald-400">النظام يعمل</span>
              </div>
              <p className="text-xs text-slate-600">يتم التحديث يومياً بالذكاء الاصطناعي</p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 md:flex-row">
          <p className="text-sm text-slate-600">© 2026 AI Scope — نطاق الذكاء الاصطناعي. جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span>صُنع بـ</span>
            <span className="text-violet-400">AI</span>
            <span>·</span>
            <span>مدعوم بـ Next.js</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
