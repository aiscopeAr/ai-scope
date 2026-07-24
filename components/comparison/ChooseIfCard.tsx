interface ChooseIfCardProps {
  toolName: string;
  bestFor: string | null;
  strengths: string[];
}

// Renders nothing when there's no bestFor AND no strengths — otherwise
// this would be an empty card with only a tool name, which is worse than
// no card at all.
export default function ChooseIfCard({ toolName, bestFor, strengths }: ChooseIfCardProps) {
  if (!bestFor && strengths.length === 0) return null;

  return (
    <div className="rounded-xl p-4" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)" }}>
      <p className="mb-2 text-sm font-bold" style={{ color: "var(--text-primary)" }}>
        اختر {toolName} إذا كنت...
      </p>
      <ul className="space-y-1.5">
        {bestFor && (
          <li className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            تحتاج {bestFor}
          </li>
        )}
        {strengths.slice(0, 2).map((s) => (
          <li key={s} className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            تُقدّر أن الأداة {s}
          </li>
        ))}
      </ul>
    </div>
  );
}
