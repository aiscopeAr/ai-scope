"use client";

import Link from "next/link";
import { TOOL_CATEGORIES } from "@/lib/tool-categories";

interface CategoryWithCount {
  value: string;
  labelAr: string;
  icon: string;
  count: number;
}

export default function ToolCategoryGrid({ categories, byCategory }: {
  categories: CategoryWithCount[];
  byCategory: Record<string, unknown[]>;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {TOOL_CATEGORIES.filter(c => c.value !== "other").map((cat) => {
        const count = byCategory[cat.value]?.length ?? 0;
        if (count === 0) return null;
        return (
          <Link
            key={cat.value}
            href={`/ai-tools/for/${cat.value}`}
            className="group flex flex-col items-center justify-center gap-2 rounded-[10px] border p-4 text-center transition-all hover:scale-[1.02]"
            style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = "var(--border-medium)";
              el.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)";
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = "var(--border-subtle)";
              el.style.boxShadow = "none";
            }}
          >
            <span className="text-2xl">{cat.icon}</span>
            <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{cat.labelAr}</span>
            <span className="rounded-full px-2 py-0.5 text-[10px]"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-muted)" }}>
              {count} أداة
            </span>
          </Link>
        );
      })}
    </div>
  );
}
