const FAQ_ITEMS = [
  {
    q: "ما هي أداة توليد كلمات المرور؟",
    a: "أداة مجانية من Lumiq تنشئ كلمات مرور قوية وعشوائية يصعب تخمينها أو اختراقها، بالطول ونوع الرموز التي تختارها — مباشرة في متصفحك دون تسجيل.",
  },
  {
    q: "هل كلمة المرور آمنة؟",
    a: "نعم. تُولَّد باستخدام مولّد أرقام عشوائية آمن تشفيريًا (CSPRNG) داخل متصفحك، ولا تُرسل إلى أي خادم ولا تُحفظ في أي مكان.",
  },
  {
    q: "ما طول كلمة المرور المناسب؟",
    a: "يُنصح بـ 16 حرفًا فأكثر مع تفعيل الأحرف الكبيرة والصغيرة والأرقام والرموز للحصول على كلمة مرور قوية جدًا يصعب كسرها.",
  },
  {
    q: "لماذا تُستبعد بعض الحروف المتشابهة؟",
    a: "نستبعد الحروف والأرقام المتشابهة بصريًا (مثل I و l و1 و O و0) لتسهيل قراءة كلمة المرور ونسخها دون التباس.",
  },
  {
    q: "هل تُحفظ كلمات المرور التي أنشئها؟",
    a: "لا. كل كلمة مرور تُولَّد لحظيًا داخل جهازك ولا تغادره؛ أغلق الصفحة وتختفي تمامًا.",
  },
];

export default function PasswordGeneratorFaq() {
  return (
    <section className="container mx-auto max-w-3xl px-4 py-14" dir="rtl">
      <h2 className="mb-6 text-2xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
        الأسئلة الشائعة
      </h2>
      <div className="flex flex-col gap-6">
        {FAQ_ITEMS.map((item) => (
          <div key={item.q}>
            <h3 className="mb-1.5 text-base font-semibold" style={{ color: "var(--text-primary)" }}>
              {item.q}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {item.a}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export { FAQ_ITEMS };
