import type { Metadata } from "next";
import { SITE_NAME, SITE_NAME_AR, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: `سياسة الخصوصية | ${SITE_NAME_AR}`,
  description: `تعرّف على كيفية جمع ${SITE_NAME} للبيانات واستخدامها وحمايتها، وحقوقك كزائر للمنصة.`,
  alternates: { canonical: absoluteUrl("/privacy") },
};

const sections = [
  { n: "1", title: "المعلومات التي نجمعها", body: `عند زيارتك لـ ${SITE_NAME} نجمع تلقائياً بيانات غير شخصية مثل نوع المتصفح، الجهاز المستخدم، الصفحات التي تزورها، ومصدر الزيارة. هذه البيانات مجهولة الهوية تماماً ولا تُربط بهويتك الشخصية.` },
  { n: "2", title: "ملفات تعريف الارتباط (Cookies)", body: "نستخدم ملفات تعريف الارتباط (Cookies) لغرضين: التحليلات (عبر Google Analytics 4) وعرض الإعلانات. كما يستخدم شركاؤنا من الجهات الخارجية — بما في ذلك Google — ملفات تعريف الارتباط لعرض إعلانات مناسبة. يمكنك قبول هذه الملفات أو رفضها من شريط الموافقة الظاهر عند زيارتك، كما يمكنك تعطيلها من إعدادات متصفحك في أي وقت دون أن يؤثّر ذلك على استخدامك للموقع." },
  { n: "3", title: "Google Analytics", body: "نستخدم Google Analytics 4 لفهم كيفية تصفح الزوار للمنصة وتحسين تجربتهم. البيانات المجمعة مجهولة الهوية وتخضع لسياسة خصوصية Google المستقلة." },
  { n: "4", title: "الإعلانات وشبكات الطرف الثالث", body: null },
  { n: "5", title: "أمان البيانات", body: "نستخدم HTTPS وقواعد بيانات مؤمَّنة. لا نبيع أي بيانات لأطراف ثالثة في أي حال من الأحوال." },
  { n: "6", title: "حقوقك", body: null },
  { n: "7", title: "التعديلات على هذه السياسة", body: "قد نحدّث هذه السياسة من وقت لآخر. تاريخ آخر تحديث يظهر أعلى هذه الصفحة. استمرارك في استخدام المنصة يُعدّ قبولاً للسياسة المحدَّثة." },
];

export default function PrivacyPage() {
  return (
    <div dir="rtl">
      <section className="border-b py-20" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-subtle)" }}>
        <div className="container mx-auto max-w-3xl px-4">
          <h1 className="mb-3 text-4xl font-bold md:text-5xl" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>سياسة الخصوصية</h1>
          <p style={{ color: "var(--text-muted)" }}>آخر تحديث: أكتوبر 2026</p>
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
              <div className="px-6 pb-5 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {sec.n === "6" ? (
                  <p>
                    يحق لك في أي وقت طلب معرفة البيانات التي نحتفظ بها المتعلقة بزيارتك، أو طلب حذفها.
                    للتواصل راسلنا على{" "}
                    <a href="mailto:hanna.obead@gmail.com" className="font-semibold hover:underline" style={{ color: "var(--accent)" }}>
                      hanna.obead@gmail.com
                    </a>
                  </p>
                ) : sec.n === "4" ? (
                  <div className="space-y-3">
                    <p>
                      قد نعرض إعلانات من شبكات خارجية مثل Google AdSense. تستخدم شركات الإعلان هذه،
                      بصفتها جهات خارجية، ملفات تعريف الارتباط لعرض إعلانات بناءً على زياراتك السابقة
                      لهذا الموقع أو لمواقع أخرى على الإنترنت.
                    </p>
                    <p>
                      يتيح استخدام Google لملفات تعريف الارتباط الإعلانية (بما فيها ملف DART) لها
                      ولشركائها عرض إعلانات لمستخدمي الموقع. هذه الشبكات تعمل وفق سياسات خصوصية مستقلة،
                      ولا نشارك معها بياناتك الشخصية، ولا نتحكّم في ملفات تعريف الارتباط الخاصة بها.
                    </p>
                    <p>
                      يمكنك التحكّم في الإعلانات المخصّصة أو إيقافها عبر{" "}
                      <a href="https://myadcenter.google.com/" target="_blank" rel="noopener noreferrer nofollow" className="font-semibold hover:underline" style={{ color: "var(--accent)" }}>
                        إعدادات إعلانات Google
                      </a>{" "}
                      أو عبر{" "}
                      <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer nofollow" className="font-semibold hover:underline" style={{ color: "var(--accent)" }}>
                        www.aboutads.info
                      </a>
                      . كما يمكنك مراجعة سياسة Google لشركاء الإعلانات على{" "}
                      <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer nofollow" className="font-semibold hover:underline" style={{ color: "var(--accent)" }}>
                        policies.google.com
                      </a>
                      .
                    </p>
                  </div>
                ) : (
                  <p>{sec.body}</p>
                )}
              </div>
            </details>
          ))}
        </div>

        <div className="mt-8 rounded-[6px] border p-6 text-sm" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)", color: "var(--text-muted)" }}>
          <p>
            لأي استفسار حول هذه السياسة:{" "}
            <a href="mailto:hanna.obead@gmail.com" className="font-semibold hover:underline" style={{ color: "var(--accent)" }}>
              hanna.obead@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
