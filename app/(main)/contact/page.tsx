import type { Metadata } from "next";
import { SITE_NAME, SITE_NAME_AR, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: `تواصل معنا | ${SITE_NAME_AR}`,
  description: `تواصل مع فريق ${SITE_NAME} للاستفسارات التحريرية، الشراكات الإعلانية، أو الإبلاغ عن خطأ في المحتوى.`,
  alternates: { canonical: absoluteUrl("/contact") },
};

const channels = [
  { icon: "✉️", title: "الاستفسارات العامة", desc: "أي سؤال عن المنصة أو محتواها أو طريقة عملها.", email: "hanna.obead@gmail.com" },
  { icon: "📢", title: "الشراكات الإعلانية", desc: "للإعلان على المنصة والتعاون التجاري.", email: "hanna.obead@gmail.com" },
  { icon: "🔍", title: "التصحيحات التحريرية", desc: "اكتشفت خطأً في إحدى تقاريرنا؟ أخبرنا — نُصحّح علناً.", email: "hanna.obead@gmail.com" },
];

export default function ContactPage() {
  return (
    <div dir="rtl">
      {/* Hero */}
      <section className="border-b py-20" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-subtle)" }}>
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>تواصل معنا</h1>
          <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
            نسعد بتواصلك في أي وقت — نرد خلال 48 ساعة في أيام العمل.
          </p>
        </div>
      </section>

      <div className="container mx-auto max-w-3xl px-4 py-16 space-y-5">
        {channels.map((ch) => (
          <div key={ch.title} className="rounded-[6px] border p-6" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
            <div className="mb-3 flex items-center gap-3">
              <span className="text-2xl">{ch.icon}</span>
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{ch.title}</h2>
            </div>
            <p className="mb-4 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{ch.desc}</p>
            <a href={`mailto:${ch.email}`} className="font-semibold transition hover:underline" style={{ color: "var(--accent)" }}>
              {ch.email}
            </a>
          </div>
        ))}

        <div className="rounded-[6px] border p-6" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>ملاحظة: </span>
            كتّاب المنصة — زيد ولينا — أنظمة ذكاء اصطناعي ولا يتلقيان بريداً إلكترونياً مباشرةً.
            جميع المراسلات تصل للفريق البشري الذي يشرف على {SITE_NAME}.
          </p>
        </div>
      </div>
    </div>
  );
}
