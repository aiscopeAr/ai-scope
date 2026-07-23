import Link from "next/link";
import {
  INLINE_LINK_TOKEN,
  parseInternalLinkToken,
  isLinkTargetValid,
  type LinkableSlugSets,
} from "@/lib/internal-links";

/**
 * Splits text containing editorial [[type:slug|label]] tokens into plain
 * strings and <Link> elements. A real <a href> server-rendered on every
 * request — crawlable, no client JS required for navigation.
 *
 * An unresolvable target (typo, unpublished, deleted) degrades to its plain
 * label instead of a dead link, so a bad edit never breaks the page.
 */
export function renderWithInternalLinks(text: string, sets: LinkableSlugSets): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  for (const match of text.matchAll(INLINE_LINK_TOKEN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) nodes.push(text.slice(lastIndex, index));

    const link = parseInternalLinkToken(match);
    nodes.push(
      isLinkTargetValid(link, sets) ? (
        <Link key={key++} href={link.href} className="internal-link font-medium underline underline-offset-2 transition-opacity hover:opacity-75" style={{ color: "var(--accent)" }}>
          {link.label}
        </Link>
      ) : (
        link.label
      ),
    );

    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}
