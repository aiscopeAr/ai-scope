import type { Metadata } from "next";
import { SITE_NAME, SITE_NAME_AR, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: `من نحن | ${SITE_NAME_AR}`,
  description:
    "AI Scope منصة عربية متخصصة في متابعة أخبار الذكاء الاصطناعي وتقديمها للقارئ العربي — نترجم ونحلل أبرز التطورات من أكبر المصادر العالمية.",
  alternates: { canonical: absoluteUrl("/about") },
};

export default function AboutPage() {
  return (
    <section className="container mx-auto max-w-3xl px-4 py-16" dir="rtl">
      <h1 className="mb-4 text-4xl font-black text-slate-900">من نحن</h1>
      <p className="mb-10 text-lg text-slate-500">منصة عربية لأخبار الذكاء الاصطناعي</p>

      <div className="space-y-8 text-slate-700 leading-8">
        <div>
          <h2 className="mb-3 text-xl font-bold text-slate-900">ما هو {SITE_NAME}؟</h2>
          <p>
            {SITE_NAME} ({SITE_NAME_AR}) منصة إخبارية عربية متخصصة تتابع آخر تطورات عالم الذكاء الاصطناعي
            على مدار الساعة. نرصد أبرز الأخبار من المصادر العالمية الكبرى مثل MIT Technology Review
            وTechCrunch وVentureBeat وغيرها، ثم نقدمها للقارئ العربي باللغة العربية بأسلوب واضح وأمين.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-bold text-slate-900">لماذا أطلقنا المنصة؟</h2>
          <p>
            يشهد عالم الذكاء الاصطناعي تحولات متسارعة تؤثر على كل قطاعات الحياة — من الصحة والتعليم
            إلى الاقتصاد والفن. غير أن المحتوى العربي المتخصص في هذا المجال لا يزال شحيحاً. جاء{" "}
            {SITE_NAME} ليسد هذه الفجوة ويجعل معرفة الذكاء الاصطناعي في متناول كل ناطق بالعربية.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-bold text-slate-900">ما الذي نغطيه؟</h2>
          <ul className="space-y-2 list-disc list-inside">
            <li>النماذج اللغوية الكبرى (LLMs) وتطوراتها</li>
            <li>أبحاث الذكاء الاصطناعي من كبرى الجامعات والمعاهد</li>
            <li>أخبار الشركات التقنية الكبرى: OpenAI، Google، Meta، Anthropic وغيرها</li>
            <li>تطبيقات الذكاء الاصطناعي في القطاعات المختلفة</li>
            <li>السياسات والتشريعات المتعلقة بالذكاء الاصطناعي حول العالم</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-bold text-slate-900">معاييرنا التحريرية</h2>
          <p>
            نحرص على الدقة والأمانة في نقل المعلومات، ونستند دائماً إلى المصادر الأصلية التي نوثقها
            في كل مقال. لا نضيف تحليلات مضللة ولا نبالغ في العناوين. هدفنا القارئ العربي الذي يريد
            فهم الذكاء الاصطناعي لا مجرد الاستثارة.
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-6">
          <h2 className="mb-3 text-xl font-bold text-slate-900">تواصل معنا</h2>
          <p>
            للاستفسارات والشراكات الإعلانية والتعاون التحريري، يسعدنا التواصل عبر:{" "}
            <a href="mailto:hanna.obead@gmail.com" className="font-semibold text-[#667eea] hover:underline">
              hanna.obead@gmail.com
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
