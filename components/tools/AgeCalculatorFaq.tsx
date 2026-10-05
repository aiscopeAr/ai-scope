const FAQ_ITEMS = [
  {
    q: "ما هي حاسبة العمر؟",
    a: "أداة مجانية من Lumiq تحسب عمرك بدقة بالسنوات والأشهر والأيام انطلاقًا من تاريخ ميلادك، وتعرض عمرك بالتقويم الهجري، ويوم مولدك، وكم يتبقى على عيد ميلادك القادم — مباشرة في متصفحك.",
  },
  {
    q: "كيف أحسب عمري؟",
    a: "أدخل تاريخ ميلادك، وستظهر النتيجة فورًا. يمكنك أيضًا تغيير \"التاريخ المرجعي\" لتحسب عمرك في أي يوم ماضٍ أو مستقبلي.",
  },
  {
    q: "كيف يُحسب العمر بالهجري؟",
    a: "يُحسب بتحويل تاريخ ميلادك وتاريخ اليوم إلى التقويم الهجري (أم القرى) وحساب الفرق بالسنوات. ولأن السنة الهجرية أقصر بنحو 11 يومًا، يكون العمر بالهجري عادةً أكبر قليلًا من الميلادي.",
  },
  {
    q: "هل الحساب دقيق مع الأشهر المختلفة الطول؟",
    a: "نعم، تأخذ الأداة في الاعتبار اختلاف أطوال الأشهر والسنوات الكبيسة، فتعطي تقسيمًا صحيحًا للسنوات والأشهر والأيام.",
  },
  {
    q: "هل تُحفظ بياناتي؟",
    a: "لا. الحساب كله يتم داخل متصفحك، ولا يُرسل تاريخ ميلادك إلى أي خادم.",
  },
];

export default function AgeCalculatorFaq() {
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
