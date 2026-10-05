const FAQ_ITEMS = [
  {
    q: "ما هي حاسبة النسبة المئوية؟",
    a: "أداة مجانية من Lumiq تحسب النسب المئوية بثلاث طرق: كم يساوي نسبة من رقم، وكم تمثّل قيمة من إجمالي، ونسبة الزيادة أو النقصان بين قيمتين — مباشرة في متصفحك.",
  },
  {
    q: "كيف أحسب نسبة من رقم؟",
    a: "اختر \"٪ من رقم\"، وأدخل النسبة والرقم. مثلًا 25٪ من 200 = 50.",
  },
  {
    q: "كيف أعرف نسبة رقم من آخر؟",
    a: "اختر \"نسبة رقم من آخر\"، وأدخل الرقم والإجمالي. مثلًا 50 من 200 = 25٪.",
  },
  {
    q: "كيف أحسب نسبة الزيادة أو النقصان؟",
    a: "اختر \"الزيادة / النقصان\"، وأدخل القيمة الأصلية ثم الجديدة. تظهر النتيجة موجبة للزيادة وسالبة للنقصان، مثل من 100 إلى 150 = ‎+50٪.",
  },
  {
    q: "هل تُحفظ أرقامي؟",
    a: "لا. الحساب كله يتم داخل متصفحك، ولا تُرسل أي بيانات إلى خادم.",
  },
];

export default function PercentageCalculatorFaq() {
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
