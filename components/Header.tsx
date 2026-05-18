import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#09090b]/90 backdrop-blur-xl" dir="rtl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">

          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-500 shadow-lg shadow-violet-500/30">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
              </svg>
            </div>
            <div>
              <span className="text-gradient text-lg font-black tracking-tight">AI Scope</span>
              <p className="text-[10px] text-slate-500 leading-none mt-0.5">نطاق الذكاء</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {[
              { href: "/", label: "الرئيسية" },
              { href: "/category/ai-models", label: "نماذج AI" },
              { href: "/category/research", label: "البحوث" },
              { href: "/category/companies", label: "الشركات" },
              { href: "/tools", label: "مكتبة Prompts" },
              { href: "/about", label: "من نحن" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/search"
              aria-label="بحث"
              className="mr-2 flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-400 transition hover:border-violet-500/50 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              بحث
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
