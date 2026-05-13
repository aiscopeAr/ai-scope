import type { Metadata } from "next";
import { SITE_NAME_AR, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: `من نحن | ${SITE_NAME_AR}`,
  description: "AI Scope منصة عربية متخصصة في متابعة أخبار الذكاء الاصطناعي وتقديمها للقارئ العربي بشكل واضح وسريع.",
  alternates: { canonical: absoluteUrl("/about") },
};

export default function AboutPage() {
  return (
    <section className="container mx-auto max-w-3xl px-4 py-12" dir="rtl">
      <h1 className="mb-6 text-4xl font-bold">من نحن</h1>
      <p className="leading-8 text-gray-700">
        AI Scope منصة عربية متخصصة في متابعة أخبار الذكاء الاصطناعي وتقديمها للقارئ العربي بشكل واضح وسريع.
      </p>
    </section>
  );
}
