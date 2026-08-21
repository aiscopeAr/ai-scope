"use client";

import { useState } from "react";

export default function NewsletterInline() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "website" }),
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

  return (
    <section className="mb-14 md:mb-16 overflow-hidden rounded-[14px]" dir="rtl"
      style={{ backgroundColor: "var(--brand-bg)" }}>
      <div className="px-6 py-12 text-center md:py-14">
        {status === "success" ? (
          <>
            <div className="mb-3 text-3xl">🎉</div>
            <h2 className="mb-1.5 text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              شكراً على اشتراكك!
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>ستصلك نشرتنا كل أسبوع.</p>
          </>
        ) : (
          <>
            <div className="mb-2 text-2xl">📬</div>
            <h2 className="mb-2 text-2xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              ابقَ على اطلاع — اشترك في النشرة
            </h2>
            <p className="mx-auto mb-7 max-w-sm text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              ملخص أسبوعي بأبرز أخبار الذكاء الاصطناعي، يصلك كل أحد. لا ضوضاء.
            </p>
            <form onSubmit={handleSubmit} className="mx-auto flex max-w-sm flex-col gap-3 sm:flex-row">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
                placeholder="بريدك الإلكتروني"
                className="flex-1 rounded-[8px] border px-4 py-2.5 text-sm outline-none transition-colors"
                style={{ borderColor: "var(--border-medium)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)" }}
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="btn-brand shrink-0 justify-center px-6 py-2.5 text-sm disabled:opacity-60"
              >
                {status === "loading" ? "..." : "اشترك مجاناً"}
              </button>
            </form>
            {status === "error" && (
              <p className="mt-2 text-sm" style={{ color: "var(--accent)" }}>{errorMsg}</p>
            )}
            <p className="mt-3 text-[11px]" style={{ color: "var(--text-muted)" }}>
              لا رسائل مزعجة · إلغاء الاشتراك في أي وقت
            </p>
          </>
        )}
      </div>
    </section>
  );
}
