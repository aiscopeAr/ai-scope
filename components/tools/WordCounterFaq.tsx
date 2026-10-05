const FAQ_ITEMS = [
  {
    q: "ما هي أداة عدّ الكلمات والحروف؟",
    a: "أداة مجانية من Lumiq تحسب فورًا عدد الكلمات والحروف والجُمَل والأسطر وزمن القراءة التقريبي لأي نص تكتبه أو تلصقه — عربيًا كان أو إنجليزيًا — مباشرة في متصفحك دون تسجيل.",
  },
  {
    q: "كيف تُحسب الكلمات والحروف؟",
    a: "تُحسب الكلمات بالفصل عند المسافات، وتُحسب الحروف بطريقة تدعم الحروف العربية والرموز بشكل صحيح، مع عرض عدد الحروف بالمسافات وبدونها.",
  },
  {
    q: "كيف يُحسب زمن القراءة؟",
    a: "بتقدير متوسط سرعة قراءة نحو 200 كلمة في الدقيقة، وهو تقدير تقريبي يفيد في معرفة طول المحتوى.",
  },
  {
    q: "هل الأداة مفيدة لكتّاب المحتوى والطلاب؟",
    a: "نعم، تساعد على الالتزام بحدود عدد الكلمات في المقالات والمنشورات والأبحاث والوصف التعريفي (meta description) وغيرها.",
  },
  {
    q: "هل يُرفع نصي إلى الخادم؟",
    a: "لا. العدّ كله يتم داخل متصفحك، ولا يغادر نصك جهازك.",
  },
];

export default function WordCounterFaq() {
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
