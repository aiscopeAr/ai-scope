import type { Metadata } from "next";
import { SITE_NAME, SITE_NAME_AR, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: `الشروط والأحكام | ${SITE_NAME_AR}`,
  description:
    "شروط استخدام منصة AI Scope — تعرف على حقوقك والتزاماتك عند استخدام المنصة والمحتوى المنشور فيها.",
  alternates: { canonical: absoluteUrl("/terms") },
};

export default function TermsPage() {
  return (
    <section className="container mx-auto max-w-3xl px-4 py-16" dir="rtl">
      <h1 className="mb-4 text-4xl font-black text-slate-900">الشروط والأحكام</h1>
      <p className="mb-10 text-slate-500">آخر تحديث: مايو 2026</p>

      <div className="space-y-8 leading-8 text-slate-700">
        <div>
          <h2 className="mb-3 text-xl font-bold text-slate-900">1. القبول بالشروط</h2>
          <p>
            باستخدامك لموقع {SITE_NAME} فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت
            لا توافق على أي من هذه الشروط، يُرجى التوقف عن استخدام الموقع.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-bold text-slate-900">2. طبيعة المحتوى</h2>
          <p>
            يقدم {SITE_NAME} ترجمات وملخصات لأخبار الذكاء الاصطناعي مستقاة من مصادر عالمية موثوقة.
            المحتوى مقدم للأغراض الإعلامية فحسب. نحرص على الدقة لكننا لا نضمن خلو المحتوى من
            الأخطاء، ولا نتحمل المسؤولية عن أي قرارات تُتخذ بناءً على المعلومات المنشورة.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-bold text-slate-900">3. الملكية الفكرية</h2>
          <p>
            المحتوى المترجم والمحرر على {SITE_NAME} هو ملك للمنصة. المصادر الأصلية تعود ملكيتها
            لأصحابها ونوثقها دائماً في كل مقال. يُحظر نقل محتوى المنصة أو إعادة نشره دون إذن
            كتابي مسبق.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-bold text-slate-900">4. الروابط الخارجية</h2>
          <p>
            يحتوي الموقع على روابط لمواقع خارجية. هذه الروابط مقدمة للمرجعية فحسب، ولا نتحمل
            المسؤولية عن محتوى هذه المواقع أو سياسات خصوصيتها.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-bold text-slate-900">5. الإعلانات</h2>
          <p>
            قد يحتوي الموقع على إعلانات من شركات خارجية. وجود هذه الإعلانات لا يعني تأييدنا
            للمنتجات أو الخدمات المعلن عنها.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-bold text-slate-900">6. تحديد المسؤولية</h2>
          <p>
            يُقدَّم الموقع "كما هو" دون أي ضمانات صريحة أو ضمنية. لا تتحمل المنصة المسؤولية
            عن أي أضرار مباشرة أو غير مباشرة ناجمة عن استخدام الموقع أو عدم إمكانية الوصول إليه.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-bold text-slate-900">7. التعديلات</h2>
          <p>
            نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيُعلن عن التعديلات بتحديث تاريخ
            آخر مراجعة أعلى هذه الصفحة.
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-6">
          <p className="text-sm text-slate-500">
            للاستفسار عن هذه الشروط تواصل معنا:{" "}
            <a href="mailto:hanna.obead@gmail.com" className="font-semibold text-[#667eea] hover:underline">
              hanna.obead@gmail.com
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
