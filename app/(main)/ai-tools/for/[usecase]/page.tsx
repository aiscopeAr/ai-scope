import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { absoluteUrl, SITE_NAME_AR, SITE_URL } from "@/lib/seo";
import { TOOL_CATEGORIES, getCategoryMeta } from "@/lib/tool-categories";
import AdSlot from "@/components/AdSlot";
import Breadcrumbs from "@/components/Breadcrumbs";
import { buildBreadcrumbJsonLd } from "@/lib/breadcrumb-jsonld";
import ToolCard from "@/components/ToolCard";

export const revalidate = 600;

export async function generateStaticParams() {
  return TOOL_CATEGORIES.map((c) => ({ usecase: c.value }));
}

const CATEGORY_INTROS: Record<string, { headline: string; intro: string }> = {
  writing:            { headline: "أفضل أدوات الكتابة بالذكاء الاصطناعي 2025", intro: "الذكاء الاصطناعي غيّر الكتابة الرقمية للأبد. هذه الأدوات تساعدك على إنتاج محتوى احترافي بسرعة قياسية." },
  coding:             { headline: "أفضل أدوات الذكاء الاصطناعي للمطورين", intro: "من الإكمال التلقائي إلى اكتشاف الأخطاء — هذه الأدوات تضاعف إنتاجية المطور حتى 10 أضعاف." },
  image:              { headline: "أفضل أدوات توليد الصور بالذكاء الاصطناعي", intro: "من Midjourney إلى DALL-E — فتحت أدوات الصور الذكية آفاقًا إبداعية لا محدودة للمصممين." },
  video:              { headline: "أفضل أدوات إنتاج الفيديو بالذكاء الاصطناعي", intro: "إنتاج فيديو احترافي لم يكن أسهل من أي وقت مضى — حوّل النص إلى مقاطع بصرية بنقرات." },
  voice:              { headline: "أفضل أدوات الصوت والموسيقى بالذكاء الاصطناعي", intro: "حوّل النص إلى كلام طبيعي أو أنشئ موسيقى أصيلة باستخدام أحدث تقنيات الذكاء الاصطناعي." },
  marketing:          { headline: "أفضل أدوات التسويق بالذكاء الاصطناعي", intro: "من نسخ الإعلانات إلى تحليل الجمهور — أدوات التسويق الذكية تمنحك ميزة تنافسية حقيقية." },
  education:          { headline: "أفضل أدوات التعليم بالذكاء الاصطناعي", intro: "الذكاء الاصطناعي يُخصّص تجربة التعلم لكل فرد بشروحات تفاعلية وتقييم فوري." },
  startups:           { headline: "أفضل أدوات الذكاء الاصطناعي للشركات الناشئة", intro: "من خطط العمل إلى تصميم المنتج — هذه الأدوات تجعل الشركات الناشئة تتحرك بسرعة الشركات الكبرى." },
  ecommerce:          { headline: "أفضل أدوات الذكاء الاصطناعي للتجارة الإلكترونية", intro: "ضاعف مبيعاتك وحسّن تجربة العملاء بأدوات ذكية متخصصة في التجارة الرقمية." },
  automation:         { headline: "أفضل أدوات الأتمتة بالذكاء الاصطناعي", intro: "أتمت المهام المتكررة وركّز على ما يهم — أدوات الأتمتة توفّر ساعات من العمل اليدوي أسبوعيًا." },
  "customer-support": { headline: "أفضل أدوات دعم العملاء بالذكاء الاصطناعي", intro: "الشات بوت الذكي وأنظمة الدعم الآلية ترفع رضا العملاء وتخفض تكاليف الدعم." },
  productivity:       { headline: "أفضل أدوات الإنتاجية بالذكاء الاصطناعي", intro: "من ملخصات الاجتماعات إلى إدارة المهام — أدوات الإنتاجية الذكية تحوّل الفوضى إلى أنظمة فعّالة." },
  legal:              { headline: "أفضل أدوات الذكاء الاصطناعي للمجال القانوني", intro: "مراجعة العقود والبحث القانوني وصياغة الوثائق بسرعة وكفاءة غير مسبوقة." },
  finance:            { headline: "أفضل أدوات التحليل المالي بالذكاء الاصطناعي", intro: "من تحليل البيانات إلى التخطيط الاستثماري — رؤى عميقة وسريعة مدعومة بالذكاء الاصطناعي." },
  healthcare:         { headline: "أفضل أدوات الذكاء الاصطناعي في الرعاية الصحية", intro: "الذكاء الاصطناعي يُحدث ثورة في الرعاية الصحية من التشخيص إلى إدارة بيانات المرضى." },
  students:           { headline: "أفضل أدوات الذكاء الاصطناعي للطلاب", intro: "أدوات تساعد الطلاب على الفهم الأعمق والبحث الأسرع وكتابة التقارير الأكاديمية بكفاءة." },
  "no-code":          { headline: "أفضل أدوات الذكاء الاصطناعي بدون كود", intro: "ابنِ تطبيقات ومواقع وأتمتة دون كتابة سطر برمجي — التكنولوجيا في متناول الجميع." },
  presentations:      { headline: "أفضل أدوات العروض التقديمية بالذكاء الاصطناعي", intro: "حوّل أفكارك إلى عروض احترافية في دقائق مع تصاميم جاهزة ومحتوى مقترح بالذكاء الاصطناعي." },
  other:              { headline: "أدوات ذكاء اصطناعي متنوعة", intro: "مجموعة متنوعة من أدوات الذكاء الاصطناعي التي تخدم احتياجات مختلفة." },
};

