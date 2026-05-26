import type { Metadata } from "next";
import { SITE_NAME, SITE_NAME_AR, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: `سياسة الخصوصية | ${SITE_NAME_AR}`,
  description:
    `تعرّف على كيفية جمع ${SITE_NAME} للبيانات واستخدامها وحمايتها، وحقوقك كزائر للمنصة.`,
  alternates: { canonical: absoluteUrl("/privacy") },
};

const sections = [
  {
    n: "1",
    title: "المعلومات التي نجمعها",
    body: `عند زيارتك لـ ${SITE_NAME} نجمع تلقائياً بيانات غير شخصية مثل نوع المتصفح، الجهاز المستخدم، الصفحات التي تزورها، ومصدر الزيارة. هذه البيانات مجهولة الهوية تماماً ولا تُربط بهويتك الشخصية.`,
  },
  {
    n: "2",
    title: "ملفات تعريف الارتباط (Cookies)",
    body: "نستخدم Cookies لأغراض تحليلية فقط عبر Google Analytics 4. لا نستخدمها لتتبع الهوية الشخصية. يمكنك تعطيلها من إعدادات متصفحك في أي وقت.",
  },
  {
    n: "3",
    title: "Google Analytics",
    body: "نستخدم Google Analytics 4 لفهم كيفية تصفح الزوار للمنصة وتحسين تجربتهم. البيانات المجمعة مجهولة الهوية وتخضع لسياسة خصوصية Google المستقلة.",
  },
  {
    n: "4",
    title: "الإعلانات",
    body: "قد تظهر إعلانات من شبكات خارجية. هذه الشبكات تعمل بسياسات خصوصية مستقلة، ولا نشارك بياناتك الشخصية معها، ولا نتحكم في Cookies الخاصة بها.",
  },
  {
    n: "5",
    title: "أمان البيانات",
    body: "نستخدم HTTPS وقواعد بيانات مؤمَّنة. لا نبيع أي بيانات لأطراف ثالثة في أي حال من الأحوال.",
  },
  {
    n: "6",
    title: "حقوقك",
    body: null, // special — rendered separately with email link
  },
  {
    n: "7",
    title: "التعديلات على هذه السياسة",
    body: "قد نحدّث هذه السياسة من وقت لآخر. تاريخ آخر تحديث يظهر أعلى هذه الصفحة. استمرارك في استخدام المنصة يُعدّ قبولاً للسياسة المحدَّثة.",
  },
];

export default function PrivacyPage() {
  return (
    <div dir="rtl">

      {/* Hero */}
      <section className="border-b border-white/8 bg-gradient-to-b from-white/3 to-transparent py-20">
        <div className="container mx-auto max-w-3xl px-4">
          <h1 className="mb-3 text-4xl font-black text-white md:text-5xl">سياسة الخصوصية</h1>
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
              <div className="px-6 pb-5 text-sm leading-relaxed text-slate-400">
                {sec.n === "6" ? (
                  <p>
                    يحق لك في أي وقت طلب معرفة البيانات التي نحتفظ بها المتعلقة بزيارتك، أو طلب حذفها.
                    للتواصل راسلنا على{" "}
                    <a
                      href="mailto:hanna.obead@gmail.com"
                      className="font-semibold text-violet-400 hover:text-violet-300 hover:underline"
                    >
                      hanna.obead@gmail.com
                    </a>
                  </p>
                ) : (
                  <p>{sec.body}</p>
                )}
              </div>
            </details>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-white/8 bg-white/3 p-6 text-sm text-slate-500">
          <p>
            لأي استفسار حول هذه السياسة:{" "}
            <a
              href="mailto:hanna.obead@gmail.com"
              className="font-semibold text-violet-400 hover:text-violet-300 hover:underline"
            >
              hanna.obead@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
