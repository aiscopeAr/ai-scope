"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "/admin":          "لوحة التحكم",
  "/admin/queue":    "طابور التقارير",
  "/admin/reviews":  "التقارير",
  "/admin/ai-tools": "أدوات AI",
  "/admin/sources":  "المصادر",
  "/admin/social":   "السوشيال ميديا",
  "/admin/authors":  "الكتّاب",
  "/admin/ads":      "الإعلانات",
};

function getTitle(pathname: string) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  // Match dynamic routes e.g. /admin/reviews/[id]
  for (const [key, val] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(key + "/")) return val;
  }
  return "الإدارة";
}

interface AdminHeaderProps {
  userName?: string | null;
  onMenuToggle?: () => void;
}

export default function AdminHeader({ userName, onMenuToggle }: AdminHeaderProps) {
  const pathname = usePathname();
  const title = getTitle(pathname);
  const now = new Intl.DateTimeFormat("ar-SA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date());

  return (
    <header className="flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-6" dir="rtl">
      {/* Mobile menu toggle */}
      {onMenuToggle && (
        <button onClick={onMenuToggle} className="lg:hidden -mr-1 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
          <Menu className="h-5 w-5" />
        </button>
      )}

      {/* Title */}
      <div>
        <h1 className="text-lg font-bold text-slate-900 leading-tight">{title}</h1>
        <p className="text-xs text-slate-400 leading-tight">{now}</p>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User badge */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
          {(userName?.[0] ?? "A").toUpperCase()}
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-semibold text-slate-800 leading-tight">{userName || "Admin"}</p>
          <p className="text-[11px] text-slate-400 leading-tight">مشرف</p>
        </div>
      </div>
    </header>
  );
}
