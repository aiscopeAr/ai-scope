import type { KeyDifference } from "@/lib/comparison-helpers";

interface KeyDifferencesProps {
  differences: KeyDifference[];
  toolNames: string[];
}

// Renders nothing when the tools don't actually differ on any tracked
// fact (pricing / Arabic support / API) — manufacturing a "difference"
// section with no real difference in it would be exactly the kind of
// placeholder content this sprint forbids.
export default function KeyDifferences({ differences, toolNames }: KeyDifferencesProps) {
  if (differences.length === 0) return null;

  return (
    <section className="mb-10 rounded-2xl border p-6"
      style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
      <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
        أهم الفروقات
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth: 420 }}>
          <thead>
            <tr>
              <th className="pb-2 text-right font-semibold" style={{ color: "var(--text-muted)" }}></th>
              {toolNames.map((name) => (
                <th key={name} className="pb-2 text-right font-semibold" style={{ color: "var(--text-primary)" }}>{name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {differences.map((diff) => (
              <tr key={diff.label} className="border-t" style={{ borderColor: "var(--border-subtle)" }}>
                <td className="py-2.5 pl-4 font-medium" style={{ color: "var(--text-muted)" }}>{diff.label}</td>
                {diff.values.map((v, i) => (
                  <td key={i} className="py-2.5 font-medium" style={{ color: "var(--text-secondary)" }}>{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
