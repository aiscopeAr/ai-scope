import type { Metadata } from "next";
import { SITE_NAME, SITE_NAME_AR, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: `تواصل معنا | ${SITE_NAME_AR}`,
  description:
    `تواصل مع فريق ${SITE_NAME} للاستفسارات التحريرية، الشراكات الإعلانية، أو الإبلاغ عن خطأ في المحتوى.`,
  alternates: { canonical: absoluteUrl("/contact") },
};

const channels = [
  {
    icon: "✉️",
    title: "الاستفسارات العامة",
    desc: "أي سؤال عن المنصة أو محتواها أو طريقة عملها.",
    email: "hanna.obead@gmail.com",
    accent: "violet",
  },
  {
    icon: "📢",
    title: "الشراكات الإعلانية",
    desc: "للإعلان على المنصة والتعاون التجاري.",
    email: "hanna.obead@gmail.com",
    accent: "indigo",
  },
  {
    icon: "🔍",
    title: "التصحيحات التحريرية",
    desc: "اكتشفت خطأً في إحدى تقاريرنا؟ أخبرنا — نُصحّح علناً.",
    email: "hanna.obead@gmail.com",
    accent: "pink",
  },
];

const accentMap: Record<string, string> = {
  violet: "border-violet-500/20 bg-violet-500/8",
  indigo: "border-indigo-500/20 bg-indigo-500/8",
  pink: "border-pink-500/20 bg-pink-500/8",
};

const emailColorMap: Record<string, string> = {
  violet: "text-violet-400 hover:text-violet-300",
  indigo: "text-indigo-400 hover:text-indigo-300",
  pink: "text-pink-400 hover:text-pink-300",
};

export default function ContactPage() {
  return (
    <div dir="rtl">

      {/* Hero */}
      <section className="border-b border-white/8 bg-gradient-to-b from-white/3 to-transparent py-20">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <h1 className="mb-4 text-4xl font-black text-white md:text-5xl">تواصل معنا</h1>
          <p className="text-lg text-slate-400">
            نسعد بتواصلك في أي وقت — نرد خلال 48 ساعة في أيام العمل.
          </p>
        </div>
      </section>

      <div className="container mx-auto max-w-3xl px-4 py-16 space-y-5">

        {/* Channels */}
        {channels.map((ch) => (
          <div
            key={ch.title}
            className={`rounded-2xl border p-6 ${accentMap[ch.accent]}`}
          >
            <div className="mb-3 flex items-center gap-3">
              <span className="text-2xl">{ch.icon}</span>
              <h2 className="text-lg font-bold text-white">{ch.title}</h2>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-slate-400">{ch.desc}</p>
            <a
              href={`mailto:${ch.email}`}
              className={`font-semibold transition hover:underline ${emailColorMap[ch.accent]}`}
            >
              {ch.email}
            </a>
          </div>
        ))}

        {/* Note */}
        <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
          <p className="text-sm leading-relaxed text-slate-400">
            <span className="font-semibold text-slate-300">ملاحظة: </span>
            كتّاب المنصة — زيد ولينا — أنظمة ذكاء اصطناعي ولا يتلقيان بريداً إلكترونياً مباشرةً.
            جميع المراسلات تصل للفريق البشري الذي يشرف على {SITE_NAME}.
          </p>
        </div>

      </div>
    </div>
  );
}
