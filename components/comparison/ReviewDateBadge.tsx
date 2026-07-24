import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface ReviewDateBadgeProps {
  reviewedAt: Date | null;
}

// Renders nothing when the comparison has never been marked as
// editorially reviewed — reviewedAt is distinct from updatedAt (which
// changes on any edit, not specifically a "we verified this is still
// accurate" pass).
export default function ReviewDateBadge({ reviewedAt }: ReviewDateBadgeProps) {
  if (!reviewedAt) return null;

  return (
    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
      آخر مراجعة تحريرية: {formatDistanceToNow(new Date(reviewedAt), { addSuffix: true, locale: ar })}
    </p>
  );
}
