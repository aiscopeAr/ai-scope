import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_NAME_AR, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: `الشروط والأحكام | ${SITE_NAME_AR}`,
  description: `شروط استخدام منصة ${SITE_NAME} — حقوقك والتزاماتك عند استخدام المنصة والمحتوى المنشور فيها.`,
  alternates: { canonical: absoluteUrl("/terms") },
};

const sections = [
  { n: "1", title: "القبول بالشروط", body: `باستخدامك لـ ${SITE_NAME} فإنك توافق على الالتزام بهذه الشروط. إذا لم توافق على أيٍّ منها، يُرجى التوقف عن استخدام المنصة.` },
  { n: "2", title: "طبيعة المحتوى", body: `يقدم ${SITE_NAME} تحليلات وتقارير حول أخبار الذكاء الاصطناعي مستقاةً من مصادر عالمية موثوقة. المحتوى للأغراض الإعلامية فحسب. نحرص على الدقة، لكننا لا نضمن خلوّه من الأخطاء ولا نتحمل المسؤولية عن قرارات تُتخذ بناءً عليه.` },
  { n: "3", title: "الملكية الفكرية", body: `المحتوى التحليلي المنشور على ${SITE_NAME} هو ملك للمنصة. المصادر الأصلية تعود ملكيتها لأصحابها ونوثقها في كل تقرير. يُحظر نقل محتوى المنصة أو إعادة نشره دون إذن كتابي مسبق.` },
  { n: "4", title: "المحتوى المُولَّد بالذكاء الاصطناعي", body: "كتّاب المنصة (زيد ولينا) أنظمة ذكاء اصطناعي تخضع لمراجعة تحريرية بشرية قبل النشر. نُفصح عن ذلك صراحةً في كل تقرير. المحتوى المنشور لا يمثّل آراء شخصية أو مواقف مؤسسية." },
  { n: "5", title: "الروابط الخارجية", body: "يحتوي الموقع على روابط لمواقع خارجية للمرجعية فقط. لا نتحمل المسؤولية عن محتوى هذه المواقع أو سياسات خصوصيتها." },
  { n: "6", title: "الإعلانات", body: "قد يحتوي الموقع على إعلانات من شركات خارجية. وجودها لا يعني تأييدنا للمنتجات أو الخدمات المعلن عنها." },
  { n: "7", title: "تحديد المسؤولية", body: `يُقدَّم الموقع "كما هو" دون ضمانات صريحة أو ضمنية. لا تتحمل المنصة المسؤولية عن أي أضرار مباشرة أو غير مباشرة ناجمة عن استخدام الموقع أو تعذّر الوصول إليه.` },
  { n: "8", title: "التعديلات", body: "نحتفظ بالحق في تعديل هذه الشروط في أي وقت. التعديلات تسري فور نشرها بتحديث تاريخ آخر مراجعة أعلى هذه الصفحة." },
];

export default function TermsPage() {
  return (
    <div dir="rtl">
      <section className="border-b py-20" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-subtle)" }}>
        <div className="container mx-auto max-w-3xl px-4">
          <h1 className="mb-3 text-4xl font-bold md:text-5xl" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>الشروط والأحكام</h1>
          <p style={{ color: "var(--text-muted)" }}>آخر تحديث: مايو 2026</p>
        </div>
      </section>

      <div className="container mx-auto max-w-3xl px-4 py-16">
        <div className="space-y-2">
          {sections.map((sec) => (
            <details key={sec.n} className="group rounded-[6px] border transition" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }} open={sec.n === "1"}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 marker:hidden">
                <div className="flex items-center gap-3">
                  <span className="w-7 shrink-0 text-sm font-black" style={{ color: "var(--accent)" }}>{sec.n}.</span>
                  <span className="font-bold" style={{ color: "var(--text-primary)" }}>{sec.title}</span>
                </div>
                <svg className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--text-muted)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="px-6 pb-5 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{sec.body}</p>
            </details>
          ))}
        </div>

        <div className="mt-8 rounded-[6px] border p-6 text-sm" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)", color: "var(--text-muted)" }}>
          للاستفسار عن هذه الشروط:{" "}
          <a href="mailto:hanna.obead@gmail.com" className="font-semibold hover:underline" style={{ color: "var(--accent)" }}>
            hanna.obead@gmail.com
          </a>
          {" · "}
          <Link href="/contact" className="hover:underline" style={{ color: "var(--accent)" }}>
            تواصل معنا
          </Link>
        </div>
      </div>
    </div>
  );
}