export async function generateMetadata({ params }: { params: Promise<{ usecase: string }> }): Promise<Metadata> {
  const { usecase } = await params;
  const cat = getCategoryMeta(usecase);
  const intro = CATEGORY_INTROS[usecase] ?? CATEGORY_INTROS.other;
  const title = `${intro.headline} | ${SITE_NAME_AR}`;
  const description = `اكتشف أفضل أدوات الذكاء الاصطناعي لـ ${cat.labelAr} — مراجعات عربية مفصّلة مع المميزات والعيوب والأسعار.`;
  const url = absoluteUrl(`/ai-tools/for/${usecase}`);
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url, locale: "ar_AR", type: "website" } };
}

export default async function ToolsForUsecasePage({ params }: { params: Promise<{ usecase: string }> }) {
  const { usecase } = await params;
  const validValues = TOOL_CATEGORIES.map((c) => c.value) as string[];
  if (!validValues.includes(usecase)) notFound();

  const catMeta = getCategoryMeta(usecase);
  const intro = CATEGORY_INTROS[usecase] ?? CATEGORY_INTROS.other;

  const [tools, otherCats] = await Promise.all([
    prisma.aITool.findMany({
      where: { published: true, toolCategory: usecase },
      orderBy: [{ editorPick: "desc" }, { viewCount: "desc" }],
      select: {
        id: true, slug: true, name: true, tagline: true, descriptionAr: true,
        logoUrl: true, toolCategory: true, pricing: true, monthlyPrice: true,
        arabicSupport: true, hasApi: true, tags: true, viewCount: true, likes: true,
        featured: true, editorPick: true,
      },
    }).catch(() => []),
    prisma.aITool.groupBy({
      by: ["toolCategory"], where: { published: true },
      _count: { id: true }, orderBy: { _count: { id: "desc" } }, take: 12,
    }).catch(() => []),
  ]);

  // A use-case with zero published tools has nothing to index — treat it the
  // same as an unrecognized use-case (404) rather than serving an empty page.
  if (tools.length === 0) notFound();

  const breadcrumbItems = [
    { name: "الرئيسية", href: "/" },
    { name: "أدوات AI", href: "/ai-tools" },
    { name: catMeta.labelAr },
  ];

  const itemListJsonLd = tools.length > 0 ? {
    "@context": "https://schema.org", "@type": "ItemList",
    name: intro.headline, url: absoluteUrl(`/ai-tools/for/${usecase}`),
    numberOfItems: tools.length,
    itemListElement: tools.slice(0, 10).map((t, i) => ({
      "@type": "ListItem", position: i + 1, url: `${SITE_URL}/ai-tools/${t.slug}`, name: t.name,
    })),
  } : null;

  const freePricing = tools.filter((t) => t.pricing === "free").length;
  const withArabic = tools.filter((t) => t.arabicSupport).length;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbJsonLd(breadcrumbItems)) }} />
      {itemListJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />}

      <main className="min-h-screen" dir="rtl">
        {/* Hero */}
        <section className="border-b py-14" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-subtle)" }}>
          <div className="container mx-auto px-4">
            <Breadcrumbs items={breadcrumbItems} className="mb-6" />
            <div className="flex items-center gap-4 mb-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-[6px] text-3xl" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>{catMeta.icon}</span>
              <div>
                <h1 className="text-3xl font-bold md:text-4xl" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{intro.headline}</h1>
                <p className="text-sm mt-1" style={{ color: "var(--accent)" }}>{tools.length} أداة</p>
              </div>
            </div>
            <p className="max-w-2xl leading-relaxed" style={{ color: "var(--text-secondary)" }}>{intro.intro}</p>
            {tools.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {freePricing > 0 && (
                  <span className="rounded-[3px] border px-3 py-1.5 text-xs"
                    style={{ borderColor: "#bbf7d0", backgroundColor: "#f0fdf4", color: "#16a34a" }}>{freePricing} مجاني</span>
                )}
                {withArabic > 0 && (
                  <span className="rounded-[3px] border px-3 py-1.5 text-xs"
                    style={{ borderColor: "#99f6e4", backgroundColor: "#f0fdfa", color: "#0d9488" }}>{withArabic} يدعم العربية</span>
                )}
                <span className="rounded-[3px] border px-3 py-1.5 text-xs"
                  style={{ borderColor: "var(--border-medium)", color: "var(--text-muted)", backgroundColor: "var(--bg-surface)" }}>{tools.length} أداة إجمالاً</span>
              </div>
            )}
          </div>
        </section>

        <div className="container mx-auto px-4 py-10">
          <AdSlot position="ai-tools-top" className="mb-8" />
          <div className="grid gap-10 lg:grid-cols-[1fr_260px]">
            <div>
              {tools.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-[6px] border py-24 text-center" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
                  <div className="mb-3 text-5xl">{catMeta.icon}</div>
                  <p className="text-lg font-semibold" style={{ color: "var(--text-muted)" }}>لا توجد أدوات في هذه الفئة بعد</p>
                  <Link href="/ai-tools" className="mt-4 text-sm transition" style={{ color: "var(--accent)" }}>جميع الأدوات</Link>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {tools.map((t) => <ToolCard key={t.id} tool={t} />)}
                </div>
              )}

              {/* Compare CTA */}
              <div className="mt-10 rounded-[6px] border p-6 text-center" style={{ borderColor: "var(--accent)", backgroundColor: "var(--accent-bg)" }}>
                <h3 className="mb-2 font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>لا تعرف أيها تختار؟</h3>
                <p className="mb-4 text-sm" style={{ color: "var(--text-secondary)" }}>استخدم أداة المقارنة لاتخاذ القرار الصحيح</p>
                <Link href="/compare" className="btn-primary inline-flex items-center gap-2">
                  قارن الأدوات
                </Link>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-5">
              <div className="rounded-[6px] border p-5" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
                <h3 className="mb-4 font-bold text-sm" style={{ color: "var(--text-primary)" }}>فئات أخرى</h3>
                <div className="space-y-1">
                  {TOOL_CATEGORIES.filter((c) => c.value !== usecase && c.value !== "other").map((cat) => {
                    const cnt = otherCats.find((o) => o.toolCategory === cat.value)?._count?.id ?? 0;
                    return (
                      <Link
                        key={cat.value}
                        href={`/ai-tools/for/${cat.value}`}
                        className="nav-item "
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <span>{cat.icon}</span>
                        <span className="flex-1">{cat.labelAr}</span>
                        {cnt > 0 && <span className="text-xs" style={{ color: "var(--text-muted)" }}>{cnt}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[6px] border p-5" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
                <h3 className="mb-3 font-bold text-sm" style={{ color: "var(--text-primary)" }}>روابط مفيدة</h3>
                <div className="space-y-1.5">
                  {[
                    { href: "/ai-tools", label: "جميع الأدوات" },
                    { href: "/compare", label: "مقارنة الأدوات" },
                  ].map((item) => (
                    <Link key={item.href} href={item.href}
                      className="hover-bg-subtle "
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
