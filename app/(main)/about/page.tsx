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

        {/* Transparency section — important for AdSense & reader trust */}
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-6">
          <h2 className="mb-3 text-xl font-bold text-slate-900">شفافية كاملة: كيف نعمل؟</h2>
          <p className="mb-4">
            نؤمن بالصدق مع قرائنا. إليك بالضبط كيف تصل الأخبار إليك:
          </p>
          <ol className="space-y-3 list-decimal list-inside text-slate-600">
            <li>
              <span className="font-semibold text-slate-800">الرصد الآلي:</span>{" "}
              نتابع عشرات المصادر الإخبارية العالمية الموثوقة تلقائياً على مدار الساعة.
            </li>
            <li>
              <span className="font-semibold text-slate-800">المعالجة بالذكاء الاصطناعي:</span>{" "}
              نستخدم نماذج AI لإعادة كتابة المحتوى بالعربية — لا ترجمة حرفية، بل إعادة صياغة
              تراعي القارئ العربي وتضيف سياقاً وتحليلاً.
            </li>
            <li>
              <span className="font-semibold text-slate-800">المراجعة التحريرية:</span>{" "}
              لا يُنشر أي مقال دون مرور بمراجعة بشرية تتحقق من الدقة وجودة المحتوى.
            </li>
            <li>
              <span className="font-semibold text-slate-800">التوثيق:</span>{" "}
              كل مقال يتضمن رابط المصدر الأصلي لمن يرغب في التعمق أكثر.
            </li>
          </ol>
          <p className="mt-4 text-sm text-slate-500">
            هذا النهج يتيح لنا تغطية واسعة بجودة عالية — وهو ما يميّز {SITE_NAME} عن المدونات
            الفردية من جهة، وعن المواقع التي تكتفي بالترجمة الآلية من جهة أخرى.
          </p>
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
