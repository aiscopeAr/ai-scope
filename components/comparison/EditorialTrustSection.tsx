import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface EditorialTrustSectionProps {
  updatedAt: Date;
}

// A factual trust block — links to the site's real, already-published
// editorial policy page (/about) rather than inventing new claims about
// methodology or authorship that aren't tracked anywhere for comparisons.
export default function EditorialTrustSection({ updatedAt }: EditorialTrustSectionProps) {
  return (
    <section className="mt-8 rounded-xl border p-4 text-xs"
      style={{ borderColor: "var(--border-subtle)", background: "var(--bg-subtle)", color: "var(--text-muted)" }}>
      <p>
        آخر تحديث لهذه الصفحة: {formatDistanceToNow(new Date(updatedAt), { addSuffix: true, locale: ar })}. تعرّف على{" "}
        <Link href="/about" className="underline hover:opacity-75" style={{ color: "var(--accent)" }}>
          منهجيتنا التحريرية وكيفية إعداد تقاريرنا
        </Link>.
      </p>
    </section>
  );
}
