import { HIJRI_MONTHS_AR } from "@/lib/tools/hijri";

const FAQ_ITEMS = [
  {
    q: "ما هي أداة تحويل التاريخ الهجري والميلادي؟",
    a: "أداة مجانية من Lumiq تحوّل أي تاريخ بين التقويم الهجري والتقويم الميلادي في الاتجاهين، وتعرض لك اليوم المقابل من أيام الأسبوع. تعمل مباشرة في المتصفح دون تسجيل ودون إرسال أي بيانات إلى خادم.",
  },
  {
    q: "على أي تقويم هجري يعتمد التحويل؟",
    a: "يعتمد على تقويم أم القرى، وهو التقويم الهجري الرسمي المعتمد في المملكة العربية السعودية ودول الخليج للأغراض المدنية. لهذا قد يختلف اليوم بيوم واحد عن الرؤية الشرعية للهلال في بعض الأشهر.",
  },
  {
    q: "هل التحويل دقيق؟",
    a: "نعم، يستخدم جداول أم القرى المدمجة في المتصفح نفسها، وليس حسابًا تقريبيًا. وهو مطابق للتقويم الرسمي ضمن المدى المدعوم (تقريبًا من 1300 إلى 1600 هجريًا).",
  },
  {
    q: "لماذا يختلف التاريخ أحيانًا عن التقويم المعلن؟",
    a: "التقويم المدني (أم القرى) يُحسب فلكيًا مسبقًا، بينما تُحدَّد بدايات الأشهر الدينية كرمضان والعيد بالرؤية الشرعية للهلال. لذلك قد يفرق يوم واحد بين الحساب والإعلان الرسمي للمناسبات.",
  },
  {
    q: "هل يمكنني التحويل من الهجري إلى الميلادي والعكس؟",
    a: "نعم، بدّل اتجاه التحويل من الأعلى: أدخل تاريخًا ميلاديًا لتعرف ما يقابله هجريًا، أو أدخل اليوم والشهر والسنة الهجرية لتعرف التاريخ الميلادي المقابل.",
  },
  {
    q: "هل تُرفع بياناتي إلى الخادم؟",
    a: "لا. التحويل كله يتم داخل متصفحك، ولا يغادر أي تاريخ تُدخله جهازك.",
  },
];

export default function HijriFaq() {
  return (
    <section className="container mx-auto max-w-3xl px-4 py-14" dir="rtl">
      <h2 className="mb-4 text-2xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
        الأشهر الهجرية بالترتيب
      </h2>
      <ol className="mb-12 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {HIJRI_MONTHS_AR.map((name, i) => (
          <li
            key={name}
            className="rounded-[3px] px-3 py-1.5 text-sm font-medium"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}
          >
            {i + 1}. {name}
          </li>
        ))}
      </ol>

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
