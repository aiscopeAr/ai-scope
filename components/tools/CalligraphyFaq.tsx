const FAQ_ITEMS = [
  {
    q: "ما هو استوديو الخط العربي؟",
    a: "أداة مجانية من Lumiq تتيح لك كتابة اسم أو عبارة بالعربية، واختيار نمط بصري من بين خمسة أنماط، ثم تحميل النتيجة كصورة PNG بخلفية شفافة — كل ذلك مباشرة في متصفحك دون تسجيل.",
  },
  {
    q: "كيف تستخدم الأداة؟",
    a: "اكتب النص في الحقل، اختر النمط والحجم واللون والخلفية التي تناسبك، وعاين النتيجة فورًا. عند الرضا عن التصميم، اضغط \"تحميل PNG\" لحفظ الصورة على جهازك.",
  },
  {
    q: "ما الفرق بين الخط العربي والخطوط الطباعية؟",
    a: "الخط العربي التقليدي (كالثلث والديواني) فن يدوي بقواعد هندسية دقيقة يُنفَّذه خطاطون متخصصون. هذه الأداة تستخدم خطوطًا طباعية عربية احترافية مرخّصة بعناية — نسخ كلاسيكي، وكوفي، ورقعة، وتصميم عرض فني — مع محرك تشكيل عربي صحيح في المتصفح، وليست محاكاة يدوية لكل نمط خط تاريخي.",
  },
  {
    q: "هل يمكن تحميل التصميم بخلفية شفافة؟",
    a: "نعم، اختر \"شفافة\" من خيارات الخلفية قبل التحميل — مفيدة للطباعة، والدعوات، والتصاميم التي ستُدمَج في عمل آخر.",
  },
  {
    q: "هل يعمل على الهاتف؟",
    a: "نعم، الأداة مصمَّمة لتعمل بشكل كامل على الهاتف، من الكتابة حتى التحميل.",
  },
  {
    q: "هل النص الذي أكتبه يُرفع إلى الخادم؟",
    a: "لا. النص والتصميم والتصدير كلها تتم مباشرة على جهازك داخل المتصفح، ولا يغادر النص جهازك أبدًا.",
  },
];

const USE_CASES = [
  "أسماء",
  "بطاقات زفاف",
  "تهاني",
  "أعياد ميلاد",
  "شعارات شخصية",
  "منشورات اجتماعية",
  "طباعة وهدايا",
];

export default function CalligraphyFaq() {
  return (
    <section className="container mx-auto max-w-3xl px-4 py-14" dir="rtl">
      <h2 className="mb-6 text-2xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
        أفكار لاستخدام التصميم
      </h2>
      <ul className="mb-12 flex flex-wrap gap-2">
        {USE_CASES.map((u) => (
          <li
            key={u}
            className="rounded-[3px] px-3 py-1.5 text-sm font-medium"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}
          >
            {u}
          </li>
        ))}
      </ul>

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
