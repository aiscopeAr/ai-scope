import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_NAME_AR, absoluteUrl } from "@/lib/seo";
import { buildBreadcrumbJsonLd } from "@/lib/breadcrumb-jsonld";
import { getToolBySlug } from "@/lib/tools/registry";
import { FAQ_ITEMS } from "@/components/tools/ArabicTextNormalizerFaq";
import ArabicTextNormalizer from "@/components/tools/ArabicTextNormalizer";
import ArabicTextNormalizerFaq from "@/components/tools/ArabicTextNormalizerFaq";
import ToolViewTracker from "@/components/tools/ToolViewTracker";

const tool = getToolBySlug("arabic-text-normalizer")!;
const socialTitle = `${tool.seo.titleAr} | ${SITE_NAME}`;

export const metadata: Metadata = {
  title: tool.seo.titleAr,
  description: tool.seo.descriptionAr,
  alternates: { canonical: absoluteUrl("/tools/arabic-text-normalizer") },
  openGraph: {
    title: socialTitle,
    description: tool.seo.descriptionAr,
    locale: "ar_AR",
    type: "website",
    url: absoluteUrl("/tools/arabic-text-normalizer"),
  },
  twitter: { card: "summary_large_image", title: socialTitle, description: tool.seo.descriptionAr },
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
  url: absoluteUrl("/tools/arabic-text-normalizer"),
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  inLanguage: "ar",
};

export default function ArabicTextNormalizerPage() {
  return (
    <div dir="rtl">
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
        <p className="mx-auto max-w-xl text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          نظّف النص العربي: إزالة التشكيل، توحيد الحروف، حذف التطويل، وتحويل الأرقام — مباشرة في متصفحك.
        </p>
      </header>

      <main className="container mx-auto max-w-5xl px-4 pb-16">
        <ArabicTextNormalizer />
      </main>

      <ArabicTextNormalizerFaq />
    </div>
  );
}
