"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";

const primaryNav = [
  { href: "/", label: "الرئيسية" },
  { href: "/reviews", label: "التقارير" },
  { href: "/ai-tools", label: "أدوات AI" },
  { href: "/prompts", label: "البرومبتس" },
  { href: "/compare", label: "المقارنات" },
];

const moreNav = [
  { href: "/tools",        label: "أدوات",            icon: "✎" },
  { href: "/author/zayd",  label: "زيد",             icon: "✦" },
  { href: "/author/lina",  label: "لينا",             icon: "✦" },
  { href: "/author/tariq", label: "طارق",             icon: "✦" },
  { href: "/about",        label: "من نحن",           icon: "ℹ" },
  { href: "/contact",      label: "تواصل معنا",       icon: "✉" },
];

const allNavLinks = [...primaryNav, ...moreNav];

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen,   setMoreOpen]   = useState(false);

  const isMoreActive = moreNav.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
  );

  return (
    <header className="sticky top-0 z-50 border-b bg-[var(--bg-page)]" style={{ borderColor: "var(--border-subtle)" }} dir="rtl">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex h-14 items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="logo-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#6366f1"/>
                  <stop offset="100%" stopColor="#8b5cf6"/>
                </linearGradient>
              </defs>
              <rect width="32" height="32" rx="8" fill="url(#logo-grad)"/>
              {/* L shape */}
              <rect x="9" y="8" width="3.5" height="16" rx="1.5" fill="white"/>
              <rect x="9" y="20.5" width="10" height="3.5" rx="1.5" fill="white"/>
              {/* dot accent */}
              <circle cx="23" cy="10" r="2.5" fill="white" opacity="0.9"/>
            </svg>
            <div>
              <span className="font-sans text-base font-semibold tracking-tight transition-colors group-hover:text-indigo-500" style={{ color: "var(--text-primary)" }}>Lumiq</span>
              <p className="mt-px text-[10px] leading-none" style={{ color: "var(--text-muted)" }}>لوميك</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {primaryNav.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative px-3 py-1.5 text-[13px] font-sans transition-colors"
                  style={{ color: active ? "var(--accent)" : "var(--text-secondary)" }}
                >
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-3 bottom-0 h-px" style={{ backgroundColor: "var(--accent)" }} />
                  )}
                </Link>
              );
            })}

            {/* More dropdown */}
            <div className="relative">
              <button
                onClick={() => setMoreOpen((v) => !v)}
                onBlur={() => setTimeout(() => setMoreOpen(false), 150)}
                className="flex items-center gap-1 px-3 py-1.5 text-[13px] font-sans transition-colors"
                style={{ color: isMoreActive ? "var(--accent)" : "var(--text-secondary)" }}
              >
                المزيد
                <svg className={`h-3 w-3 transition-transform ${moreOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {moreOpen && (
                <div className="absolute end-0 top-full mt-1 w-44 rounded-[6px] border py-1 shadow-editorial" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-medium)" }}>
                  {moreNav.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-2.5 px-4 py-2 text-[13px] transition-colors"
                        style={{ color: active ? "var(--accent)" : "var(--text-secondary)", backgroundColor: active ? "var(--bg-subtle)" : "transparent" }}
                      >
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <ThemeToggle />

            {/* Search */}
            <Link
              href="/search"
              aria-label="بحث"
              className="ms-1 flex items-center gap-1.5 rounded-[6px] border px-3 py-1.5 text-[13px] transition-colors"
              style={{ borderColor: "var(--border-medium)", color: "var(--text-secondary)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"; (e.currentTarget as HTMLElement).style.color = "var(--accent)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-medium)"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              بحث
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center rounded-[6px] border md:hidden"
            style={{ borderColor: "var(--border-medium)", color: "var(--text-secondary)" }}
            aria-label={mobileOpen ? "إغلاق" : "فتح القائمة"}
          >
            {mobileOpen ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="border-t px-6 pb-4 pt-3 md:hidden" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-page)" }}>
          <div className="grid grid-cols-2 gap-1">
            {allNavLinks.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-[6px] px-3 py-3 text-[13px] font-sans transition-colors min-h-[44px] flex items-center"
                  style={{
                    color: active ? "var(--accent)" : "var(--text-secondary)",
                    backgroundColor: active ? "var(--bg-accent-soft)" : "transparent",
                  }}
                >
                  {"icon" in item && <span className="me-1 text-xs" style={{ color: "var(--text-muted)" }}>{(item as { icon: string }).icon}</span>}
                  {item.label}
                </Link>
              );
            })}
          </div>
          <Link
            href="/search"
            onClick={() => setMobileOpen(false)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-[6px] border py-2.5 text-[13px]"
            style={{ borderColor: "var(--border-medium)", color: "var(--text-secondary)" }}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            بحث
          </Link>
        </nav>
      )}
    </header>
  );
}
