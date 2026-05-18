import type { Metadata } from "next";
import { SITE_NAME, SITE_NAME_AR, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: `سياسة الخصوصية | ${SITE_NAME_AR}`,
  description:
    "تعرف على كيفية جمع AI Scope للبيانات واستخدامها وحمايتها، وحقوقك كمستخدم لمنصتنا.",
  alternates: { canonical: absoluteUrl("/privacy") },
};

export default function PrivacyPage() {
  return (
    <section className="container mx-auto max-w-3xl px-4 py-16" dir="rtl">
      <h1 className="mb-4 text-4xl font-black text-slate-900">سياسة الخصوصية</h1>
      <p className="mb-10 text-slate-500">آخر تحديث: مايو 2026</p>

      <div className="space-y-8 leading-8 text-slate-700">
        <div>
          <h2 className="mb-3 text-xl font-bold text-slate-900">1. المعلومات التي نجمعها</h2>
          <p>
            عند زيارتك لموقع {SITE_NAME}، قد نجمع معلومات غير شخصية تلقائياً مثل نوع المتصفح،
            الجهاز المستخدم، الصفحات التي تزورها، ومصدر الزيارة. هذه البيانات مجهولة الهوية
            ولا تُستخدم إلا لتحسين تجربة المستخدم.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-bold text-slate-900">2. ملفات تعريف الارتباط (Cookies)</h2>
          <p>
            نستخدم ملفات تعريف الارتباط لأغراض تحليلية عبر Google Analytics 4 لفهم كيفية تصفح
            الزوار للموقع. لا نستخدم cookies لتتبع الهوية الشخصية. يمكنك تعطيل cookies من
            إعدادات متصفحك في أي وقت.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-bold text-slate-900">3. Google Analytics</h2>
          <p>
            نستخدم Google Analytics 4 لتحليل حركة الزوار. تخضع هذه الخدمة لسياسة خصوصية
            Google المستقلة. البيانات المجمعة مجهولة الهوية ولا تتيح لنا التعرف على هوية
            الزوار بشكل شخصي.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-bold text-slate-900">4. الإعلانات</h2>
          <p>
            قد تظهر على الموقع إعلانات من شبكات إعلانية خارجية. هذه الشبكات قد تستخدم cookies
            خاصة بها وفق سياساتها المستقلة. لا نتحكم في هذه الملفات ولا نشارك بياناتك الشخصية
            معها.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-bold text-slate-900">5. أمان البيانات</h2>
          <p>
            نتخذ إجراءات تقنية معقولة لحماية بيانات الموقع، بما في ذلك استخدام HTTPS وقواعد
            بيانات مؤمّنة. لا نبيع أي بيانات لأطراف ثالثة.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-bold text-slate-900">6. حقوقك</h2>
          <p>
            يحق لك في أي وقت طلب معرفة البيانات التي نحتفظ بها المتعلقة بزيارتك، أو طلب حذفها.
            للتواصل بشأن ذلك راسلنا على:{" "}
            <a href="mailto:hanna.obead@gmail.com" className="text-[#667eea] hover:underline font-semibold">
              hanna.obead@gmail.com
            </a>
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-bold text-slate-900">7. التعديلات على هذه السياسة</h2>
          <p>
            قد نحدّث هذه السياسة من وقت لآخر. سيُنشر تاريخ آخر تحديث في أعلى هذه الصفحة.
            استمرارك في استخدام {SITE_NAME} بعد أي تعديل يُعدّ قبولاً للسياسة المحدّثة.
          </p>
        </div>
      </div>
    </section>
  );
}
