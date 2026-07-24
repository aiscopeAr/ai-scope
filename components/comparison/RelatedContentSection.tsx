import Link from "next/link";

export interface RelatedContentItem {
  href: string;
  title: string;
}

interface RelatedContentSectionProps {
  heading: string;
  items: RelatedContentItem[];
}

// A single shared shell for the three "related X" lists (reviews, tools,
// prompts) — renders nothing when there's no real matching content rather
// than falling back to generic/unrelated filler.
export default function RelatedContentSection({ heading, items }: RelatedContentSectionProps) {
  if (items.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-4 text-base font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
        {heading}
      </h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <Link key={item.href} href={item.href}
            className="rounded-xl border px-4 py-3 text-sm font-medium transition hover:-translate-y-0.5 hover:shadow-sm"
            style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)", color: "var(--text-secondary)" }}>
            {item.title}
          </Link>
        ))}
      </div>
    </section>
  );
}
