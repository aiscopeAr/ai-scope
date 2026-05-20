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
      className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
        liked
          ? "border-rose-500/40 bg-rose-500/15 text-rose-400 cursor-default"
          : "border-white/10 bg-white/5 text-slate-400 hover:border-rose-500/40 hover:text-rose-400"
      }`}
      aria-label="إعجاب"
    >
      <Heart className={`h-4 w-4 ${liked ? "fill-rose-400" : ""}`} />
      <span>{likes.toLocaleString("ar-EG")}</span>
    </button>
  );
}
