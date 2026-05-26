"use client";

import { useState } from "react";
import { Heart } from "lucide-react";

export default function ToolInteractions({
  toolId,
  initialLikes,
}: {
  toolId: string;
  initialLikes: number;
}) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLike() {
    if (liked || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tools/${toolId}/like`, { method: "POST" });
      if (res.ok) {
        setLikes((l) => l + 1);
        setLiked(true);
      }
    } catch { /* best-effort */ }
    finally { setLoading(false); }
  }

  return (
    <button
      onClick={handleLike}
      disabled={liked || loading}
      className="flex items-center gap-2 rounded-[6px] border px-4 py-2.5 text-sm font-semibold transition"
      style={liked
        ? { borderColor: "#fecdd3", backgroundColor: "#fff1f2", color: "#be123c", cursor: "default" }
        : { borderColor: "var(--border-medium)", backgroundColor: "var(--bg-surface)", color: "var(--text-muted)" }
      }
      onMouseEnter={e => { if (!liked) { (e.currentTarget as HTMLElement).style.borderColor = "#fecdd3"; (e.currentTarget as HTMLElement).style.color = "#be123c"; } }}
      onMouseLeave={e => { if (!liked) { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-medium)"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; } }}
      aria-label="إعجاب"
    >
      <Heart className={`h-4 w-4 ${liked ? "fill-rose-600" : ""}`} />
      <span>{likes.toLocaleString("ar-EG")}</span>
    </button>
  );
}
