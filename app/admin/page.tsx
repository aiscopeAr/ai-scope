import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ClipboardList, BookOpen, Rss, Share2, Wrench,
  Users, Megaphone, TrendingUp, Eye, FileText,
  AlertTriangle, CheckCircle2, Clock, ArrowUpRight, Mail,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const [
    reviewCount, publishedCount, publishedToday,
    recentReviews, topReviews,
    pendingQueue, processedQueue, failedQueue, pendingNewsItems,
    totalViews, activeAds, activeSocialAccounts, pendingSocialPosts,
    toolCount, trendingKeywords, newsletterCount,
  ] = await Promise.all([
    prisma.review.count(),
    prisma.review.count({ where: { published: true } }),
    prisma.review.count({ where: { published: true, publishedAt: { gte: todayStart } } }),
    prisma.review.findMany({
      orderBy: { publishedAt: "desc" }, take: 8,
      select: { id: true, titleAr: true, slug: true, published: true, publishedAt: true, authorSlug: true, category: { select: { nameAr: true } } },
    }),
    prisma.review.findMany({
      where: { published: true }, orderBy: { viewCount: "desc" }, take: 5,
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
    prisma.trendingKeyword.findMany({ orderBy: { count: "desc" }, take: 10 }),
    prisma.newsletterSubscriber.count({ where: { status: "active" } }),
  ]);

  return {
    reviewCount, publishedCount, publishedToday,
    recentReviews, topReviews,
    pendingQueue, processedQueue, failedQueue, pendingNewsItems,
    totalViews: totalViews._sum.viewCount ?? 0,
    activeAds, activeSocialAccounts, pendingSocialPosts,
    toolCount, trendingKeywords, newsletterCount,
  };
}

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const d = await getDashboardData();

  const stats = [
    {
      label: "إجمالي التقارير",
      value: d.reviewCount,
      sub: `${d.publishedCount} منشورة`,
      icon: FileText,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "نُشر اليوم",
      value: d.publishedToday,
      sub: "منذ منتصف الليل UTC",
      icon: CheckCircle2,
      color: d.publishedToday > 0 ? "text-emerald-600" : "text-slate-400",
      bg: d.publishedToday > 0 ? "bg-emerald-50" : "bg-slate-50",
    },
    {
      label: "في الطابور",
      value: d.pendingQueue + d.processedQueue,
      sub: d.failedQueue > 0 ? `⚠ ${d.failedQueue} فشل` : "لا أخطاء",
      icon: d.failedQueue > 0 ? AlertTriangle : Clock,
      color: d.failedQueue > 0 ? "text-red-600" : "text-amber-600",
      bg: d.failedQueue > 0 ? "bg-red-50" : "bg-amber-50",
      alert: d.failedQueue > 0,
    },
    {
      label: "إجمالي المشاهدات",
      value: d.totalViews.toLocaleString("ar-EG"),
      sub: `${d.pendingNewsItems} خبر جديد`,
      icon: Eye,
      color: "text-sky-600",
      bg: "bg-sky-50",
    },
  ];

  const quickLinks = [
    { href: "/admin/queue",    icon: ClipboardList, label: "طابور التقارير",  badge: d.processedQueue > 0 ? `${d.processedQueue} جاهز` : null,   badgeColor: "bg-violet-100 text-violet-700", alert: d.failedQueue > 0 },
    { href: "/admin/reviews",  icon: BookOpen,      label: "التقارير",         badge: `${d.publishedCount}`,                                        badgeColor: "bg-slate-100 text-slate-600"   },
    { href: "/admin/ai-tools", icon: Wrench,        label: "أدوات AI",         badge: `${d.toolCount}`,                                             badgeColor: "bg-cyan-100 text-cyan-700"     },
    { href: "/admin/sources",  icon: Rss,           label: "المصادر",          badge: d.pendingNewsItems > 0 ? `${d.pendingNewsItems} جديد` : null,  badgeColor: "bg-sky-100 text-sky-700"       },
    { href: "/admin/social",   icon: Share2,        label: "السوشيال ميديا",   badge: d.pendingSocialPosts > 0 ? `${d.pendingSocialPosts} معلّق` : null, badgeColor: "bg-pink-100 text-pink-700", alert: d.pendingSocialPosts > 0 },
    { href: "/admin/authors",  icon: Users,         label: "الكتّاب",          badge: "2",                                                          badgeColor: "bg-slate-100 text-slate-600"   },
    { href: "/admin/ads",        icon: Megaphone,     label: "الإعلانات",        badge: `${d.activeAds} مفعّل`,   badgeColor: "bg-emerald-100 text-emerald-700"},
    { href: "/admin/newsletter", icon: Mail,          label: "النشرة البريدية",  badge: `${d.newsletterCount} مشترك`, badgeColor: "bg-indigo-100 text-indigo-700" },
  ];

  return (
    <div className="p-6 space-y-6" dir="rtl">

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`relative rounded-xl border bg-white p-5 shadow-sm ${s.alert ? "border-red-200 ring-1 ring-red-300" : "border-slate-200"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">{s.label}</p>
                  <p className={`mt-2 text-3xl font-black tracking-tight ${s.color}`}>{s.value}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{s.sub}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.bg}`}>
                  <Icon className={`h-5 w-5 ${s.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick links grid */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">الأقسام</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {quickLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex flex-col items-center gap-2 rounded-xl border bg-white p-4 text-center shadow-sm transition hover:border-indigo-200 hover:shadow-md ${item.alert ? "border-amber-300 ring-1 ring-amber-300" : "border-slate-200"}`}
              >
                {item.alert && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[9px] font-black text-white">!</span>
                )}
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.alert ? "bg-amber-50" : "bg-slate-50"} transition group-hover:bg-indigo-50`}>
                  <Icon className={`h-5 w-5 ${item.alert ? "text-amber-600" : "text-slate-500"} transition group-hover:text-indigo-600`} />
                </div>
                <p className="text-xs font-semibold text-slate-700 leading-tight">{item.label}</p>
                {item.badge && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.badgeColor}`}>{item.badge}</span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid gap-5 lg:grid-cols-3">

        {/* Queue status */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">حالة الطابور</h3>
            <Link href="/admin/queue" className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              فتح <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {[
              { label: "أخبار جديدة",      value: d.pendingNewsItems,  color: "bg-sky-500",     track: "bg-sky-100"    },
              { label: "جاهز للمراجعة",    value: d.processedQueue,    color: "bg-violet-500",  track: "bg-violet-100" },
              { label: "قيد الانتظار",     value: d.pendingQueue,      color: "bg-amber-500",   track: "bg-amber-100"  },
              { label: "فشل",              value: d.failedQueue,       color: "bg-red-500",     track: "bg-red-100"    },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <p className="w-28 shrink-0 text-xs text-slate-500">{row.label}</p>
                <div className={`flex-1 rounded-full h-1.5 ${row.track}`}>
                  <div
                    className={`h-1.5 rounded-full ${row.color} transition-all`}
                    style={{ width: `${Math.min(100, (row.value / Math.max(1, d.pendingNewsItems + d.processedQueue + d.pendingQueue + d.failedQueue)) * 100)}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-xs font-bold text-slate-700">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top reviews */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">الأكثر مشاهدة</h3>
            <Link href="/admin/reviews" className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              الكل <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <ol className="space-y-3">
            {d.topReviews.map((r, i) => (
              <li key={r.id} className="flex items-center gap-3">
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${i === 0 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>{i + 1}</span>
                <a href={`/reviews/${r.slug}`} target="_blank" rel="noopener noreferrer"
                  className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700 hover:text-indigo-600">
                  {r.titleAr}
                </a>
                <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  {r.viewCount.toLocaleString("ar-EG")}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* Trending keywords */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-900">الكلمات الرائجة</h3>
          </div>
          {d.trendingKeywords.length === 0 ? (
            <p className="text-xs text-slate-400">لا توجد بيانات بعد</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {d.trendingKeywords.map((kw, i) => (
                <span key={kw.id} className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold ${
                  i === 0 ? "bg-indigo-600 text-white" :
                  i < 3   ? "bg-indigo-50 text-indigo-700" :
                            "bg-slate-100 text-slate-600"
                }`}>
                  {kw.keyword}
                  <span className="opacity-50">·{kw.count}</span>
                </span>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Recent reviews table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-bold text-slate-900">آخر التقارير</h3>
          <Link href="/admin/reviews" className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
            عرض الكل <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="divide-y divide-slate-50">
          {d.recentReviews.map((r) => (
            <div key={r.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{r.titleAr}</p>
                <p className="text-[11px] text-slate-400">{r.category.nameAr} · {r.authorSlug}</p>
              </div>
              <span className={`shrink-0 rounded-md px-2.5 py-0.5 text-[11px] font-semibold ${r.published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {r.published ? "منشورة" : "مسودة"}
              </span>
              <Link href={`/admin/reviews/${r.id}`} className="shrink-0 rounded-lg border border-slate-200 p-1.5 text-slate-400 transition hover:border-indigo-200 hover:text-indigo-600">
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
