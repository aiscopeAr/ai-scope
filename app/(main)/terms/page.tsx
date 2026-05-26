import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_NAME_AR, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: `الشروط والأحكام | ${SITE_NAME_AR}`,
  description:
    `شروط استخدام منصة ${SITE_NAME} — حقوقك والتزاماتك عند استخدام المنصة والمحتوى المنشور فيها.`,
  alternates: { canonical: absoluteUrl("/terms") },
};

const sections = [
  {
    n: "1",
    title: "القبول بالشروط",
    body: `باستخدامك لـ ${SITE_NAME} فإنك توافق على الالتزام بهذه الشروط. إذا لم توافق على أيٍّ منها، يُرجى التوقف عن استخدام المنصة.`,
  },
  {
    n: "2",
    title: "طبيعة المحتوى",
    body: `يقدم ${SITE_NAME} تحليلات وتقارير حول أخبار الذكاء الاصطناعي مستقاةً من مصادر عالمية موثوقة. المحتوى للأغراض الإعلامية فحسب. نحرص على الدقة، لكننا لا نضمن خلوّه من الأخطاء ولا نتحمل المسؤولية عن قرارات تُتخذ بناءً عليه.`,
  },
  {
    n: "3",
    title: "الملكية الفكرية",
    body: `المحتوى التحليلي المنشور على ${SITE_NAME} هو ملك للمنصة. المصادر الأصلية تعود ملكيتها لأصحابها ونوثقها في كل تقرير. يُحظر نقل محتوى المنصة أو إعادة نشره دون إذن كتابي مسبق.`,
  },
  {
    n: "4",
    title: "المحتوى المُولَّد بالذكاء الاصطناعي",
    body: `كتّاب المنصة (زيد ولينا) أنظمة ذكاء اصطناعي تخضع لمراجعة تحريرية بشرية قبل النشر. نُفصح عن ذلك صراحةً في كل تقرير. المحتوى المنشور لا يمثّل آراء شخصية أو مواقف مؤسسية.`,
  },
  {
    n: "5",
    title: "الروابط الخارجية",
    body: "يحتوي الموقع على روابط لمواقع خارجية للمرجعية فقط. لا نتحمل المسؤولية عن محتوى هذه المواقع أو سياسات خصوصيتها.",
  },
  {
    n: "6",
    title: "الإعلانات",
    body: "قد يحتوي الموقع على إعلانات من شركات خارجية. وجودها لا يعني تأييدنا للمنتجات أو الخدمات المعلن عنها.",
  },
  {
    n: "7",
    title: "تحديد المسؤولية",
    body: `يُقدَّم الموقع "كما هو" دون ضمانات صريحة أو ضمنية. لا تتحمل المنصة المسؤولية عن أي أضرار مباشرة أو غير مباشرة ناجمة عن استخدام الموقع أو تعذّر الوصول إليه.`,
  },
  {
    n: "8",
    title: "التعديلات",
    body: "نحتفظ بالحق في تعديل هذه الشروط في أي وقت. التعديلات تسري فور نشرها بتحديث تاريخ آخر مراجعة أعلى هذه الصفحة.",
  },
];

export default function TermsPage() {
  return (
    <div dir="rtl">

      {/* Hero */}
      <section className="border-b border-white/8 bg-gradient-to-b from-white/3 to-transparent py-20">
        <div className="container mx-auto max-w-3xl px-4">
          <h1 className="mb-3 text-4xl font-black text-white md:text-5xl">الشروط والأحكام</h1>
          <p className="text-slate-500">آخر تحديث: مايو 2026</p>
        </div>
      </section>

      <div className="container mx-auto max-w-3xl px-4 py-16">
        <div className="space-y-2">
          {sections.map((sec) => (
            <details
              key={sec.n}
              className="group rounded-2xl border border-white/8 bg-white/3 open:bg-white/5 transition"
              open={sec.n === "1"}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 marker:hidden">
                <div className="flex items-center gap-3">
                  <span className="w-7 shrink-0 text-sm font-black text-violet-500">{sec.n}.</span>
                  <span className="font-bold text-slate-200">{sec.title}</span>
                </div>
                <svg
                  className="h-4 w-4 shrink-0 text-slate-500 transition-transform group-open:rotate-180"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="px-6 pb-5 text-sm leading-relaxed text-slate-400">{sec.body}</p>
            </details>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-white/8 bg-white/3 p-6 text-sm text-slate-500">
          للاستفسار عن هذه الشروط:{" "}
          <a
            href="mailto:hanna.obead@gmail.com"
            className="font-semibold text-violet-400 hover:text-violet-300 hover:underline"
          >
            hanna.obead@gmail.com
          </a>
          {" · "}
          <Link href="/contact" className="text-violet-400 hover:text-violet-300 hover:underline">
            تواصل معنا
          </Link>
        </div>
      </div>
    </div>
  );
}
