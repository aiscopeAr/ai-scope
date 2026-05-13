import type { Metadata } from "next";
import { SITE_NAME_AR, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: `الشروط والأحكام | ${SITE_NAME_AR}`,
  description: "باستخدامك للمنصة فإنك توافق على شروط الاستخدام والأحكام المنظمة للخدمة.",
  alternates: { canonical: absoluteUrl("/terms") },
};

export default function TermsPage() {
  return (
    <section className="container mx-auto max-w-3xl px-4 py-12" dir="rtl">
      <h1 className="mb-6 text-4xl font-bold">الشروط والأحكام</h1>
      <p className="leading-8 text-gray-700">باستخدامك للمنصة فإنك توافق على شروط الاستخدام والأحكام المنظمة للخدمة.</p>
    </section>
  );
}
