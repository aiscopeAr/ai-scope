import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  /** Path without query string, e.g. "/reviews" or "/category/ai-models" */
  basePath: string;
}

function pageHref(basePath: string, page: number): string {
  return page <= 1 ? basePath : `${basePath}?page=${page}`;
}

/** Server-rendered pagination — real <a href> links so crawlers can reach every page. */
export default function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null;

  const prevDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= totalPages;

  return (
    <nav className="mt-10 flex items-center justify-center gap-2" aria-label="تنقل بين الصفحات">
      {prevDisabled ? (
        <span className="rounded-[6px] border px-4 py-2 text-sm opacity-30"
          style={{ borderColor: "var(--border-medium)", color: "var(--text-secondary)", backgroundColor: "var(--bg-surface)" }}>
          السابق
        </span>
      ) : (
        <Link href={pageHref(basePath, currentPage - 1)}
          className="rounded-[6px] border px-4 py-2 text-sm transition-colors hover:opacity-75"
          style={{ borderColor: "var(--border-medium)", color: "var(--text-secondary)", backgroundColor: "var(--bg-surface)" }}>
          السابق
        </Link>
      )}

      <span className="text-sm" style={{ color: "var(--text-muted)" }}>
        {currentPage} / {totalPages}
      </span>

      {nextDisabled ? (
        <span className="rounded-[6px] border px-4 py-2 text-sm opacity-30"
          style={{ borderColor: "var(--border-medium)", color: "var(--text-secondary)", backgroundColor: "var(--bg-surface)" }}>
          التالي
        </span>
      ) : (
        <Link href={pageHref(basePath, currentPage + 1)}
          className="rounded-[6px] border px-4 py-2 text-sm transition-colors hover:opacity-75"
          style={{ borderColor: "var(--border-medium)", color: "var(--text-secondary)", backgroundColor: "var(--bg-surface)" }}>
          التالي
        </Link>
      )}
    </nav>
  );
}
