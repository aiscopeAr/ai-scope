import { redirect } from "next/navigation";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ArticleForm from "@/components/admin/ArticleForm";

export const dynamic = "force-dynamic";

export default async function NewArticlePage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const categories = await prisma.category.findMany({ orderBy: { nameAr: "asc" } });

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
        <div className="mb-8 flex flex-col gap-4 rounded-[2rem] bg-white p-6 shadow-lg shadow-slate-200/60 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold text-[#667eea]">إدارة المقالات</p>
            <h1 className="text-3xl font-black text-slate-900">مقال جديد</h1>
            <p className="mt-1 text-slate-500">أنشئ مقالاً جديداً وأضفه إلى قاعدة البيانات</p>
          </div>
          <Link
            href="/admin/articles"
            className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            ← العودة للمقالات
          </Link>
        </div>

        <ArticleForm categories={categories} />
      </div>
  );
}
