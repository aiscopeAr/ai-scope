interface ScoreRingProps {
  score: number;
  winner: boolean;
}

// دائرة درجة دائرية (score من 0 إلى 100)
export default function ScoreRing({ score, winner }: ScoreRingProps) {
  const pct = score / 100;
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;

  return (
    <div className="relative flex items-center justify-center" style={{ width: 72, height: 72 }}>
      <svg width={72} height={72} className="-rotate-90">
        <circle cx={36} cy={36} r={r} fill="none" stroke="#e2e8f0" strokeWidth={5} />
        <circle
          cx={36} cy={36} r={r} fill="none"
          stroke={winner ? "#16a34a" : "var(--accent)"}
          strokeWidth={5}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="text-lg font-black" style={{ color: winner ? "#16a34a" : "var(--accent)" }}>{score}</span>
        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>/100</span>
      </div>
    </div>
  );
}
