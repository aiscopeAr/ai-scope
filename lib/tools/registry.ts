/**
 * lib/tools/registry.ts
 *
 * Static configuration for the Lumiq Tools platform — no database, no CMS,
 * no admin panel. A tool page looks itself up here for routing, SEO
 * metadata, and hub-listing data from one source of truth. Adding a future
 * tool means one new entry here plus its component; "comingSoon" entries
 * are listed but have no page and must never be linked to a live route.
 */

export type ToolCategory = "الخط العربي" | "التاريخ" | "النصوص";

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
