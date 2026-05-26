import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { absoluteUrl, SITE_NAME_AR, SITE_URL } from "@/lib/seo";
import { TOOL_CATEGORIES, getCategoryMeta } from "@/lib/tool-categories";
import AdSlot from "@/components/AdSlot";
import Breadcrumbs, { buildBreadcrumbJsonLd } from "@/components/Breadcrumbs";
import ToolCard from "@/components/ToolCard";

export const revalidate = 600;

export async function generateStaticParams() {
  return TOOL_CATEGORIES.map((c) => ({ usecase: c.value }));
}

const CATEGORY_INTROS: Record<string, { headline: string; intro: string }> = {
  writing:            { headline: "Best AI Writing Tools 2025", intro: "AI has transformed digital writing. These tools help you produce professional content at record speed." },
  coding:             { headline: "Best AI Tools for Developers", intro: "From auto-complete to bug detection — these tools multiply developer productivity by up to 10x." },
  image:              { headline: "Best AI Image Generation Tools", intro: "From Midjourney to DALL-E — AI image tools opened unlimited creative possibilities for designers." },
  video:              { headline: "Best AI Video Production Tools", intro: "Professional video production has never been easier — turn text into visual clips in clicks." },
  voice:              { headline: "Best AI Voice and Music Tools", intro: "Convert text to natural speech or create original music using cutting-edge AI technology." },
  marketing:          { headline: "Best AI Marketing Tools", intro: "From ad copy to audience analysis — AI marketing tools give you a real competitive edge." },
  education:          { headline: "Best AI Education Tools", intro: "AI personalizes the learning experience for every individual with interactive explanations and instant evaluation." },
  startups:           { headline: "Best AI Tools for Startups", intro: "From business plans to product design — these tools let startups move with the speed of large companies." },
  ecommerce:          { headline: "Best AI Tools for E-commerce", intro: "Double your sales and improve customer experience with AI tools specialized for online commerce." },
  automation:         { headline: "Best AI Automation Tools", intro: "Automate repetitive tasks and focus on what matters — automation tools save hours of manual work weekly." },
  "customer-support": { headline: "Best AI Customer Support Tools", intro: "Smart chatbots and automated support systems raise customer satisfaction while reducing support costs." },
  productivity:       { headline: "Best AI Productivity Tools", intro: "From meeting summaries to task management — AI productivity tools transform chaos into effective systems." },
  legal:              { headline: "Best AI Legal Tools", intro: "Contract review, legal research, and document drafting at unprecedented speed and efficiency." },
  finance:            { headline: "Best AI Financial Analysis Tools", intro: "From data analysis to investment planning — deep, fast insights powered by artificial intelligence." },
  healthcare:         { headline: "Best AI Healthcare Tools", intro: "AI is revolutionizing healthcare from diagnosis to patient data management." },
  students:           { headline: "Best AI Tools for Students", intro: "Tools that help students understand deeper, research faster, and write academic reports efficiently." },
  "no-code":          { headline: "Best No-Code AI Tools", intro: "Build apps, websites, and automation without writing code — technology accessible to everyone." },
  presentations:      { headline: "Best AI Presentation Tools", intro: "Turn your ideas into professional presentations in minutes with ready designs and AI-suggested content." },
  other:              { headline: "Miscellaneous AI Tools", intro: "A diverse collection of AI tools serving various different needs." },
};

export async function generateMetadata({ params }: { params: Promise<{ usecase: string }> }): Promise<Metadata> {
  const { usecase } = await params;
  const cat = getCategoryMeta(usecase);
  const intro = CATEGORY_INTROS[usecase] ?? CATEGORY_INTROS.other;
  const title = `${intro.headline} | ${SITE_NAME_AR}`;
  const description = `Discover the best AI tools for ${cat.labelAr} — detailed Arabic reviews with pros, cons, and pricing.`;
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

  const breadcrumbItems = [
    { name: "Home", href: "/" },
    { name: "AI Tools", href: "/ai-tools" },
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
                <p className="text-sm mt-1" style={{ color: "var(--accent)" }}>{tools.length} tools</p>
              </div>
            </div>
            <p className="max-w-2xl leading-relaxed" style={{ color: "var(--text-secondary)" }}>{intro.intro}</p>
            {tools.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {freePricing > 0 && (
                  <span className="rounded-[3px] border px-3 py-1.5 text-xs"
                    style={{ borderColor: "#bbf7d0", backgroundColor: "#f0fdf4", color: "#16a34a" }}>{freePricing} free</span>
                )}
                {withArabic > 0 && (
                  <span className="rounded-[3px] border px-3 py-1.5 text-xs"
                    style={{ borderColor: "#99f6e4", backgroundColor: "#f0fdfa", color: "#0d9488" }}>{withArabic} Arabic support</span>
                )}
                <span className="rounded-[3px] border px-3 py-1.5 text-xs"
                  style={{ borderColor: "var(--border-medium)", color: "var(--text-muted)", backgroundColor: "var(--bg-surface)" }}>{tools.length} tools total</span>
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
                  <p className="text-lg font-semibold" style={{ color: "var(--text-muted)" }}>No tools in this category yet</p>
                  <Link href="/ai-tools" className="mt-4 text-sm transition" style={{ color: "var(--accent)" }}>All tools</Link>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {tools.map((t) => <ToolCard key={t.id} tool={t} />)}
                </div>
              )}

              {/* Compare CTA */}
              <div className="mt-10 rounded-[6px] border p-6 text-center" style={{ borderColor: "var(--accent)", backgroundColor: "var(--accent-bg)" }}>
                <h3 className="mb-2 font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Not sure which to pick?</h3>
                <p className="mb-4 text-sm" style={{ color: "var(--text-secondary)" }}>Use the comparison tool to make the right decision</p>
                <Link href="/compare" className="btn-primary inline-flex items-center gap-2">
                  Compare tools
                </Link>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-5">
              <div className="rounded-[6px] border p-5" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
                <h3 className="mb-4 font-bold text-sm" style={{ color: "var(--text-primary)" }}>Other categories</h3>
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
                <h3 className="mb-3 font-bold text-sm" style={{ color: "var(--text-primary)" }}>Useful links</h3>
                <div className="space-y-1.5">
                  {[
                    { href: "/ai-tools", label: "All tools" },
                    { href: "/compare", label: "Compare tools" },
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
