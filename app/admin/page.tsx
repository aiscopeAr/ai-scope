import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ClipboardList,
  Rss,
  Megaphone,
  Eye,
  ArrowLeft,
  Bot,
  Share2,
  Wrench,
  BookOpen,
} from "lucide-react";

import AdminSignOutButton from "@/components/AdminSignOutButton";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const [
    reviewCount,
    publishedCount,
    publishedToday,
    recentReviews,
    topReviews,
    pendingQueue,
    processedQueue,
    failedQueue,
    pendingNewsItems,
    totalViews,
    activeAds,
    activeSocialAccounts,
    pendingSocialPosts,
    toolCount,
    trendingKeywords,
  ] = await Promise.all([
    prisma.review.count(),
    prisma.review.count({ where: { published: true } }),
    prisma.review.count({ where: { published: true, publishedAt: { gte: todayStart } } }),
    prisma.review.findMany({
      orderBy: { publishedAt: "desc" },
      take: 8,
      select: {
        id: true,
        titleAr: true,
        slug: true,
        published: true,
        publishedAt: true,
        authorSlug: true,
        category: { select: { nameAr: true } },
      },
    }),
    prisma.review.findMany({
      where: { published: true },
      orderBy: { viewCount: "desc" },
      take: 5,
      select: { id: true, titleAr: true, slug: true, viewCount: true, authorSlug: true },
    }),
    prisma.reviewQueue.count({ where: { status: "pending" } }),
    prisma.reviewQueue.count({ where: { status: "processed" } }),
    prisma.reviewQueue.count({ where: { status: "failed" } }),
    prisma.newsItem.count({ where: { status: "pending" } }),
    prisma.review.aggregate({ _sum: { viewCount: true } }),
    prisma.adSlot.count({ where: { enabled: true } }),
    prisma.socialAccount.count({ where: { enabled: true } }),
    prisma.socialPost.count({ where: { status: "pending" } }),
    prisma.aITool.count({ where: { published: true } }),
    prisma.trendingKeyword.findMany({ orderBy: { count: "desc" }, take: 12 }),
  ]);

  return {
    reviewCount, publishedCount, publishedToday,
    recentReviews, topReviews,
    pendingQueue, processedQueue, failedQueue, pendingNewsItems,
    totalViews: totalViews._sum.viewCount ?? 0,
    activeAds, activeSocialAccounts, pendingSocialPosts,
    toolCount, trendingKeywords,
  };
}

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const data = await getDashboardData();

  const navCards = [
    {
      href: "/admin/queue",
      icon: ClipboardList,
      label: "طابور التقارير",
      sub: `${data.processedQueue} جاهز · ${data.failedQueue} فشل`,
      value: data.pendingQueue,
      valueLabel: "معلّق",
      color: "amber",
      urgent: data.processedQueue > 0 || data.failedQueue > 0,
    },
    {
      href: "/admin/reviews",
      icon: BookOpen,
      label: "التقارير",
      sub: `${data.publishedCount} منشورة`,
      value: data.reviewCount,
      valueLabel: "تقرير",
      color: "violet",
    },
    {
      href: "/admin/sources",
      icon: Rss,
      label: "المصادر",
      sub: `${data.pendingNewsItems} خبر جديد`,
      value: null,
      valueLabel: "",
      color: "sky",
    },
    {
      href: "/admin/social",
      icon: Share2,
      label: "السوشيال ميديا",
      sub: `${data.activeSocialAccounts} حساب نشط`,
      value: data.pendingSocialPosts,
      valueLabel: "بانتظار النشر",
      color: "pink",
      urgent: data.pendingSocialPosts > 0,
    },
    {
      href: "/admin/ai-tools",
      icon: Wrench,
      label: "أدوات AI",
      sub: "دليل الأدوات",
      value: data.toolCount,
      valueLabel: "أداة",
      color: "cyan",
    },
    {
      href: "/admin/ads",
      icon: Megaphone,
      label: "الإعلانات",
      sub: "إدارة حريز الإعلانات",
      value: data.activeAds,
      valueLabel: "مفعّل",
      color: "emerald",
    },
  ];

  const colorMap: Record<string, { card: string; icon: string; badge: string }> = {
    violet:  { card: "bg-violet-50 hover:bg-violet-100 border-violet-100",   icon: "bg-violet-500/10  text-violet-600",  badge: "bg-violet-100  text-violet-700"  },
    amber:   { card: "bg-amber-50  hover:bg-amber-100  border-amber-100",    icon: "bg-amber-500/10   text-amber-600",   badge: "bg-amber-100   text-amber-700"   },
    sky:     { card: "bg-sky-50    hover:bg-sky-100    border-sky-100",      icon: "bg-sky-500/10     text-sky-600",     badge: "bg-sky-100     text-sky-700"     },
    emerald: { card: "bg-emerald-50 hover:bg-emerald-100 border-emerald-100", icon: "bg-emerald-500/10 text-emerald-600", badge: "bg-emerald-100 text-emerald-700" },
    pink:    { card: "bg-pink-50   hover:bg-pink-100   border-pink-100",     icon: "bg-pink-500/10    text-pink-600",    badge: "bg-pink-100    text-pink-700"    },
    cyan:    { card: "bg-cyan-50   hover:bg-cyan-100   border-cyan-100",     icon: "bg-cyan-500/10    text-cyan-600",    badge: "bg-cyan-100    text-cyan-700"    },
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
          { label: "إجمالي التقارير", value: data.reviewCount, sub: `${data.publishedCount} منشورة` },
          { label: "نُشر اليوم", value: data.publishedToday, sub: "منذ منتصف الليل", highlight: data.publishedToday > 0 },
          { label: "في الطابور", value: data.pendingQueue + data.processedQueue, sub: data.failedQueue > 0 ? `${data.failedQueue} فشل` : "لا أخطاء", urgent: data.failedQueue > 0 },
          { label: "مشاهدات إجمالية", value: data.totalViews.toLocaleString("ar-EG"), sub: `${data.pendingNewsItems} خبر جديد` },
        ].map((s) => (
          <div key={s.label} className={`rounded-[1.5rem] bg-white p-4 shadow-md shadow-slate-200/60 ${(s as {urgent?: boolean}).urgent ? "ring-2 ring-red-400" : ""}`}>
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className={`mt-2 text-2xl font-black ${(s as {highlight?: boolean}).highlight ? "text-emerald-600" : (s as {urgent?: boolean}).urgent ? "text-red-600" : "text-slate-900"}`}>{s.value}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">{s.sub}</p>
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
              className={`group relative flex items-center gap-4 rounded-[1.75rem] border p-5 transition ${c.card} ${(card as {urgent?: boolean}).urgent ? "ring-2 ring-amber-400" : ""}`}
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
              {(card as {urgent?: boolean}).urgent && (
                <span className="absolute -top-1.5 -left-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-white">!</span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom grid */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Queue status */}
        <div className="rounded-[2rem] bg-white p-6 shadow-lg shadow-slate-200/60">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-black text-slate-900">حالة الطابور</h2>
            <Link href="/admin/queue" className="text-xs font-semibold text-[#667eea] hover:underline">فتح الطابور</Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "أخبار جديدة", value: data.pendingNewsItems, color: "bg-sky-50 text-sky-700 border-sky-100" },
              { label: "جاهز للمراجعة", value: data.processedQueue, color: "bg-violet-50 text-violet-700 border-violet-100" },
              { label: "فشل", value: data.failedQueue, color: data.failedQueue > 0 ? "bg-red-50 text-red-700 border-red-200 ring-1 ring-red-300" : "bg-slate-50 text-slate-400 border-slate-100" },
            ].map((q) => (
              <div key={q.label} className={`rounded-2xl border p-4 text-center ${q.color}`}>
                <p className="text-3xl font-black">{q.value}</p>
                <p className="mt-1 text-[11px] font-semibold leading-tight">{q.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trending keywords */}
        <div className="rounded-[2rem] bg-white p-6 shadow-lg shadow-slate-200/60">
          <h2 className="mb-4 font-black text-slate-900">الكلمات الرائجة</h2>
          {data.trendingKeywords.length === 0 ? (
            <p className="text-sm text-slate-400">لا توجد بيانات بعد</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {data.trendingKeywords.map((kw, i) => (
                <span
                  key={kw.id}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-semibold ${
                    i === 0 ? "bg-[#667eea] text-white text-base" :
                    i < 3 ? "bg-[#667eea]/10 text-[#667eea] text-sm" :
                    "bg-slate-100 text-slate-600 text-xs"
                  }`}
                >
                  {kw.keyword}<span className="opacity-60">·{kw.count}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Top reviews */}
        <div className="rounded-[2rem] bg-white p-6 shadow-lg shadow-slate-200/60">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-black text-slate-900">الأكثر مشاهدة</h2>
            <Link href="/admin/reviews" className="text-xs font-semibold text-[#667eea] hover:underline">عرض الكل</Link>
          </div>
          <ol className="space-y-3">
            {data.topReviews.map((r, i) => (
              <li key={r.id} className="flex items-center gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#667eea]/10 text-xs font-black text-[#667eea]">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <a href={`/reviews/${r.slug}`} target="_blank" rel="noopener noreferrer" className="block truncate text-sm font-semibold text-slate-800 hover:text-[#667eea]">{r.titleAr}</a>
                  <p className="text-xs text-slate-400">{r.authorSlug}</p>
                </div>
                <span className="flex-shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">{r.viewCount.toLocaleString("ar-EG")}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Recent reviews */}
        <div className="rounded-[2rem] bg-white p-6 shadow-lg shadow-slate-200/60">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-black text-slate-900">آخر التقارير</h2>
            <Link href="/admin/reviews" className="text-xs font-semibold text-[#667eea] hover:underline">عرض الكل</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {data.recentReviews.map((r) => (
              <div key={r.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{r.titleAr}</p>
                  <p className="text-xs text-slate-400">{r.category.nameAr} · {r.authorSlug}</p>
                </div>
                <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${r.published ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  {r.published ? "منشورة" : "مسودة"}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
