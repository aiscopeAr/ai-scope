/**
 * lib/wordpress.ts
 * Cross-posts published Reviews to a partner WordPress site via the REST API.
 * Auth: WordPress Application Passwords (Basic Auth), not the site owner's real password.
 */
import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/seo";

const TARGET = "wordpress:sonara";

interface WordPressConfig {
  siteUrl: string;
  username: string;
  appPassword: string;
  categoryId: number;
}

function getConfig(): WordPressConfig | null {
  const siteUrl = process.env.WORDPRESS_SITE_URL;
  const username = process.env.WORDPRESS_USERNAME;
  const appPassword = process.env.WORDPRESS_APP_PASSWORD;
  const categoryId = process.env.WORDPRESS_CATEGORY_ID;

  if (!siteUrl || !username || !appPassword || !categoryId) return null;

  return {
    siteUrl: siteUrl.replace(/\/$/, ""),
    username,
    appPassword,
    categoryId: parseInt(categoryId, 10),
  };
}

/** Minimal Markdown → HTML for WordPress post content. Mirrors the subset the review page renders. */
export function markdownToHtml(markdown: string): string {
  const paragraphs = markdown
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const renderInline = (text: string): string =>
    text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, "<code>$1</code>");

  return paragraphs
    .map((p) => {
      if (p.startsWith("### ")) return `<h3>${renderInline(p.slice(4))}</h3>`;
      if (p.startsWith("## ")) return `<h2>${renderInline(p.slice(3))}</h2>`;
      if (/^[-*]\s+/.test(p)) {
        const items = p
          .split("\n")
          .map((line) => `<li>${renderInline(line.replace(/^[-*]\s+/, ""))}</li>`)
          .join("");
        return `<ul>${items}</ul>`;
      }
      return `<p>${renderInline(p)}</p>`;
    })
    .join("\n");
}

interface WordPressPostResponse {
  id: number;
  link: string;
}

/**
 * Sprint 6 kill-switch: Sonara publishing now happens exclusively through
 * the Distribution Engine (lib/distribution/wordpress/*). This legacy path
 * is retired but deliberately NOT deleted — SyndicationPost's historical
 * rows and this module's logic remain available for rollback (see
 * docs/distribution-engine-sprint4.md's retirement checklist) without
 * requiring a schema change or data migration to bring back.
 *
 * This guard is a permanent `true`, independent of environment
 * configuration — WORDPRESS_* env vars being unset already caused
 * getConfig() to no-op, but that was an environmental accident, not a
 * code guarantee: if those vars were ever set again for any reason (a
 * different future integration reusing the same names, a restored old
 * .env, etc.), this function would silently resume making real live
 * WordPress publish requests with no coordination with the Distribution
 * Engine's own idempotency/activation guards. This constant is the actual
 * guarantee — flip it back to `false` only as part of a deliberate,
 * reviewed rollback of the Distribution Engine cutover, never by accident.
 */
const LEGACY_SONARA_PATH_DISABLED = true;

/**
 * Publish one Review to the partner WordPress site.
 * Idempotent per (reviewId, target) — call syncSyndicationStatus first if re-running.
 * Throws on failure; callers should treat this as best-effort and catch.
 */
export async function syndicateReviewToWordPress(reviewId: string): Promise<void> {
  if (LEGACY_SONARA_PATH_DISABLED) return;

  const config = getConfig();
  if (!config) return; // not configured yet — silently skip, not an error

  const existing = await prisma.syndicationPost.findUnique({
    where: { reviewId_target: { reviewId, target: TARGET } },
  });
  if (existing?.status === "sent") return; // already syndicated

  const review = await prisma.review.findUniqueOrThrow({
    where: { id: reviewId },
    select: {
      titleAr: true,
      content: true,
      summary: true,
      slug: true,
      imageUrl: true,
    },
  });

  const post = existing
    ? await prisma.syndicationPost.update({ where: { id: existing.id }, data: { status: "pending", errorMsg: null } })
    : await prisma.syndicationPost.create({ data: { reviewId, target: TARGET, status: "pending" } });

  try {
    const canonical = absoluteUrl(`/reviews/${review.slug}`);
    const bodyHtml =
      markdownToHtml(review.content) +
      `\n<p><em>المصدر: <a href="${canonical}" target="_blank" rel="noopener">لوميك</a></em></p>`;

    const auth = Buffer.from(`${config.username}:${config.appPassword}`).toString("base64");

    const res = await fetch(`${config.siteUrl}/wp-json/wp/v2/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        title: review.titleAr,
        content: bodyHtml,
        excerpt: review.summary,
        status: "publish",
        categories: [config.categoryId],
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`WordPress API ${res.status}: ${text.slice(0, 300)}`);
    }

    const data = (await res.json()) as WordPressPostResponse;

    await prisma.syndicationPost.update({
      where: { id: post.id },
      data: {
        status: "sent",
        remotePostId: String(data.id),
        remoteUrl: data.link,
        sentAt: new Date(),
        errorMsg: null,
      },
    });
  } catch (err) {
    await prisma.syndicationPost.update({
      where: { id: post.id },
      data: { status: "failed", errorMsg: err instanceof Error ? err.message : String(err) },
    });
    throw err;
  }
}
