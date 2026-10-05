/**
 * lib/tools/registry.ts
 *
 * Static configuration for the Lumiq Tools platform — no database, no CMS,
 * no admin panel. A tool page looks itself up here for routing, SEO
 * metadata, and hub-listing data from one source of truth. Adding a future
 * tool means one new entry here plus its component; "comingSoon" entries
 * are listed but have no page and must never be linked to a live route.
 */

export type ToolCategory = "الخط العربي" | "التاريخ" | "النصوص" | "الأمان" | "حسابات";

export interface ToolDefinition {
  slug: string;
  nameAr: string;
  shortDescriptionAr: string;
  category: ToolCategory;
  comingSoon?: boolean;
  seo: {
    titleAr: string;
    descriptionAr: string;
  };
}

export const TOOLS: ToolDefinition[] = [
  {
    slug: "arabic-calligraphy",
    nameAr: "استوديو الخط العربي",
    shortDescriptionAr: "حوّل كلماتك إلى تصميم عربي جميل، وحمّله بخلفية شفافة.",
    category: "الخط العربي",
    seo: {
      // No "| Lumiq" suffix here — app/layout.tsx's metadata.title.template
      // ("%s | Lumiq") already appends it to every page's title.
      titleAr: "استوديو الخط العربي — كتابة الأسماء والعبارات بخطوط عربية",
      descriptionAr:
        "اكتب اسمك أو عبارتك بالعربية واختر من أنماط عربية جميلة، ثم حمّل التصميم بصيغة PNG وخلفية شفافة مجانًا.",
    },
  },
  {
    slug: "hijri-date-converter",
    nameAr: "تحويل التاريخ الهجري والميلادي",
    shortDescriptionAr: "حوّل أي تاريخ بين الهجري والميلادي فورًا.",
    category: "التاريخ",
    seo: {
      titleAr: "تحويل التاريخ الهجري والميلادي — محوّل التقويم أونلاين",
      descriptionAr:
        "حوّل أي تاريخ بين التقويم الهجري (أم القرى) والميلادي فورًا ومجانًا — أدخل التاريخ لتعرف ما يقابله واليوم من أيام الأسبوع، مباشرة في متصفحك دون تسجيل.",
    },
  },
  {
    slug: "qr-code-generator",
    nameAr: "إنشاء رمز QR",
    shortDescriptionAr: "أنشئ رمز QR لأي رابط أو نص خلال ثوانٍ.",
    category: "النصوص",
    seo: {
      titleAr: "إنشاء رمز QR مجانًا — مولّد باركود QR لأي رابط أو نص",
      descriptionAr:
        "أنشئ رمز QR لأي رابط أو نص خلال ثوانٍ وحمّله صورة PNG عالية الدقة مجانًا — يعمل مباشرة في متصفحك دون تسجيل ودون رفع بياناتك لأي خادم.",
    },
  },
  {
    slug: "word-counter",
    nameAr: "عدّاد الكلمات والحروف",
    shortDescriptionAr: "احسب عدد الكلمات والحروف والجُمَل وزمن القراءة فورًا.",
    category: "النصوص",
    seo: {
      titleAr: "عدّاد الكلمات والحروف — حساب النص العربي أونلاين",
      descriptionAr:
        "عدّ الكلمات والحروف والجُمَل والأسطر وزمن القراءة لأي نص عربي أو إنجليزي فورًا ومجانًا — يعمل مباشرة في متصفحك دون تسجيل ودون رفع نصك لأي خادم.",
    },
  },
  {
    slug: "age-calculator",
    nameAr: "حاسبة العمر",
    shortDescriptionAr: "احسب عمرك بالتقويمين الميلادي والهجري باليوم.",
    category: "التاريخ",
    seo: {
      titleAr: "حاسبة العمر — احسب عمرك بالميلادي والهجري بالتفصيل",
      descriptionAr:
        "احسب عمرك بالضبط بالسنوات والأشهر والأيام، وبالتقويم الهجري، واعرف يوم مولدك وكم يتبقى على عيد ميلادك القادم — مجانًا ومباشرة في متصفحك.",
    },
  },
  {
    slug: "password-generator",
    nameAr: "مولّد كلمات المرور القوية",
    shortDescriptionAr: "أنشئ كلمة مرور قوية وعشوائية يصعب تخمينها.",
    category: "الأمان",
    seo: {
      titleAr: "مولّد كلمات المرور القوية — إنشاء كلمة سر عشوائية آمنة",
      descriptionAr:
        "أنشئ كلمات مرور قوية وعشوائية يصعب اختراقها، بالطول والرموز التي تختارها — تُنشأ داخل متصفحك فقط ولا تُرسل إلى أي خادم، مجانًا ودون تسجيل.",
    },
  },
  {
    slug: "arabic-text-normalizer",
    nameAr: "منسّق النص العربي",
    shortDescriptionAr: "أزل التشكيل ووحّد الحروف ونسّق النص العربي بسهولة.",
    category: "النصوص",
    seo: {
      titleAr: "منسّق النص العربي — إزالة التشكيل وتوحيد الحروف أونلاين",
      descriptionAr:
        "نسّق نصك العربي مجانًا: إزالة التشكيل، توحيد الألف والهمزة والتاء المربوطة، حذف التطويل، تنظيف المسافات، وتحويل الأرقام — مباشرة في متصفحك دون رفع نصك.",
    },
  },
  {
    slug: "percentage-calculator",
    nameAr: "حاسبة النسبة المئوية",
    shortDescriptionAr: "احسب النسب المئوية والزيادة والنقصان بسهولة.",
    category: "حسابات",
    seo: {
      titleAr: "حاسبة النسبة المئوية — حساب النِّسَب والزيادة والنقصان",
      descriptionAr:
        "احسب النسبة المئوية بسهولة: كم يساوي ٪ من رقم، وكم نسبة رقم من آخر، ونسبة الزيادة أو النقصان بين قيمتين — مجانًا ومباشرة في متصفحك.",
    },
  },
  {
    slug: "unit-converter",
    nameAr: "محوّل الوحدات",
    shortDescriptionAr: "حوّل بين وحدات الطول والوزن ودرجات الحرارة.",
    category: "حسابات",
    seo: {
      titleAr: "محوّل الوحدات — تحويل الطول والوزن ودرجة الحرارة",
      descriptionAr:
        "حوّل بين وحدات الطول (متر، كيلومتر، ميل، إنش) والوزن (كيلوغرام، غرام، رطل) ودرجات الحرارة (مئوية، فهرنهايت، كلفن) فورًا ومجانًا في متصفحك.",
    },
  },
  {
    slug: "tafqit",
    nameAr: "تفقيط الأرقام",
    shortDescriptionAr: "حوّل أي مبلغ رقمي إلى كتابة بالحروف العربية للفواتير والشيكات.",
    category: "حسابات",
    seo: {
      titleAr: "تفقيط الأرقام — تحويل المبلغ إلى كتابة بالحروف العربية",
      descriptionAr:
        "حوّل أي رقم أو مبلغ إلى كتابة بالحروف العربية الصحيحة (تفقيط) للفواتير والشيكات — بعدة عملات وصيغة \"فقط ... لا غير\"، مجانًا ومباشرة في متصفحك.",
    },
  },
  {
    slug: "bmi-calculator",
    nameAr: "حاسبة مؤشر كتلة الجسم",
    shortDescriptionAr: "احسب مؤشر كتلة جسمك (BMI) وتعرّف على تصنيفك ووزنك الصحي.",
    category: "حسابات",
    seo: {
      titleAr: "حاسبة مؤشر كتلة الجسم (BMI) — احسب وزنك المثالي",
      descriptionAr:
        "احسب مؤشر كتلة الجسم (BMI) من وزنك وطولك، واعرف تصنيفك حسب منظمة الصحة العالمية ونطاق وزنك الصحي — مجانًا ومباشرة في متصفحك.",
    },
  },
];

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return TOOLS.find((t) => t.slug === slug && !t.comingSoon);
}

export function getLiveTools(): ToolDefinition[] {
  return TOOLS.filter((t) => !t.comingSoon);
}

export function getComingSoonTools(): ToolDefinition[] {
  return TOOLS.filter((t) => t.comingSoon);
}
