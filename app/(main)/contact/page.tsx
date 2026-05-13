import type { Metadata } from "next";
import { SITE_NAME_AR, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: `اتصل بنا | ${SITE_NAME_AR}`,
  description: "للاستفسارات والشراكات يمكن التواصل عبر البريد الإلكتروني الخاص بالمنصة.",
  alternates: { canonical: absoluteUrl("/contact") },
};

export default function ContactPage() {
  return (
    <section className="container mx-auto max-w-3xl px-4 py-12" dir="rtl">
      <h1 className="mb-6 text-4xl font-bold">اتصل بنا</h1>
      <p className="leading-8 text-gray-700">للاستفسارات والشراكات يمكن التواصل عبر البريد الإلكتروني الخاص بالمنصة.</p>
    </section>
  );
}
