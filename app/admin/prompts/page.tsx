import Link from "next/link";
import { prisma } from "@/lib/db";
import { BookOpen, Eye, Copy, List } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPromptsPage() {
  const [prompts, stats, queueCount] = await Promise.all([
    prisma.prompt.findMany({
      include: { category: true, aiModel: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.prompt.aggregate({ _count: true, _sum: { viewCount: true, copyCount: true } }),
    prisma.promptQueue.count({ where: { status: { in: ["pending", "processed"] } } }),
  ]);

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">مكتبة Prompts</h1>
          <p className="mt-1 text-sm text-slate-500">إدارة الـ prompts المنشورة</p>
        </div>
        <Link
          href="/admin/prompts/queue"
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
        >
          <List className="size-4" />
          الطابور ({queueCount})
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        {[
          { label: "إجمالي Prompts", value: stats._count, icon: BookOpen, color: "text-violet-600" },
          { label: "إجمالي المشاهدات", value: stats._sum.viewCount ?? 0, icon: Eye, color: "text-sky-600" },
          { label: "إجمالي النسخ", value: stats._sum.copyCount ?? 0, icon: Copy, color: "text-emerald-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
            <s.icon className={`mb-2 size-5 ${s.color}`} />
            <div className={`text-2xl font-black ${s.color}`}>{s.value.toLocaleString("ar-EG")}</div>
            <div className="text-sm text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        {prompts.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            لا توجد prompts بعد — سيتم إضافتها تلقائياً عبر الـ cron jobs
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-right font-semibold text-slate-600">العنوان</th>
                <th className="p-4 text-right font-semibold text-slate-600">التصنيف</th>
                <th className="p-4 text-right font-semibold text-slate-600">النموذج</th>
                <th className="p-4 text-right font-semibold text-slate-600">الصعوبة</th>
                <th className="p-4 text-right font-semibold text-slate-600">المشاهدات</th>
                <th className="p-4 text-right font-semibold text-slate-600">النسخ</th>
                <th className="p-4 text-right font-semibold text-slate-600">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {prompts.map((prompt) => (
                <tr key={prompt.id} className="border-t border-slate-50 hover:bg-slate-50">
                  <td className="p-4">
                    <Link
                      href={`/tools/${prompt.slug}`}
                      target="_blank"
                      className="font-medium text-slate-800 hover:text-violet-600 line-clamp-1"
                    >
                      {prompt.titleAr}
                    </Link>
                  </td>
                  <td className="p-4 text-slate-600">{prompt.category.icon} {prompt.category.nameAr}</td>
                  <td className="p-4 text-slate-600">{prompt.aiModel.icon} {prompt.aiModel.name}</td>
                  <td className="p-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      prompt.difficulty === "beginner" ? "bg-emerald-100 text-emerald-700"
                      : prompt.difficulty === "advanced" ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                    }`}>
                      {prompt.difficulty === "beginner" ? "مبتدئ" : prompt.difficulty === "advanced" ? "متقدم" : "متوسط"}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600">{prompt.viewCount}</td>
                  <td className="p-4 text-slate-600">{prompt.copyCount}</td>
                  <td className="p-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      prompt.published ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                    }`}>
                      {prompt.published ? "منشور" : "مسودة"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
