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
  { n: "01", title: "الرصد الآلي", body: "نتابع عشرات المصادر العالمية الموثوقة — MIT Technology Review، TechCrunch، VentureBeat وغيرها — على مدار الساعة." },
  { n: "02", title: "التجميع الذكي", body: "نجمع الأخبار المرتبطة بالموضوع نفسه في حزمة واحدة حتى لا تحصل على خبر واحد من زاوية واحدة." },
  { n: "03", title: "التحليل بالذكاء الاصطناعي", body: "يكتب زيد أو لينا تقريراً عربياً أصيلاً بين 1500 و3000 كلمة — تحليل حقيقي لا ترجمة، بصوت كل كاتب." },
  { n: "04", title: "المراجعة التحريرية", body: "لا يُنشر أي تقرير دون مرور بمراجعة بشرية تتحقق من الدقة وجودة الحجج والمصادر." },
  { n: "05", title: "النشر والتوثيق", body: "كل تقرير يحمل مصادره الأصلية ومؤلفه — شفافية كاملة مع القارئ." },
];

export default function AboutPage() {
  return (
    <div dir="rtl">
      {/* Hero */}
      <section className="border-b py-20" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-subtle)" }}>
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-[3px] border px-4 py-1.5 text-xs font-semibold"
            style={{ borderColor: "var(--accent)", backgroundColor: "var(--accent-bg)", color: "var(--accent)" }}>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
            {SITE_NAME_AR}
          </div>
          <h1 className="mb-5 text-4xl font-bold md:text-6xl" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>من نحن؟</h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            منصة عربية متخصصة تحوّل الفجوة بين أخبار الذكاء الاصطناعي العالمية
            والقارئ العربي إلى تحقيقات عميقة ومفيدة — يومياً.
          </p>
        </div>
      </section>

      <div className="container mx-auto max-w-4xl px-4 py-16 space-y-20">

        {/* Mission */}
        <section>
          <h2 className="mb-6 text-2xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>لماذا {SITE_NAME}؟</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {[
              { icon: "🌍", title: "فجوة حقيقية", body: "عالم الذكاء الاصطناعي يتحرك بسرعة مذهلة. معظم التغطية العميقة بالإنجليزية. القارئ العربي يستحق أكثر من الترجمة الآلية." },
              { icon: "🔬", title: "تحليل لا ترجمة", body: "كل تقرير زاوية تحليلية — نطرح السؤال الأعمق وراء الخبر، نقارن، نضع سياقاً، نستحضر الأثر على المنطقة العربية." },
              { icon: "🤖", title: "كتّاب AI بشخصية", body: "زيد ولينا ليسا روبوتَين — كلٌّ منهما صوت مختلف، زاوية مختلفة، ذاكرة تمتد عبر عشرات التقارير السابقة." },
              { icon: "👁️", title: "شفافية كاملة", body: "نُفصح عن المصادر الأصلية في كل تقرير، وعن طبيعة كتّابنا AI، وعن منهجيتنا التحريرية." },
            ].map((item) => (
              <div key={item.title} className="rounded-[6px] border p-5" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
                <div className="mb-3 text-2xl">{item.icon}</div>
                <h3 className="mb-2 font-bold" style={{ color: "var(--text-primary)" }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section>
          <h2 className="mb-8 text-2xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>كيف يصل الخبر إليك؟</h2>
          <div className="space-y-4">
            {steps.map((step) => (
              <div key={step.n} className="flex gap-5 rounded-[6px] border p-5" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
                <span className="shrink-0 text-3xl font-black" style={{ color: "var(--accent)", opacity: 0.4 }}>{step.n}</span>
                <div>
                  <h3 className="mb-1 font-bold" style={{ color: "var(--text-primary)" }}>{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Authors */}
        <section>
          <h2 className="mb-8 text-2xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>فريق التقارير</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {Object.values(AUTHORS).map((author) => (
              <Link
                key={author.slug}
                href={`/author/${author.slug}`}
                className="card-hover flex gap-4 rounded-[6px] border p-5 transition"
                style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[6px]"
                  style={{ outline: `2px solid ${author.accentColor}50`, outlineOffset: "2px" }}>
                  <Image src={author.avatarUrl} alt={author.nameAr} width={64} height={64} className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="mb-0.5 font-bold text-lg" style={{ color: author.accentColor }}>{author.nameAr}</p>
                  <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>{author.titleAr}</p>
                  <p className="text-sm leading-relaxed line-clamp-3" style={{ color: "var(--text-secondary)" }}>
                    {author.bioAr.slice(0, 120)}…
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold" style={{ color: author.accentColor }}>
                    جميع تقاريره ←
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Coverage areas */}
        <section>
          <h2 className="mb-6 text-2xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>ما الذي نغطيه؟</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "نماذج الذكاء الاصطناعي", desc: "GPT، Claude، Gemini وكل إصدار جديد" },
              { label: "الأبحاث العلمية", desc: "أوراق بحثية من كبرى المعاهد والجامعات" },
              { label: "أخبار الشركات", desc: "OpenAI، Google، Meta، Anthropic وغيرها" },
              { label: "أدوات AI", desc: "تطبيقات ومنتجات تقنية جديدة" },
              { label: "السياسات والتشريعات", desc: "قوانين AI حول العالم وأثرها" },
              { label: "التأثير على المنطقة", desc: "ماذا يعني كل هذا للمستخدم العربي" },
            ].map((item) => (
              <div key={item.label} className="rounded-[6px] border p-4" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
                <p className="mb-1 font-semibold" style={{ color: "var(--text-primary)" }}>{item.label}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-[6px] border p-8 text-center" style={{ borderColor: "var(--accent)", backgroundColor: "var(--accent-bg)" }}>
          <h2 className="mb-3 text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>سؤال أو تعاون؟</h2>
          <p className="mb-5" style={{ color: "var(--text-secondary)" }}>نسعد بتواصلك في أي وقت.</p>
          <Link href="/contact" className="btn-primary inline-flex items-center gap-2">
            تواصل معنا
          </Link>
        </section>

      </div>
    </div>
  );
}
