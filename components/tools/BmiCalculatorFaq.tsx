const FAQ_ITEMS = [
  {
    q: "ما هو مؤشر كتلة الجسم (BMI)؟",
    a: "مؤشر كتلة الجسم مقياس يربط بين وزنك وطولك لتقدير ما إذا كان وزنك ضمن النطاق الصحي. يُحسب بقسمة الوزن بالكيلوغرام على مربّع الطول بالمتر.",
  },
  {
    q: "كيف أحسب مؤشر كتلة جسمي؟",
    a: "أدخل وزنك بالكيلوغرام وطولك بالسنتيمتر، وستظهر قيمة المؤشر وتصنيفه ونطاق وزنك الصحي فورًا داخل متصفحك.",
  },
  {
    q: "ما هي تصنيفات المؤشر؟",
    a: "حسب منظمة الصحة العالمية: أقل من 18.5 نقص في الوزن، 18.5–24.9 وزن طبيعي، 25–29.9 زيادة في الوزن، 30–34.9 سمنة من الدرجة الأولى، 35–39.9 سمنة من الدرجة الثانية، و40 فأكثر سمنة مفرطة.",
  },
  {
    q: "هل المؤشر دقيق للجميع؟",
    a: "المؤشر دليل عام ولا يفرّق بين الكتلة العضلية والدهون، لذا قد لا يكون دقيقًا للرياضيين أو كبار السن أو الحوامل. اعتبره مؤشرًا أوليًا لا تشخيصًا طبيًا.",
  },
  {
    q: "هل تُحفظ بياناتي؟",
    a: "لا. الحساب كله يتم داخل متصفحك، ولا يُرسل وزنك أو طولك إلى أي خادم.",
  },
];

export default function BmiCalculatorFaq() {
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
