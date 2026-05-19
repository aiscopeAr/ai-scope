import Link from "next/link";
import { SITE_URL } from "@/lib/seo";

export interface BreadcrumbItem {
  name: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.href ? { item: `${SITE_URL}${item.href}` } : {}),
    })),
  };
}

export default function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="مسار التنقل"
      className={`flex flex-wrap items-center gap-1.5 text-sm text-slate-500 ${className}`}
    >
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span aria-hidden className="text-slate-700">/</span>}
          {item.href ? (
            <Link href={item.href} className="hover:text-violet-400 transition-colors">
              {item.name}
            </Link>
          ) : (
            <span className="text-slate-400 font-medium line-clamp-1">{item.name}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
