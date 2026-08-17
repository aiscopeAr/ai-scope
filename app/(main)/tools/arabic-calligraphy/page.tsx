import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_NAME_AR, absoluteUrl } from "@/lib/seo";
import { buildBreadcrumbJsonLd } from "@/lib/breadcrumb-jsonld";
import { getToolBySlug } from "@/lib/tools/registry";
import { CALLIGRAPHY_FONT_VARIABLES } from "@/lib/tools/calligraphy-fonts";
import { FAQ_ITEMS } from "@/components/tools/CalligraphyFaq";
import CalligraphyStudio from "@/components/tools/CalligraphyStudio";
import CalligraphyFaq from "@/components/tools/CalligraphyFaq";
import ToolViewTracker from "@/components/tools/ToolViewTracker";

const tool = getToolBySlug("arabic-calligraphy")!;

// The root layout's metadata.title.template ("%s | Lumiq") appends the
// brand to `title` automatically — but openGraph/twitter titles render
// standalone on social cards and are never passed through that template,
// so they need the brand suffix spelled out explicitly here.
const socialTitle = `${tool.seo.titleAr} | ${SITE_NAME}`;

export const metadata: Metadata = {
  title: tool.seo.titleAr,
  description: tool.seo.descriptionAr,
  alternates: { canonical: absoluteUrl("/tools/arabic-calligraphy") },
  openGraph: {
    title: socialTitle,
    description: tool.seo.descriptionAr,
    locale: "ar_AR",
    type: "website",
    url: absoluteUrl("/tools/arabic-calligraphy"),
  },
  twitter: {
    card: "summary_large_image",
    title: socialTitle,
    description: tool.seo.descriptionAr,
  },
};

const breadcrumbJsonLd = buildBreadcrumbJsonLd([
  { name: SITE_NAME_AR, href: "/" },
  { name: "أدوات", href: "/tools" },
  { name: tool.nameAr },
]);

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const softwareAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: tool.nameAr,
  url: absoluteUrl("/tools/arabic-calligraphy"),
  applicationCategory: "DesignApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  inLanguage: "ar",
};

export default function ArabicCalligraphyPage() {
  return (
    <div dir="rtl" className={CALLIGRAPHY_FONT_VARIABLES}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }} />
      <ToolViewTracker toolSlug={tool.slug} />

      <nav aria-label="مسار التصفح" className="container mx-auto max-w-5xl px-4 pt-6 text-sm" style={{ color: "var(--text-muted)" }}>
        <Link href="/" className="hover:underline">{SITE_NAME_AR}</Link>
        <span className="mx-2">/</span>
        <Link href="/tools" className="hover:underline">أدوات</Link>
        <span className="mx-2">/</span>
        <span style={{ color: "var(--text-secondary)" }}>{tool.nameAr}</span>
      </nav>

      <header className="container mx-auto max-w-3xl px-4 pb-8 pt-6 text-center">
        <h1 className="mb-3 text-3xl font-bold md:text-4xl" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
          {tool.nameAr}
        </h1>
        <p className="mb-2 text-lg font-medium" style={{ color: "var(--text-primary)" }}>
          حوّل كلماتك إلى تصميم عربي جميل
        </p>
        <p className="mx-auto max-w-xl text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          اكتب اسمًا، عبارة أو تهنئة، واختر النمط الذي يناسبك. عاين التصميم مباشرة وحمّله كصورة PNG بخلفية شفافة.
        </p>
      </header>

      <main className="container mx-auto max-w-5xl px-4 pb-16">
        <CalligraphyStudio />
      </main>

      <CalligraphyFaq />
    </div>
  );
}
