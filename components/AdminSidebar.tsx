"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  ClipboardList,
  BookOpen,
  Rss,
  Share2,
  Wrench,
  Users,
  Megaphone,
  Activity,
  BarChart2,
  LogOut,
  ExternalLink,
  ChevronRight,
  GitCompare,
  Mail,
  Zap,
} from "lucide-react";

const NAV = [
  { href: "/admin",              icon: LayoutDashboard, label: "لوحة التحكم",   end: true },
  { href: "/admin/pipeline",     icon: Zap,             label: "Pipeline"       },
  { href: "/admin/queue",        icon: ClipboardList,   label: "طابور التقارير" },
  { href: "/admin/reviews",      icon: BookOpen,        label: "التقارير"       },
  { href: "/admin/ai-tools",     icon: Wrench,          label: "أدوات AI"       },
  { href: "/admin/comparisons",  icon: GitCompare,      label: "المقارنات"      },
  { href: "/admin/analytics",    icon: BarChart2,       label: "الإحصاءات"      },
  { href: "/admin/newsletter",   icon: Mail,            label: "النشرة البريدية"},
  { href: "/admin/sources",      icon: Rss,             label: "المصادر"        },
  { href: "/admin/social",       icon: Share2,          label: "السوشيال ميديا" },
  { href: "/admin/authors",      icon: Users,           label: "الكتّاب"        },
  { href: "/admin/ads",          icon: Megaphone,       label: "الإعلانات"      },
  { href: "/status",             icon: Activity,        label: "حالة النظام",   external: true },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  function isActive(href: string, end?: boolean) {
    if (end) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className="flex h-full w-60 flex-col bg-slate-900" dir="rtl">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-5">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="sidebar-logo-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6366f1"/>
              <stop offset="100%" stopColor="#8b5cf6"/>
            </linearGradient>
          </defs>
          <rect width="32" height="32" rx="8" fill="url(#sidebar-logo-grad)"/>
          <rect x="9" y="8" width="3.5" height="16" rx="1.5" fill="white"/>
          <rect x="9" y="20.5" width="10" height="3.5" rx="1.5" fill="white"/>
          <circle cx="23" cy="10" r="2.5" fill="white" opacity="0.9"/>
        </svg>
        <div>
          <p className="text-sm font-bold text-white leading-tight">Lumiq</p>
          <p className="text-[10px] text-slate-500 leading-tight">لوحة الإدارة</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV.map((item) => {
          const active = isActive(item.href, item.end);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.external
                ? <ExternalLink className="h-3 w-3 opacity-40" />
                : active
                  ? <ChevronRight className="h-3 w-3 opacity-60" />
                  : null
              }
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800 p-3 space-y-1">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-800 hover:text-white"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          <span>عرض الموقع</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
