"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const primaryNav = [
  { href: "/", label: "الرئيسية" },
  { href: "/category/ai-models", label: "نماذج AI" },
  { href: "/category/research", label: "البحوث" },
  { href: "/tools", label: "مكتبة Prompts" },
];

const moreNav = [
  { href: "/guides", label: "الأدلة", icon: "📚" },
  { href: "/ai-tools", label: "أدوات AI", icon: "🔧" },
  { href: "/companies", label: "الشركات", icon: "🏢" },
  { href: "/compare", label: "مقارنات", icon: "⚖️" },
  { href: "/about", label: "من نحن", icon: "ℹ️" },
];

const allNavLinks = [...primaryNav, ...moreNav];

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = moreNav.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
  );

  return (
    <header
      className="sticky top-0 z-50 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-2xl"
      dir="rtl"
    >
      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />

      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-500 shadow-lg shadow-violet-500/40 transition-shadow group-hover:shadow-violet-500/60">
              <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
              </svg>
            </div>
            <div>
              <span className="text-gradient text-lg font-black tracking-tight">AI Scope</span>
              <p className="text-[10px] leading-none mt-0.5 text-slate-500">نطاق الذكاء</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-0.5 md:flex">
            {primaryNav.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "text-white"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-2 bottom-0 h-px bg-gradient-to-r from-violet-500 to-blue-400 rounded-full" />
                  )}
                </Link>
              );
            })}

            {/* More dropdown */}
            <div className="relative">
              <button
                onClick={() => setMoreOpen((v) => !v)}
                onBlur={() => setTimeout(() => setMoreOpen(false), 150)}
                className={`relative flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isMoreActive ? "text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                المزيد
                <svg className={`h-3.5 w-3.5 transition-transform ${moreOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
                {isMoreActive && (
                  <span className="absolute inset-x-2 bottom-0 h-px bg-gradient-to-r from-violet-500 to-blue-400 rounded-full" />
                )}
              </button>

              {moreOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-white/10 bg-[#111116] py-1.5 shadow-xl shadow-black/40">
                  {moreNav.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                          active ? "text-white bg-white/5" : "text-slate-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Search */}
            <Link
              href="/search"
              aria-label="بحث"
              className="mr-2 flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-400 transition hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              بحث
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="flex md:hidden items-center justify-center w-9 h-9 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white transition"
            aria-label={mobileOpen ? "إغلاق القائمة" : "فتح القائمة"}
          >
            {mobileOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="border-t border-white/5 bg-[#0a0a0f] px-4 pb-4 pt-3 md:hidden">
          <div className="grid grid-cols-2 gap-1">
            {allNavLinks.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active ? "bg-violet-500/15 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {"icon" in item && <span className="ml-1">{(item as { icon: string }).icon}</span>}
                  {item.label}
                </Link>
              );
            })}
          </div>
          <Link
            href="/search"
            onClick={() => setMobileOpen(false)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 py-2.5 text-sm text-slate-400 hover:text-white transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            بحث
          </Link>
        </nav>
      )}
    </header>
  );
}
