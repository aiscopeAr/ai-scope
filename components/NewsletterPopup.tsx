"use client";

import { useEffect, useState } from "react";

export default function NewsletterPopup() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const dismissed = localStorage.getItem("newsletter_dismissed");
    if (dismissed) return;
    const timer = setTimeout(() => setOpen(true), 30_000);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    setOpen(false);
    localStorage.setItem("newsletter_dismissed", "1");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "popup" }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error ?? "حدث خطأ"); setStatus("error"); return; }
      setStatus("success");
      localStorage.setItem("newsletter_dismissed", "1");
    } catch {
      setErrorMsg("حدث خطأ، حاول مرة أخرى");
      setStatus("error");
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-[8px] border shadow-xl animate-fade-up"
        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
        dir="rtl"
      >
        <button
          onClick={dismiss}
          className="absolute top-3 left-3 flex h-7 w-7 items-center justify-center rounded-[4px] transition-colors"
          style={{ color: "var(--text-muted)" }}
          aria-label="إغلاق"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="h-1 w-full" style={{ background: "linear-gradient(to left, var(--accent), #8b5cf6)" }} />

        <div className="p-6">
          {status === "success" ? (
            <div className="py-4 text-center">
              <div className="mb-3 text-4xl">🎉</div>
              <h3 className="mb-2 text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                شكراً على اشتراكك!
              </h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>ستصلك نشرتنا الأسبوعية كل يوم أحد.</p>
            </div>
          ) : (
            <>
              <div className="mb-1 text-2xl">📬</div>
              <h3 className="mb-1 text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                النشرة الأسبوعية
              </h3>
              <p className="mb-5 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                أبرز أخبار الذكاء الاصطناعي كل أسبوع — مباشرة إلى بريدك. بلا إزعاج.
              </p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
                  placeholder="بريدك الإلكتروني"
                  className="w-full rounded-[6px] border px-4 py-2.5 text-sm outline-none transition-colors"
                  style={{ borderColor: "var(--border-medium)", backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)" }}
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="btn-primary w-full justify-center py-2.5 text-sm disabled:opacity-60"
                >
                  {status === "loading" ? "..." : "اشترك مجاناً ←"}
                </button>
              </form>
              {status === "error" && (
                <p className="mt-2 text-sm" style={{ color: "var(--accent)" }}>{errorMsg}</p>
              )}
              <p className="mt-3 text-center text-[11px]" style={{ color: "var(--text-muted)" }}>
                لا رسائل مزعجة · يمكن إلغاء الاشتراك في أي وقت
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
