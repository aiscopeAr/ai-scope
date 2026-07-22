export const TOOL_CATEGORIES = [
  { value: "writing",          labelAr: "الكتابة والمحتوى",      icon: "✍️",  descAr: "أدوات AI لكتابة المقالات والنصوص والمحتوى الرقمي" },
  { value: "coding",           labelAr: "البرمجة والتطوير",       icon: "💻",  descAr: "مساعدات برمجية ذكية لكتابة الكود وتصحيحه" },
  { value: "image",            labelAr: "توليد الصور",            icon: "🎨",  descAr: "أدوات إنشاء وتحرير الصور بالذكاء الاصطناعي" },
  { value: "video",            labelAr: "الفيديو والتحريك",       icon: "🎬",  descAr: "أدوات إنتاج وتحرير الفيديو بتقنيات AI" },
  { value: "voice",            labelAr: "الصوت والموسيقى",        icon: "🎵",  descAr: "تحويل النص إلى كلام وتوليد الموسيقى بالذكاء الاصطناعي" },
  { value: "search",           labelAr: "البحث والإجابات",        icon: "🔍",  descAr: "محركات بحث ذكية تجيب على الأسئلة بمصادر موثقة" },
  { value: "marketing",        labelAr: "التسويق والإعلان",       icon: "📢",  descAr: "أدوات AI لحملات التسويق وتحليل الجمهور" },
  { value: "education",        labelAr: "التعليم والتدريب",       icon: "📚",  descAr: "منصات تعليمية ذكية ومساعدين للتعلم" },
  { value: "startups",         labelAr: "الشركات الناشئة",        icon: "🚀",  descAr: "أدوات AI للمؤسسين وبناء المنتجات" },
  { value: "ecommerce",        labelAr: "التجارة الإلكترونية",    icon: "🛒",  descAr: "حلول AI لتحسين المتاجر الإلكترونية" },
  { value: "automation",       labelAr: "الأتمتة والتشغيل",      icon: "⚡",  descAr: "أتمتة المهام والعمليات التجارية بالذكاء الاصطناعي" },
  { value: "customer-support", labelAr: "خدمة العملاء",           icon: "💬",  descAr: "روبوتات محادثة وحلول دعم العملاء بالـ AI" },
  { value: "productivity",     labelAr: "الإنتاجية",              icon: "📋",  descAr: "أدوات AI لتنظيم الوقت وزيادة الإنتاجية" },
  { value: "legal",            labelAr: "القانون والامتثال",      icon: "⚖️",  descAr: "حلول AI للمراجعة القانونية وصياغة العقود" },
  { value: "finance",          labelAr: "المال والاستثمار",       icon: "💰",  descAr: "أدوات AI للتحليل المالي واتخاذ القرارات" },
  { value: "healthcare",       labelAr: "الصحة والطب",            icon: "🏥",  descAr: "تطبيقات الذكاء الاصطناعي في الرعاية الصحية" },
  { value: "students",         labelAr: "أدوات الطلاب",           icon: "🎓",  descAr: "مساعدات AI للطلاب والبحث الأكاديمي" },
  { value: "no-code",          labelAr: "بدون برمجة",             icon: "🔧",  descAr: "بناء التطبيقات والمواقع بدون كتابة كود" },
  { value: "presentations",    labelAr: "العروض التقديمية",       icon: "📊",  descAr: "أدوات AI لإنشاء شرائح وعروض تقديمية احترافية" },
  { value: "other",            labelAr: "أخرى",                   icon: "🌐",  descAr: "أدوات الذكاء الاصطناعي الأخرى" },
] as const;

export type ToolCategoryValue = (typeof TOOL_CATEGORIES)[number]["value"];

export function getCategoryMeta(value: string) {
  return TOOL_CATEGORIES.find((c) => c.value === value) ?? TOOL_CATEGORIES[TOOL_CATEGORIES.length - 1];
}
