"use client";

import { useState } from "react";

interface Props {
  url: string;
  title: string;
}

export default function ShareButtons({ url, title }: Props) {
  const [copied, setCopied] = useState(false);

  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encoded}`;
  const whatsappUrl = `https://wa.me/?text=${encodedTitle}%20${encoded}`;
  const telegramUrl = `https://t.me/share/url?url=${encoded}&text=${encodedTitle}`;
  const redditUrl = `https://www.reddit.com/submit?url=${encoded}&title=${encodedTitle}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement("input");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="flex items-center gap-2" dir="rtl">
      <span className="text-xs font-semibold ml-1" style={{ color: "var(--text-muted)" }}>شارك:</span>

      {/* Twitter / X */}
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="شارك على X"
        className="flex h-8 w-8 items-center justify-center rounded-[6px] border transition"
        style={{ borderColor: "var(--border-medium)", color: "var(--text-muted)", backgroundColor: "var(--bg-surface)" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-medium)"; (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-medium)"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>

      {/* Reddit */}
      <a
        href={redditUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="شارك على Reddit"
        className="flex h-8 w-8 items-center justify-center rounded-[6px] border transition"
        style={{ borderColor: "var(--border-medium)", color: "var(--text-muted)", backgroundColor: "var(--bg-surface)" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#ff4500"; (e.currentTarget as HTMLElement).style.borderColor = "#fecaca"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border-medium)"; }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
        </svg>
      </a>

      {/* Telegram */}
      <a
        href={telegramUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="شارك على تيليغرام"
        className="flex h-8 w-8 items-center justify-center rounded-[6px] border transition"
        style={{ borderColor: "var(--border-medium)", color: "var(--text-muted)", backgroundColor: "var(--bg-surface)" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#0088cc"; (e.currentTarget as HTMLElement).style.borderColor = "#bae6fd"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border-medium)"; }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 14.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z"/>
        </svg>
      </a>

      {/* WhatsApp */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="شارك على واتساب"
        className="flex h-8 w-8 items-center justify-center rounded-[6px] border transition"
        style={{ borderColor: "var(--border-medium)", color: "var(--text-muted)", backgroundColor: "var(--bg-surface)" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#16a34a"; (e.currentTarget as HTMLElement).style.borderColor = "#bbf7d0"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border-medium)"; }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>

      {/* Copy link */}
      <button
        onClick={copyLink}
        aria-label="نسخ الرابط"
        className="flex h-8 items-center gap-1.5 rounded-[6px] border px-3 text-xs font-semibold transition"
        style={{
          borderColor: copied ? "var(--accent)" : "var(--border-medium)",
          color: copied ? "var(--accent)" : "var(--text-muted)",
          backgroundColor: copied ? "var(--accent-bg)" : "var(--bg-surface)",
        }}
      >
        {copied ? (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>تم النسخ</span>
          </>
        ) : (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            <span>نسخ الرابط</span>
          </>
        )}
      </button>
    </div>
  );
}
