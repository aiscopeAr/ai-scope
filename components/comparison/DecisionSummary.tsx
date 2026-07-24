import Link from "next/link";
import { Trophy } from "lucide-react";
import ToolLogo from "./ToolLogo";

interface DecisionSummarySide {
  score: number | null;
  bestFor: string | null;
  tool: { slug: string; name: string; logoUrl: string | null };
}

interface DecisionSummaryProps {
  winner: DecisionSummarySide | undefined;
}

// Renders nothing when no side has a score — a "top recommendation" that
// isn't backed by an actual score would be an invented opinion, which this
// sprint's rules explicitly forbid.
export default function DecisionSummary({ winner }: DecisionSummaryProps) {
  if (!winner || winner.score === null) return null;

  return (
    <section className="mb-8 rounded-2xl border-2 p-6"
      style={{ borderColor: "#86efac", background: "#f0fdf4" }}>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
          style={{ background: "#16a34a" }}>
          <Trophy className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#16a34a" }}>
            التوصية السريعة
          </p>
          <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
            {winner.tool.name} يحصل على أعلى تقييم في هذه المقارنة ({winner.score}/100)
            {winner.bestFor ? ` — الأفضل لـ ${winner.bestFor}` : ""}
          </p>
        </div>
        <Link href={`/ai-tools/${winner.tool.slug}`}
          className="flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition hover:opacity-75"
          style={{ borderColor: "#86efac", color: "#16a34a", background: "#fff" }}>
          <ToolLogo name={winner.tool.name} logoUrl={winner.tool.logoUrl} size={5} />
          عرض {winner.tool.name}
        </Link>
      </div>
    </section>
  );
}
