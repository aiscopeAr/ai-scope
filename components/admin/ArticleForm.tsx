"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { Category } from "@prisma/client";

import { articleSchema, type ArticleSchemaInput } from "@/lib/validations/article";
import { useToast } from "@/components/ui/toast";
import type { ArticleWithCategory } from "@/types/articles";

type Props = {
  article?: ArticleWithCategory;
  categories: Category[];
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[؀-ۿ]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function Field({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#667eea] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#667eea]/20 transition";

export default function ArticleForm({ article, categories }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = !!article;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ArticleSchemaInput, unknown, ArticleSchemaInput>({
    resolver: zodResolver(articleSchema) as never,
    defaultValues: article
      ? {
          title: article.title,
          titleAr: article.titleAr,
          slug: article.slug,
          content: article.content,
          contentAr: article.contentAr,
          excerpt: article.excerpt ?? "",
          imageUrl: article.imageUrl ?? "",
          sourceUrl: article.sourceUrl,
          sourceName: article.sourceName,
          categoryId: article.categoryId,
          published: article.published,
          publishedAt: article.publishedAt
            ? new Date(article.publishedAt).toISOString().slice(0, 16)
            : "",
          score: article.score,
        }
      : {
          title: "",
          titleAr: "",
          slug: "",
          content: "",
          contentAr: "",
          excerpt: "",
          imageUrl: "",
          sourceUrl: "",
          sourceName: "",
          categoryId: categories[0]?.id ?? "",
          published: false,
          publishedAt: "",
          score: 0,
        },
  });

  const titleAr = watch("titleAr");

  React.useEffect(() => {
    if (!isEdit && titleAr) {
      const generated = slugify(titleAr) || titleAr.replace(/\s+/g, "-").toLowerCase();
      if (generated) setValue("slug", generated, { shouldValidate: false });
    }
  }, [titleAr, isEdit, setValue]);

  const published = watch("published");

  async function onSubmit(data: ArticleSchemaInput) {
    const url = isEdit ? `/api/admin/articles/${article.id}` : "/api/admin/articles";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          imageUrl: data.imageUrl || undefined,
          publishedAt: data.publishedAt || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        const message =
          typeof err.error === "string" ? err.error : "حدث خطأ أثناء الحفظ";
        toast(message, "error");
        return;
      }

      toast(isEdit ? "تم تحديث المقال بنجاح" : "تم إنشاء المقال بنجاح");
      router.push("/admin/articles");
      router.refresh();
    } catch {
      toast("حدث خطأ في الاتصال بالخادم", "error");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" dir="rtl">
      {/* Title section */}
      <div className="rounded-[2rem] bg-white p-6 shadow-lg shadow-slate-200/60 space-y-5">
        <h2 className="text-lg font-black text-slate-900">العناوين والرابط</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="العنوان بالعربية *" error={errors.titleAr?.message}>
            <input {...register("titleAr")} className={inputCls} placeholder="عنوان المقال بالعربية" dir="rtl" />
          </Field>
          <Field label="العنوان بالإنجليزية *" error={errors.title?.message}>
            <input {...register("title")} className={inputCls} placeholder="Article title in English" dir="ltr" />
          </Field>
        </div>
        <Field
          label="الرابط المختصر (Slug) *"
          error={errors.slug?.message}
          hint="يتم توليده تلقائياً من العنوان العربي — يمكنك تعديله"
        >
          <input {...register("slug")} className={inputCls} placeholder="article-slug" dir="ltr" />
        </Field>
      </div>

      {/* Content section */}
      <div className="rounded-[2rem] bg-white p-6 shadow-lg shadow-slate-200/60 space-y-5">
        <h2 className="text-lg font-black text-slate-900">المحتوى</h2>
        <Field label="المقتطف" error={errors.excerpt?.message}>
          <textarea
            {...register("excerpt")}
            rows={3}
            className={inputCls}
            placeholder="ملخص قصير يظهر في بطاقة المقال..."
            dir="rtl"
          />
        </Field>
        <Field label="المحتوى بالعربية *" error={errors.contentAr?.message}>
          <textarea
            {...register("contentAr")}
            rows={10}
            className={inputCls}
            placeholder="محتوى المقال بالعربية..."
            dir="rtl"
          />
        </Field>
        <Field label="المحتوى بالإنجليزية *" error={errors.content?.message}>
          <textarea
            {...register("content")}
            rows={10}
            className={inputCls}
            placeholder="Article content in English..."
            dir="ltr"
          />
        </Field>
      </div>

      {/* Meta section */}
      <div className="rounded-[2rem] bg-white p-6 shadow-lg shadow-slate-200/60 space-y-5">
        <h2 className="text-lg font-black text-slate-900">البيانات الوصفية</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="التصنيف *" error={errors.categoryId?.message}>
            <select {...register("categoryId")} className={inputCls}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameAr}
                </option>
              ))}
            </select>
          </Field>
          <Field label="اسم المصدر *" error={errors.sourceName?.message}>
            <input {...register("sourceName")} className={inputCls} placeholder="مثال: TechCrunch" dir="ltr" />
          </Field>
        </div>
        <Field label="رابط المصدر *" error={errors.sourceUrl?.message}>
          <input {...register("sourceUrl")} className={inputCls} placeholder="https://..." dir="ltr" />
        </Field>
        <Field label="رابط الصورة المميزة" error={errors.imageUrl?.message}>
          <input {...register("imageUrl")} className={inputCls} placeholder="https://..." dir="ltr" />
        </Field>
      </div>

      {/* Publish section */}
      <div className="rounded-[2rem] bg-white p-6 shadow-lg shadow-slate-200/60 space-y-5">
        <h2 className="text-lg font-black text-slate-900">النشر</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="flex cursor-pointer items-center gap-3 select-none">
              <div className="relative">
                <input type="checkbox" className="sr-only" {...register("published")} />
                <div
                  className={`h-6 w-11 rounded-full transition-colors ${published ? "bg-[#667eea]" : "bg-slate-200"}`}
                />
                <div
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${published ? "translate-x-5 rtl:-translate-x-5" : "translate-x-0.5 rtl:-translate-x-0.5"}`}
                />
              </div>
              <span className="text-sm font-semibold text-slate-700">
                {published ? "منشور" : "مسودة"}
              </span>
            </label>
          </div>
          <Field label="تاريخ النشر المجدول (اختياري)" error={errors.publishedAt?.message}>
            <input
              {...register("publishedAt")}
              type="datetime-local"
              className={inputCls}
              dir="ltr"
            />
          </Field>
        </div>
        <Field label="النقاط (0-10)" error={errors.score?.message}>
          <input
            {...register("score", { valueAsNumber: true })}
            type="number"
            min={0}
            max={10}
            className={`${inputCls} max-w-[120px]`}
            dir="ltr"
          />
        </Field>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between rounded-[2rem] bg-white p-6 shadow-lg shadow-slate-200/60">
        <button
          type="button"
          onClick={() => router.push("/admin/articles")}
          className="rounded-2xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
        >
          إلغاء
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded-2xl bg-[#667eea] px-7 py-2.5 text-sm font-semibold text-white hover:bg-[#5a6fd6] disabled:opacity-60 transition"
        >
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isEdit ? "حفظ التعديلات" : "نشر المقال"}
        </button>
      </div>
    </form>
  );
}
