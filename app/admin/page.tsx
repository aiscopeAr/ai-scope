import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import {
  FileText,
  Rss,
  ClipboardList,
  Megaphone,
  Eye,
  PlusCircle,
  ArrowLeft,
  Bot,
} from "lucide-react";

import AdminSignOutButton from "@/components/AdminSignOutButton";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const [
    articleCount,
    publishedCount,
    recentArticles,
    topArticles,
    categories,
    sources,
    settings,
    pendingQueue,
    totalViews,
    activeAds,
  ] = await Promise.all([
    prisma.article.count(),
    prisma.article.count({ where: { published: true } }),
    prisma.article.findMany({
      orderBy: { publishedAt: "desc" },
      take: 8,
      include: { category: true },
    }),
    prisma.article.findMany({
      where: { published: true },
      orderBy: { viewCount: "desc" },
      take: 5,
      select: { id: true, titleAr: true, slug: true, viewCount: true, sourceName: true },
    }),
    prisma.category.count(),
    prisma.source.count(),
    prisma.settings.findFirst(),
    prisma.articleQueue.count({ where: { status: { in: ["pending", "processed"] } } }),
    prisma.article.aggregate({ _sum: { viewCount: true } }),
    prisma.adSlot.count({ where: { enabled: true } }),
  ]);

  return {
    articleCount,
    publishedCount,
    recentArticles,
    topArticles,
    categories,
    sources,
    settings,
    pendingQueue,
    totalViews: totalViews._sum.viewCount ?? 0,
    activeAds,
  };
}

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const data = await getDashboardData();

  const navCards = [
    {
      href: "/admin/articles",
      icon: FileText,
      label: "المقالات",
      sub: "إدارة وتعديل المحتوى",
      value: data.articleCount,
      valueLabel: "مقال",
      color: "violet",
    },
    {
      href: "/admin/queue",
      icon: ClipboardList,
      label: "طابور المراجعة",
      sub: "موافقة ورفض الكتابات",
      value: data.pendingQueue,
      valueLabel: "بانتظار",
      color: "amber",
      urgent: data.pendingQueue > 0,
    },
    {
      href: "/admin/sources",
      icon: Rss,
      label: "المصادر",
      sub: "إدارة مصادر RSS",
      value: data.sources,
      valueLabel: "مصدر",
      color: "sky",
    },
    {
      href: "/admin/ads",
      icon: Megaphone,
      label: "الإعلانات",
      sub: "إدارة حريز الإعلانات",
      value: data.activeAds,
      valueLabel: "إعلان مفعّل",
      color: "emerald",
    },
    {
      href: "/admin/articles?sortBy=viewCount&sortOrder=desc",
      icon: Eye,
      label: "الأكثر مشاهدة",
      sub: "ترتيب حسب الزيارات",
      value: data.totalViews.toLocaleString("ar-EG"),
      valueLabel: "مشاهدة إجمالية",
      color: "rose",
    },
    {
      href: "/admin/articles/new",
      icon: PlusCircle,
      label: "مقال جديد",
      sub: "إنشاء مقال يدوياً",
      value: null,
      valueLabel: "",
      color: "slate",
    },
  ];

  const colorMap: Record<string, { card: string; icon: string; badge: string }> = {
    violet: { card: "bg-violet-50 hover:bg-violet-100 border-violet-100", icon: "bg-violet-500/10 text-violet-600", badge: "bg-violet-100 text-violet-700" },
    amber:  { card: "bg-amber-50  hover:bg-amber-100  border-amber-100",  icon: "bg-amber-500/10  text-amber-600",  badge: "bg-amber-100  text-amber-700"  },
    sky:    { card: "bg-sky-50    hover:bg-sky-100    border-sky-100",    icon: "bg-sky-500/10    text-sky-600",    badge: "bg-sky-100    text-sky-700"    },
    emerald:{ card: "bg-emerald-50 hover:bg-emerald-100 border-emerald-100", icon: "bg-emerald-500/10 text-emerald-600", badge: "bg-emerald-100 text-emerald-700" },
    rose:   { card: "bg-rose-50   hover:bg-rose-100   border-rose-100",   icon: "bg-rose-500/10   text-rose-600",   badge: "bg-rose-100   text-rose-700"   },
    slate:  { card: "bg-slate-50  hover:bg-slate-100  border-slate-100",  icon: "bg-slate-200     text-slate-600",  badge: "bg-slate-200  text-slate-600"  },
  };

  return (
    <section className="container mx-auto px-4 py-8" dir="rtl">

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 rounded-[2rem] bg-white p-6 shadow-lg shadow-slate-200/60 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#667eea]/10">
            <Bot className="size-6 text-[#667eea]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#667eea]">لوحة الإدارة</p>
            <h1 className="text-2xl font-black text-slate-900">مرحبًا {session.user?.name || "Admin"}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
            عرض الموقع
          </Link>
          <AdminSignOutButton />
        </div>
      </div>

      {/* Stats strip */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "إجمالي المقالات", value: data.articleCount },
          { label: "منشور", value: data.publishedCount },
          { label: "التصنيفات", value: data.categories },
          { label: "النشر التلقائي", value: data.settings?.autoPublish ? "مفعّل" : "متوقف" },
        ].map((s) => (
          <div key={s.label} className="rounded-[1.5rem] bg-white p-4 shadow-md shadow-slate-200/60">
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Navigation cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {navCards.map((card) => {
          const c = colorMap[card.color];
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className={`group relative flex items-center gap-4 rounded-[1.75rem] border p-5 transition ${c.card} ${card.urgent ? "ring-2 ring-amber-400" : ""}`}
            >
              <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${c.icon}`}>
                <Icon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-black text-slate-800">{card.label}</p>
                <p className="text-xs text-slate-500">{card.sub}</p>
                {card.value !== null && (
                  <span className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${c.badge}`}>
                    {card.value} {card.valueLabel}
                  </span>
                )}
              </div>
              <ArrowLeft className="size-4 flex-shrink-0 text-slate-300 transition group-hover:text-slate-500 group-hover:-translate-x-1" />
              {card.urgent && (
                <span className="absolute -top-1.5 -left-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-white">
                  !
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom grid: top articles + recent articles */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">

        {/* Top articles by views */}
        <div className="rounded-[2rem] bg-white p-6 shadow-lg shadow-slate-200/60">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-black text-slate-900">الأكثر مشاهدة</h2>
            <Link href="/admin/articles?sortBy=viewCount&sortOrder=desc" className="text-xs font-semibold text-[#667eea] hover:underline">
              عرض الكل
            </Link>
          </div>
          {data.topArticles.length === 0 ? (
            <p className="text-sm text-slate-400">لا توجد مشاهدات بعد</p>
          ) : (
            <ol className="space-y-3">
              {data.topArticles.map((article, i) => (
                <li key={article.id} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#667eea]/10 text-xs font-black text-[#667eea]">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <a
                      href={`/news/${article.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-sm font-semibold text-slate-800 hover:text-[#667eea]"
                    >
                      {article.titleAr}
                    </a>
                    <p className="text-xs text-slate-400">{article.sourceName}</p>
                  </div>
                  <span className="flex-shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                    {article.viewCount.toLocaleString("ar-EG")}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Recent articles */}
        <div className="rounded-[2rem] bg-white p-6 shadow-lg shadow-slate-200/60">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-black text-slate-900">آخر المقالات</h2>
            <Link href="/admin/articles" className="text-xs font-semibold text-[#667eea] hover:underline">
              عرض الكل
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {data.recentArticles.map((article) => (
              <div key={article.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{article.titleAr}</p>
                  <p className="text-xs text-slate-400">
                    {article.category.nameAr} · {article.publishedAt ? format(new Date(article.publishedAt), "yyyy-MM-dd") : "—"}
                  </p>
                </div>
                <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${article.published ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  {article.published ? "منشور" : "مسودة"}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
