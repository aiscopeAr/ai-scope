const FAQ_ITEMS = [
  {
    q: "ما هي أداة محوّل الوحدات؟",
    a: "أداة مجانية من Lumiq تحوّل بين وحدات القياس الشائعة: الطول (متر، سنتيمتر، كيلومتر، ميل، إنش، قدم)، والوزن (كيلوغرام، غرام، رطل، أونصة)، ودرجات الحرارة (مئوية، فهرنهايت، كلفن) — مباشرة في متصفحك.",
  },
  {
    q: "كيف أحوّل بين الوحدات؟",
    a: "اختر الفئة (الطول أو الوزن أو الحرارة)، أدخل القيمة، ثم اختر الوحدة المصدر والوحدة الهدف، وستظهر النتيجة فورًا.",
  },
  {
    q: "كيف أحوّل من مئوية إلى فهرنهايت؟",
    a: "اختر فئة الحرارة، وحوّل من مئوية إلى فهرنهايت. مثلًا 0°C = 32°F و100°C = 212°F.",
  },
  {
    q: "كم يساوي الكيلوغرام بالرطل؟",
    a: "1 كيلوغرام ≈ 2.20 رطل (باوند). اختر فئة الوزن وحوّل من كيلوغرام إلى رطل.",
  },
  {
    q: "هل التحويل دقيق؟",
    a: "نعم، تعتمد الأداة على معاملات التحويل القياسية المعتمدة دوليًا، ويتم الحساب داخل متصفحك دون إرسال بيانات.",
  },
];

export default function UnitConverterFaq() {
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
