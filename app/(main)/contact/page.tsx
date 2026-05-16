import type { Metadata } from "next";
import { SITE_NAME_AR, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: `اتصل بنا | ${SITE_NAME_AR}`,
  description:
    "تواصل مع فريق AI Scope للاستفسارات التحريرية، الشراكات الإعلانية، أو الإبلاغ عن خطأ في محتوى المنصة.",
  alternates: { canonical: absoluteUrl("/contact") },
};

export default function ContactPage() {
  return (
    <section className="container mx-auto max-w-3xl px-4 py-16" dir="rtl">
      <h1 className="mb-4 text-4xl font-black text-slate-900">اتصل بنا</h1>
      <p className="mb-10 text-lg text-slate-500">نسعد بتواصلك معنا في أي وقت</p>

      <div className="space-y-6">
        {[
          {
            title: "الاستفسارات العامة",
            desc: "لأي سؤال عن المنصة أو محتواها",
            email: "info@aiscope.news",
            color: "violet",
          },
          {
            title: "الشراكات الإعلانية",
            desc: "للإعلان على المنصة والتعاون التجاري",
            email: "ads@aiscope.news",
            color: "emerald",
          },
          {
            title: "التصحيحات التحريرية",
            desc: "لاكتشفت خطأً في إحدى مقالاتنا؟ أخبرنا",
            email: "editorial@aiscope.news",
            color: "amber",
          },
        ].map((item) => (
          <div
            key={item.email}
            className={`rounded-2xl border p-6 ${
              item.color === "violet"
                ? "bg-violet-50 border-violet-100"
                : item.color === "emerald"
                ? "bg-emerald-50 border-emerald-100"
                : "bg-amber-50 border-amber-100"
            }`}
          >
            <h2 className="mb-1 text-lg font-bold text-slate-900">{item.title}</h2>
            <p className="mb-3 text-sm text-slate-500">{item.desc}</p>
            <a
              href={`mailto:${item.email}`}
              className="font-semibold text-[#667eea] hover:underline"
            >
              {item.email}
            </a>
          </div>
        ))}

        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-6 text-sm text-slate-500 leading-7">
          <p>
            نحرص على الرد على جميع الرسائل خلال <strong className="text-slate-700">48 ساعة</strong> في
            أيام العمل. شكراً لتواصلك مع AI Scope.
          </p>
        </div>
      </div>
    </section>
  );
}
