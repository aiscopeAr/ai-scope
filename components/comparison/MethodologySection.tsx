interface MethodologySectionProps {
  methodology: string | null;
}

// Renders nothing when methodology is absent — matches the graceful
// degradation already used for verdict/criteria/bestFor elsewhere on this page.
export default function MethodologySection({ methodology }: MethodologySectionProps) {
  if (!methodology) return null;

  return (
    <section className="mb-10 rounded-2xl border p-6"
      style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
        منهجية المقارنة
      </p>
      <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        {methodology}
      </p>
    </section>
  );
}
