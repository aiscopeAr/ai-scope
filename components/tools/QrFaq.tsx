const FAQ_ITEMS = [
  {
    q: "ما هي أداة إنشاء رمز QR؟",
    a: "أداة مجانية من Lumiq تنشئ رمز QR (باركود ثنائي الأبعاد) لأي رابط أو نص، وتتيح لك تحميله صورة PNG عالية الدقة — كل ذلك مباشرة في متصفحك دون تسجيل.",
  },
  {
    q: "كيف أنشئ رمز QR؟",
    a: "الصق الرابط أو اكتب النص في الحقل، اختر حجم الصورة، وستظهر المعاينة فورًا. ثم اضغط \"تحميل PNG\" لحفظ الرمز على جهازك.",
  },
  {
    q: "هل يمكن استخدام رمز QR في الطباعة؟",
    a: "نعم، اختر الحجم الكبير للحصول على صورة عالية الدقة مناسبة للملصقات والبطاقات والمطبوعات، إذ يبقى الرمز واضحًا عند التكبير.",
  },
  {
    q: "هل ينتهي صلاحية رمز QR؟",
    a: "لا. الرمز الذي تنشئه هنا ثابت (static) ويشير مباشرة إلى الرابط أو النص الذي أدخلته، فيعمل إلى الأبد دون اشتراك أو خدمة وسيطة.",
  },
  {
    q: "ما نوع المحتوى الذي يمكن تحويله؟",
    a: "أي رابط موقع، أو نص عادي، أو معلومات تواصل، أو رسالة — أي نص يمكن قراءته يمكن تحويله إلى رمز QR.",
  },
  {
    q: "هل يُرفع الرابط الذي أدخله إلى الخادم؟",
    a: "لا. إنشاء الرمز يتم بالكامل داخل متصفحك، ولا يغادر الرابط أو النص جهازك.",
  },
];

const USE_CASES = [
  "روابط المواقع",
  "قوائم المطاعم",
  "بطاقات العمل",
  "دعوات المناسبات",
  "حسابات التواصل",
  "شبكة الواي فاي",
  "الملصقات والمطبوعات",
];

export default function QrFaq() {
  return (
    <section className="container mx-auto max-w-3xl px-4 py-14" dir="rtl">
      <h2 className="mb-6 text-2xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
        استخدامات رمز QR
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
