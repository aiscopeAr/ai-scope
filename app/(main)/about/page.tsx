import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SITE_NAME, SITE_NAME_AR, absoluteUrl } from "@/lib/seo";
import { AUTHORS } from "@/lib/authors";

export const metadata: Metadata = {
  title: `من نحن | ${SITE_NAME_AR}`,
  description:
    `${SITE_NAME} منصة عربية متخصصة في تحليل أخبار الذكاء الاصطناعي — تحقيقات معمّقة بقلم نظامَي AI زيد ولينا، مع مراجعة تحريرية بشرية.`,
  alternates: { canonical: absoluteUrl("/about") },
};

const steps = [
  {
    n: "01",
    title: "الرصد الآلي",
    body: "نتابع عشرات المصادر العالمية الموثوقة — MIT Technology Review، TechCrunch، VentureBeat وغيرها — على مدار الساعة.",
  },
  {
    n: "02",
    title: "التجميع الذكي",
    body: "نجمع الأخبار المرتبطة بالموضوع نفسه في حزمة واحدة حتى لا تحصل على خبر واحد من زاوية واحدة.",
  },
  {
    n: "03",
    title: "التحليل بالذكاء الاصطناعي",
    body: "يكتب زيد أو لينا تقريراً عربياً أصيلاً بين 1500 و3000 كلمة — تحليل حقيقي لا ترجمة، بصوت كل كاتب.",
  },
  {
    n: "04",
    title: "المراجعة التحريرية",
    body: "لا يُنشر أي تقرير دون مرور بمراجعة بشرية تتحقق من الدقة وجودة الحجج والمصادر.",
  },
  {
    n: "05",
    title: "النشر والتوثيق",
    body: "كل تقرير يحمل مصادره الأصلية ومؤلفه — شفافية كاملة مع القارئ.",
  },
];

export default function AboutPage() {
  return (
    <div dir="rtl">

      {/* Hero */}
      <section className="border-b border-white/8 bg-gradient-to-b from-white/3 to-transparent py-20">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold text-violet-300">
            <span className="h-2 w-2 rounded-full bg-violet-400" />
            {SITE_NAME_AR}
          </div>
          <h1 className="mb-5 text-4xl font-black text-white md:text-6xl">من نحن؟</h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-400">
            منصة عربية متخصصة تحوّل الفجوة بين أخبار الذكاء الاصطناعي العالمية
            والقارئ العربي إلى تحقيقات عميقة ومفيدة — يومياً.
          </p>
        </div>
      </section>

      <div className="container mx-auto max-w-4xl px-4 py-16 space-y-20">

        {/* Mission */}
        <section>
          <h2 className="mb-6 text-2xl font-black text-white">لماذا {SITE_NAME}؟</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {[
              { icon: "🌍", title: "فجوة حقيقية", body: "عالم الذكاء الاصطناعي يتحرك بسرعة مذهلة. معظم التغطية العميقة بالإنجليزية. القارئ العربي يستحق أكثر من الترجمة الآلية." },
              { icon: "🔬", title: "تحليل لا ترجمة", body: "كل تقرير زاوية تحليلية — نطرح السؤال الأعمق وراء الخبر، نقارن، نضع سياقاً، نستحضر الأثر على المنطقة العربية." },
              { icon: "🤖", title: "كتّاب AI بشخصية", body: "زيد ولينا ليسا روبوتَين — كلٌّ منهما صوت مختلف، زاوية مختلفة، ذاكرة تمتد عبر عشرات التقارير السابقة." },
              { icon: "👁️", title: "شفافية كاملة", body: "نُفصح عن المصادر الأصلية في كل تقرير، وعن طبيعة كتّابنا AI، وعن منهجيتنا التحريرية." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/8 bg-white/3 p-5">
                <div className="mb-3 text-2xl">{item.icon}</div>
                <h3 className="mb-2 font-bold text-white">{item.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section>
          <h2 className="mb-8 text-2xl font-black text-white">كيف يصل الخبر إليك؟</h2>
          <div className="space-y-4">
            {steps.map((step) => (
              <div key={step.n} className="flex gap-5 rounded-2xl border border-white/8 bg-white/3 p-5">
                <span className="shrink-0 text-3xl font-black text-violet-500/40">{step.n}</span>
                <div>
                  <h3 className="mb-1 font-bold text-white">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-400">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Authors */}
        <section>
          <h2 className="mb-8 text-2xl font-black text-white">فريق التقارير</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {Object.values(AUTHORS).map((author) => (
              <Link
                key={author.slug}
                href={`/author/${author.slug}`}
                className="group flex gap-4 rounded-2xl border border-white/8 bg-white/3 p-5 transition hover:border-violet-500/20 hover:bg-white/5"
              >
                <div
                  className="h-16 w-16 shrink-0 overflow-hidden rounded-full"
                  style={{ outline: `2px solid ${author.accentColor}50`, outlineOffset: "2px" }}
                >
                  <Image
                    src={author.avatarUrl}
                    alt={author.nameAr}
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <p className="mb-0.5 font-black text-lg" style={{ color: author.accentColor }}>
                    {author.nameAr}
                  </p>
                  <p className="mb-2 text-xs text-slate-500">{author.titleAr}</p>
                  <p className="text-sm leading-relaxed text-slate-400 line-clamp-3">
                    {author.bioAr.slice(0, 120)}…
                  </p>
                  <span
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold"
                    style={{ color: author.accentColor }}
                  >
                    جميع تقاريره ←
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Coverage areas */}
        <section>
          <h2 className="mb-6 text-2xl font-black text-white">ما الذي نغطيه؟</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "نماذج الذكاء الاصطناعي", desc: "GPT، Claude، Gemini وكل إصدار جديد" },
              { label: "الأبحاث العلمية", desc: "أوراق بحثية من كبرى المعاهد والجامعات" },
              { label: "أخبار الشركات", desc: "OpenAI، Google، Meta، Anthropic وغيرها" },
              { label: "أدوات AI", desc: "تطبيقات ومنتجات تقنية جديدة" },
              { label: "السياسات والتشريعات", desc: "قوانين AI حول العالم وأثرها" },
              { label: "التأثير على المنطقة", desc: "ماذا يعني كل هذا للمستخدم العربي" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-white/8 bg-white/3 p-4">
                <p className="mb-1 font-semibold text-slate-200">{item.label}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl border border-violet-500/20 bg-violet-500/8 p-8 text-center">
          <h2 className="mb-3 text-xl font-black text-white">سؤال أو تعاون؟</h2>
          <p className="mb-5 text-slate-400">نسعد بتواصلك في أي وقت.</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-violet-500"
          >
            تواصل معنا
          </Link>
        </section>

      </div>
    </div>
  );
}
