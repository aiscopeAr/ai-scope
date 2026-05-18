import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PromptQueuePage() {
  const queue = await prisma.promptQueue.findMany({
    orderBy: [{ score: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  const stats = {
    pending: queue.filter((q) => q.status === "pending").length,
    processing: queue.filter((q) => q.status === "processing").length,
    processed: queue.filter((q) => q.status === "processed").length,
    approved: queue.filter((q) => q.status === "approved").length,
  };

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/prompts" className="text-sm text-slate-500 hover:text-violet-600">
          ← مكتبة Prompts
        </Link>
        <h1 className="text-2xl font-black text-slate-800">طابور Prompts</h1>
      </div>

      <div className="mb-8 grid grid-cols-4 gap-4">
        {[
          { label: "انتظار", value: stats.pending, color: "bg-yellow-50 border-yellow-200 text-yellow-700" },
          { label: "معالجة", value: stats.processing, color: "bg-blue-50 border-blue-200 text-blue-700" },
          { label: "جاهز", value: stats.processed, color: "bg-violet-50 border-violet-200 text-violet-700" },
          { label: "منشور", value: stats.approved, color: "bg-green-50 border-green-200 text-green-700" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border p-5 ${s.color}`}>
            <div className="text-3xl font-black">{s.value}</div>
            <div className="text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {queue.length === 0 ? (
          <div className="py-16 text-center text-slate-400">الطابور فارغ — سيتم ملؤه تلقائياً</div>
        ) : (
          queue.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-slate-800 line-clamp-1">
                    {item.titleAr ?? item.rawTitle}
                  </h3>
                  {item.descriptionAr && (
                    <p className="mt-1 text-sm text-slate-500 line-clamp-2">{item.descriptionAr}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-shrink-0 flex-col items-end gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    item.status === "approved" ? "bg-green-100 text-green-700"
                    : item.status === "processed" ? "bg-violet-100 text-violet-700"
                    : item.status === "processing" ? "bg-blue-100 text-blue-700"
                    : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {item.status === "approved" ? "منشور" : item.status === "processed" ? "جاهز" : item.status === "processing" ? "معالجة" : "انتظار"}
                  </span>
                  {item.score > 0 && (
                    <span className="text-sm font-bold text-slate-600">⭐ {item.score}/10</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
