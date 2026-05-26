"use client";

import Link from "next/link";
import type { BreadcrumbItem } from "@/lib/breadcrumb-jsonld";

export type { BreadcrumbItem };
export { buildBreadcrumbJsonLd } from "@/lib/breadcrumb-jsonld";

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="مسار التنقل"
      className={`flex flex-wrap items-center gap-1.5 text-sm ${className}`}
      style={{ color: "var(--text-muted)" }}
    >
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span aria-hidden style={{ color: "var(--border-medium)" }}>/</span>}
          {item.href ? (
            <Link
              href={item.href}
              className="link-muted transition-colors"
            >
              {item.name}
            </Link>
          ) : (
            <span className="font-medium line-clamp-1" style={{ color: "var(--text-secondary)" }}>{item.name}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
