const FAQ_ITEMS = [
  {
    q: "ما هي أداة منسّق النص العربي؟",
    a: "أداة مجانية من Lumiq تنظّف النص العربي وتوحّده: إزالة التشكيل، توحيد الألف والهمزة والتاء المربوطة، حذف التطويل، تنظيف المسافات الزائدة، وتحويل الأرقام — كل ذلك داخل متصفحك دون تسجيل.",
  },
  {
    q: "ما معنى إزالة التشكيل؟",
    a: "إزالة الحركات (الفتحة والضمة والكسرة والشدة والتنوين) من الحروف، فيتحوّل مثلًا \"مُحَمَّد\" إلى \"محمد\". مفيد للبحث والفهرسة ومعالجة النصوص.",
  },
  {
    q: "ما فائدة توحيد الحروف؟",
    a: "يوحّد الحروف المتشابهة (أ إ آ ← ا، ى ← ي، ة ← ه) ليصبح النص قابلًا للمطابقة والبحث دون اختلافات إملائية، وهو ما يُعرف بتطبيع النص (normalization).",
  },
  {
    q: "ما هو التطويل (الكشيدة)؟",
    a: "التطويل (ـــ) هو المدّة التي تُطيل الحرف بصريًا دون تغيير معناه، مثل \"محـــمد\". تحذفها الأداة لتوحيد النص.",
  },
  {
    q: "هل يُرفع نصي إلى الخادم؟",
    a: "لا. كل المعالجة تتم داخل متصفحك، ولا يغادر نصك جهازك.",
  },
];

export default function ArabicTextNormalizerFaq() {
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
