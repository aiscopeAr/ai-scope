/**
 * lib/ads/positions.ts
 *
 * Single source of truth for ad positions, formats and networks, shared by the
 * public renderer (components/AdSlot.tsx) and the admin UI (app/admin/ads).
 * Previously the admin listed 8 positions while the renderer accepted ~30, so
 * some positions could never be filled and a couple were spelled differently
 * (homepage-top vs home-top). Keep both ends importing from here.
 */

/** Every position the renderer may mount an inline <AdSlot> at. Superset — safe
 *  to extend; admin only needs to EXPOSE the ones worth filling (see ADMIN_POSITIONS). */
export const AD_POSITIONS = [
  "header",
  "home-top", "home-mid", "home-bottom", "homepage-top", "homepage-mid",
  "article-top", "article-mid", "article-bottom",
  "sidebar",
  "category-top",
  "guides-top", "guide-top", "guide-mid",
  "ai-tools-top", "ai-tools-mid", "tool-top", "tool-mid",
  "companies-top", "company-top", "company-mid",
  "compare-top", "compare-page-top", "compare-page-mid",
  "topic-top", "alternatives-top", "search-top",
] as const;

export type AdPosition = (typeof AD_POSITIONS)[number];

/** Human (Arabic) labels for the positions worth exposing in the admin form.
 *  Only these appear in the "position" dropdown; the renderer still accepts the
 *  full AD_POSITIONS superset for any slot created programmatically. */
export const ADMIN_POSITIONS: { value: AdPosition; label: string }[] = [
  { value: "header",        label: "رأس الصفحة (Header)" },
  { value: "home-top",      label: "الرئيسية — أعلى" },
  { value: "home-mid",      label: "الرئيسية — وسط" },
  { value: "article-top",   label: "المقال — أعلى" },
  { value: "article-mid",   label: "المقال — وسط" },
  { value: "article-bottom",label: "المقال — أسفل" },
  { value: "sidebar",       label: "الشريط الجانبي" },
  { value: "category-top",  label: "صفحة التصنيف — أعلى" },
  { value: "ai-tools-top",  label: "صفحة الأدوات — أعلى" },
  { value: "search-top",    label: "صفحة البحث — أعلى" },
];

/** Ad render formats. `inline` = in page flow (today's behaviour). The rest are
 *  overlay/anchored formats mounted globally by AdManager (Phase 2). */
export const AD_FORMATS = ["inline", "sticky-bottom", "popup", "interstitial", "sidebar-sticky"] as const;
export type AdFormat = (typeof AD_FORMATS)[number];

export const ADMIN_FORMATS: { value: AdFormat; label: string; hint: string }[] = [
  { value: "inline",         label: "ضمن المحتوى", hint: "يظهر داخل تدفّق الصفحة في الموضع المحدد" },
  { value: "sticky-bottom",  label: "شريط سفلي ثابت", hint: "لافتة ملتصقة بأسفل الشاشة مع زر إغلاق" },
  { value: "popup",          label: "نافذة منبثقة", hint: "تظهر فوق المحتوى — يجب إغلاقها" },
  { value: "interstitial",   label: "إعلان بيني (ملء الشاشة)", hint: "ملء الشاشة بين التنقّلات مع عدّاد وإغلاق" },
  { value: "sidebar-sticky", label: "جانبي ثابت عند التمرير", hint: "وحدة ملتصقة في الشريط الجانبي أثناء التمرير" },
];

/** Ad content types (how `code` is interpreted). */
export const AD_TYPES = ["script", "iframe", "image"] as const;
export type AdType = (typeof AD_TYPES)[number];

/** Ad networks. `direct` = house ads (image/iframe) that need no consent. The
 *  script networks load only after consent (Phase 3). */
export const AD_NETWORKS = ["direct", "adsense", "taboola", "outbrain"] as const;
export type AdNetwork = (typeof AD_NETWORKS)[number];

/** Networks whose ad scripts require user consent before loading (EEA/UK). */
export const CONSENT_REQUIRED_NETWORKS: AdNetwork[] = ["adsense", "taboola", "outbrain"];
