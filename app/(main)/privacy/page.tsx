import type { Metadata } from "next";
import { SITE_NAME_AR, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: `سياسة الخصوصية | ${SITE_NAME_AR}`,
  description: "نلتزم بحماية بيانات الزوار واستخدامها بما يتوافق مع أفضل الممارسات وسياسات المنصة.",
  alternates: { canonical: absoluteUrl("/privacy") },
};

export default function PrivacyPage() {
  return (
    <section className="container mx-auto max-w-3xl px-4 py-12" dir="rtl">
      <h1 className="mb-6 text-4xl font-bold">سياسة الخصوصية</h1>
      <p className="leading-8 text-gray-700">
        نلتزم بحماية بيانات الزوار واستخدامها بما يتوافق مع أفضل الممارسات وسياسات المنصة.
      </p>
    </section>
  );
}
