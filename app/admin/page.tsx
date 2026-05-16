import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";

import AdminSignOutButton from "@/components/AdminSignOutButton";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const [articleCount, recentArticles, topArticles, categories, sources, settings, pendingQueue] = await Promise.all([
    prisma.article.count(),
    prisma.article.findMany({
      orderBy: { publishedAt: "desc" },
      take: 10,
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
  ]);

  return { articleCount, recentArticles, topArticles, categories, sources, settings, pendingQueue };
}

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/admin/login");
  }

  const data = await getDashboardData();

  return (
    <section className="container mx-auto px-4 py-8" dir="rtl">
      <div className="mb-8 flex flex-col gap-4 rounded-[2rem] bg-white p-6 shadow-lg shadow-slate-200/60 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold text-[#667eea]">لوحة الإدارة</p>
          <h1 className="text-3xl font-black text-slate-900">مرحبًا {session.user?.name || "Admin"}</h1>
          <p className="mt-2 text-slate-600">إدارة المحتوى الأساسي لمنصة AI Scope من مكان واحد.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            عرض الموقع
          </Link>
          <AdminSignOutButton />
        </div>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-5">
        <div className="rounded-[1.75rem] bg-white p-5 shadow-md shadow-slate-200/60">
          <p className="text-sm text-slate-500">عدد المقالات</p>
          <p className="mt-3 text-3xl font-black text-slate-900">{data.articleCount}</p>
        </div>
        <div className="rounded-[1.75rem] bg-white p-5 shadow-md shadow-slate-200/60">
          <p className="text-sm text-slate-500">التصنيفات</p>
          <p className="mt-3 text-3xl font-black text-slate-900">{data.categories}</p>
        </div>
        <div className="rounded-[1.75rem] bg-white p-5 shadow-md shadow-slate-200/60">
          <p className="text-sm text-slate-500">المصادر</p>
          <p className="mt-3 text-3xl font-black text-slate-900">{data.sources}</p>
        </div>
        <div className="rounded-[1.75rem] bg-white p-5 shadow-md shadow-slate-200/60">
          <p className="text-sm text-slate-500">النشر التلقائي</p>
          <p className="mt-3 text-3xl font-black text-slate-900">{data.settings?.autoPublish ? "مفعل" : "متوقف"}</p>
        </div>
        <Link href="/admin/queue" className="rounded-[1.75rem] bg-amber-50 p-5 shadow-md shadow-slate-200/60 hover:bg-amber-100 transition">
          <p className="text-sm text-amber-700">طابور المراجعة</p>
          <p className="mt-3 text-3xl font-black text-amber-800">{data.pendingQueue}</p>
        </Link>
      </div>

      {/* Top Articles by views */}
      <div className="mb-8 rounded-[2rem] bg-white p-6 shadow-lg shadow-slate-200/60">
        <h2 className="mb-4 text-xl font-black text-slate-900">الأكثر مشاهدة</h2>
        {data.topArticles.length === 0 ? (
          <p className="text-sm text-slate-400">لا توجد مشاهدات بعد</p>
        ) : (
          <ol className="space-y-3">
            {data.topArticles.map((article, i) => (
              <li key={article.id} className="flex items-center gap-4">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#667eea]/10 text-xs font-black text-[#667eea]">
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
                <span className="flex-shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  {article.viewCount.toLocaleString("ar-EG")} مشاهدة
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-[2rem] bg-white p-6 shadow-lg shadow-slate-200/60">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-slate-900">أحدث المقالات</h2>
            <p className="text-sm text-slate-500">آخر 10 مقالات من قاعدة البيانات</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr className="text-right text-sm text-slate-500">
                  <th className="pb-4 font-semibold">العنوان</th>
                  <th className="pb-4 font-semibold">التصنيف</th>
                  <th className="pb-4 font-semibold">المصدر</th>
                  <th className="pb-4 font-semibold">الحالة</th>
                  <th className="pb-4 font-semibold">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentArticles.map((article) => (
                  <tr key={article.id} className="text-sm text-slate-700">
                    <td className="py-4 font-semibold text-slate-900">{article.titleAr}</td>
                    <td className="py-4">{article.category.nameAr}</td>
                    <td className="py-4">{article.sourceName}</td>
                    <td className="py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          article.published ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {article.published ? "منشور" : "مسودة"}
                      </span>
                    </td>
                    <td className="py-4">
                      {article.publishedAt ? format(new Date(article.publishedAt), "yyyy-MM-dd") : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] bg-white p-6 shadow-lg shadow-slate-200/60">
            <h2 className="mb-4 text-xl font-black text-slate-900">الإعدادات الحالية</h2>
            <div className="space-y-3 text-sm text-slate-600">
              <p>الحد الأدنى للنقاط: {data.settings?.minScore ?? "-"}</p>
              <p>فاصل النشر: {data.settings?.publishInterval ?? "-"} دقيقة</p>
              <p>نموذج الترجمة: {data.settings?.translationModel ?? "-"}</p>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-lg shadow-slate-200/60">
            <h2 className="mb-4 text-xl font-black text-slate-900">إجراءات سريعة</h2>
            <div className="space-y-3">
              <Link
                href="/admin/articles"
                className="flex items-center justify-between rounded-2xl bg-[#667eea]/10 px-4 py-3 text-sm font-semibold text-[#667eea] transition hover:bg-[#667eea]/20"
              >
                <span>إدارة المقالات</span>
                <span>←</span>
              </Link>
              <Link
                href="/admin/articles/new"
                className="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                <span>إنشاء مقال جديد</span>
                <span>←</span>
              </Link>
              <Link
                href="/admin/sources"
                className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <span>إدارة المصادر</span>
                <span>←</span>
              </Link>
              <Link
                href="/admin/queue"
                className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
              >
                <span>طابور المراجعة</span>
                <span>←</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
