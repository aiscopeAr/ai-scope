import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, absoluteUrl } from "@/lib/seo";
import { getLiveTools, getComingSoonTools } from "@/lib/tools/registry";

// app/layout.tsx's metadata.title.template ("%s | Lumiq") appends the
// brand to `title` automatically — omit it here, but openGraph/twitter
// titles render standalone on social cards and need it spelled out.
export const metadata: Metadata = {
  title: "أدوات Lumiq — أدوات عربية مجانية بلا تسجيل",
  description: "مجموعة أدوات عربية مجانية تعمل مباشرة في متصفحك بلا تسجيل ولا رفع بياناتك لأي خادم.",
  alternates: { canonical: absoluteUrl("/tools") },
  openGraph: {
    title: `أدوات Lumiq | ${SITE_NAME}`,
    description: "أدوات عربية مجانية تعمل في متصفحك مباشرة.",
    locale: "ar_AR",
    type: "website",
    url: absoluteUrl("/tools"),
  },
};

export default function ToolsIndexPage() {
  const liveTools = getLiveTools();
  const comingSoon = getComingSoonTools();

  return (
    <div dir="rtl">
      <section className="border-b py-16" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-subtle)" }}>
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <h1 className="mb-4 text-3xl font-bold md:text-5xl" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            أدوات Lumiq
          </h1>
          <p className="mx-auto max-w-xl text-base leading-relaxed md:text-lg" style={{ color: "var(--text-secondary)" }}>
            أدوات عربية مجانية تعمل مباشرة في متصفحك — بلا تسجيل، وبلا رفع بياناتك لأي خادم.
          </p>
        </div>
      </section>

      <section className="container mx-auto max-w-4xl px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-2">
          {liveTools.map((tool) => (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className="rounded-[6px] border p-6 transition hover:shadow-editorial"
              style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}
            >
              <span
                className="mb-2 inline-block rounded-[3px] px-2 py-0.5 text-[11px] font-semibold"
                style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent)" }}
              >
                {tool.category}
              </span>
              <h2 className="mb-1.5 text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                {tool.nameAr}
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {tool.shortDescriptionAr}
              </p>
            </Link>
          ))}

          {comingSoon.map((tool) => (
            <div
              key={tool.slug}
              className="rounded-[6px] border p-6 opacity-60"
              style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-subtle)" }}
            >
              <span
                className="mb-2 inline-block rounded-[3px] px-2 py-0.5 text-[11px] font-semibold"
                style={{ backgroundColor: "var(--bg-page)", color: "var(--text-muted)" }}
              >
                قريبًا
              </span>
              <h2 className="mb-1.5 text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                {tool.nameAr}
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {tool.shortDescriptionAr}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
