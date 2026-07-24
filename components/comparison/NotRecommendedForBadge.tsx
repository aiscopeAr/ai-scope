interface NotRecommendedForBadgeProps {
  notRecommendedFor: string | null;
}

// Renders nothing when absent — mirrors the existing bestFor pattern
// (`{side.bestFor && (...)}`) directly above it in the side card.
export default function NotRecommendedForBadge({ notRecommendedFor }: NotRecommendedForBadgeProps) {
  if (!notRecommendedFor) return null;

  return (
    <div className="rounded-xl p-4" style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}>
      <p className="text-xs font-semibold mb-1" style={{ color: "#c2410c" }}>لا يُنصح به لـ</p>
      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{notRecommendedFor}</p>
    </div>
  );
}
