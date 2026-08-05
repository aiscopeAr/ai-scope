/**
 * lib/distribution/wordpress/html.ts
 *
 * Minimal Markdown → HTML rendering for WordPress post content, plus the
 * required Arabic attribution footer. The markdown transform is a
 * deliberate copy of lib/wordpress.ts's existing `markdownToHtml` — not an
 * import from it — so that this new module has zero dependency on the
 * legacy file (which stays untouched, still serving live SyndicationPost
 * traffic) and so current production output cannot change as a side
 * effect of this sprint. Sprint 4 can retire the legacy copy once this
 * path is wired in and verified; see the legacy-audit section of the
 * Sprint 3 report for the reuse/duplication assessment.
 */

/** Escapes text for safe inclusion in HTML — applied to every piece of
 *  user/AI-generated text before it is interpolated into a tag, so no
 *  markdown input can inject arbitrary markup. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderInline(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
}

/** Same subset supported by lib/wordpress.ts today: paragraphs, ##/###
 *  headings, unordered lists, and bold/italic/code inline formatting.
 *  Intentionally does not attempt full CommonMark — only what Lumiq's own
 *  AI-generated review content actually produces.
 *
 *  A "block" (text between blank lines) can itself start with a heading
 *  line immediately followed by list items with no blank line separating
 *  them — real AI-generated FAQ sections do this ("## FAQ\n- question..."
 *  with no blank line before the first bullet). Splitting only on blank
 *  lines would swallow that first bullet into the heading's <h2>; each
 *  block is therefore split again on its own line breaks so a leading
 *  heading line and subsequent list lines render as separate elements. */
export function markdownToHtml(markdown: string): string {
  const blocks = markdown
    .split(/\n\n+/)
    .map((b) => b.trim())
    .filter(Boolean);

  const html: string[] = [];

  for (const block of blocks) {
    const lines = block.split("\n");
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      if (line.startsWith("### ")) {
        html.push(`<h3>${renderInline(line.slice(4))}</h3>`);
        i++;
        continue;
      }
      if (line.startsWith("## ")) {
        html.push(`<h2>${renderInline(line.slice(3))}</h2>`);
        i++;
        continue;
      }
      if (/^[-*]\s+/.test(line)) {
        // A bullet, and any immediately-following non-bullet lines up to
        // the next heading/bullet/blank, each become their own <li> — this
        // preserves the established rendering for "- **question**\n  answer"
        // pairs (an indented continuation line, not a nested bullet) as two
        // list items, matching how every other list in this document already
        // renders regardless of whether the list is glued to a heading.
        const items: string[] = [];
        while (i < lines.length && (/^[-*]\s+/.test(lines[i]) || (items.length > 0 && lines[i].trim() !== "" && !lines[i].startsWith("## ") && !lines[i].startsWith("### ")))) {
          items.push(`<li>${renderInline(lines[i].replace(/^[-*]\s+/, ""))}</li>`);
          i++;
        }
        html.push(`<ul>${items.join("")}</ul>`);
        continue;
      }

      // Plain text line(s) up to the next heading/list line form one paragraph.
      const paragraphLines: string[] = [];
      while (i < lines.length && !lines[i].startsWith("## ") && !lines[i].startsWith("### ") && !/^[-*]\s+/.test(lines[i])) {
        paragraphLines.push(lines[i]);
        i++;
      }
      html.push(`<p>${renderInline(paragraphLines.join(" ").trim())}</p>`);
    }
  }

  return html.join("\n");
}

const LUMIQ_GENERAL_URL = "https://lumiq.news";

/**
 * Builds the required Arabic attribution footer:
 *
 *   ―――――――――――――――
 *   المصدر: <a href="{articleUrl}">لوميك</a>
 *   للمزيد من التحليلات وأخبار الذكاء الاصطناعي:
 *   https://lumiq.news
 *
 * "لوميك" links to the specific original article (articleUrl); the plain
 * lumiq.news URL is a second, separate link to the general site. No
 * sponsorship language, no "بالتعاون مع", no hidden links — every href is
 * visibly rendered as anchor text or a literal URL in the body text, and
 * both links carry rel="noopener" (an external outbound link from a
 * partner site) without nofollow, since this is genuine source
 * attribution rather than a link scheme.
 *
 * `articleUrl` must be an absolute https URL already produced by the
 * canonical Lumiq article link (e.g. via lib/seo.ts's absoluteUrl) —
 * this function does not construct or validate that URL itself, since
 * mapping a Review into an articleUrl is a future sprint's concern.
 */
export function buildAttributionFooter(articleUrl: string): string {
  const safeArticleUrl = escapeHtml(articleUrl);

  return [
    "<hr />",
    "<p><em>",
    `المصدر: <a href="${safeArticleUrl}" target="_blank" rel="noopener">لوميك</a><br />`,
    "للمزيد من التحليلات وأخبار الذكاء الاصطناعي:<br />",
    `<a href="${LUMIQ_GENERAL_URL}" target="_blank" rel="noopener">${LUMIQ_GENERAL_URL}</a>`,
    "</em></p>",
  ].join("\n");
}

/** Combines the rendered body with the attribution footer, separated by
 *  the required clear separator (the footer's own leading <hr />). */
export function buildWordPressBodyHtml(markdownBody: string, articleUrl: string): string {
  return `${markdownToHtml(markdownBody)}\n${buildAttributionFooter(articleUrl)}`;
}
