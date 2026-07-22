import { parseStringPromise } from "xml2js";

export type RssItem = {
  title: string;
  link: string;
  description: string;
  pubDate?: string;
  content?: string;
  imageUrl?: string;
};

const MIN_CONTENT_LENGTH = 100;
const FETCH_TIMEOUT_MS = 15_000;

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function extractText(node: unknown): string {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return extractText(node[0]);
  if (typeof node === "object" && node !== null) {
    const obj = node as Record<string, unknown>;
    if ("_" in obj) return String(obj._);
    if ("$" in obj) return "";
  }
  return String(node);
}

/**
 * RSS 2.0's <link> is a plain text node; Atom's <link href="..."/> is an
 * attribute-only element with no text content, so extractText() always
 * returns "" for it. Falling through to the href attribute here is required
 * or every Atom-format feed silently drops all of its items.
 */
function extractLink(node: unknown): string {
  const text = extractText(node);
  if (text) return text;

  const candidates = Array.isArray(node) ? node : [node];
  for (const candidate of candidates) {
    if (candidate && typeof candidate === "object" && "$" in (candidate as Record<string, unknown>)) {
      const attrs = (candidate as Record<string, unknown>).$ as Record<string, string> | undefined;
      if (attrs?.href && (!attrs.rel || attrs.rel === "alternate")) return attrs.href;
    }
  }
  return "";
}

export async function fetchRssFeed(rssUrl: string): Promise<RssItem[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let xml: string;
  try {
    const res = await fetch(rssUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "Lumiq/1.0 RSS Reader" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${rssUrl}`);
    xml = await res.text();
  } finally {
    clearTimeout(timer);
  }

  const parsed = await parseStringPromise(xml, { explicitArray: true, mergeAttrs: false });

  // Support RSS 2.0 and Atom
  const channel =
    parsed?.rss?.channel?.[0] ??
    parsed?.feed ??
    null;

  if (!channel) throw new Error("Unrecognised feed format");

  const rawItems: unknown[] =
    channel.item ??           // RSS 2.0
    channel.entry ??          // Atom
    [];

  const items: RssItem[] = [];

  for (const raw of rawItems) {
    const r = raw as Record<string, unknown>;

    const title = stripHtml(extractText(r.title));
    const link =
      extractLink(r.link) ||
      extractText((r as Record<string, unknown>)["feedburner:origLink"]) ||
      "";

    // Try full content first, fall back to description/summary
    const rawContent =
      extractText((r as Record<string, unknown>)["content:encoded"]) ||
      extractText(r.content) ||
      extractText(r.description) ||
      extractText(r.summary) ||
      "";

    const description = stripHtml(rawContent);
    const pubDate =
      extractText(r.pubDate) ||
      extractText(r.published) ||
      extractText(r.updated) ||
      undefined;

    // Extract image from enclosure, media:content, media:thumbnail, or og image in content
    let imageUrl: string | undefined;
    const enclosure = (r.enclosure as Record<string, unknown>[] | undefined)?.[0];
    if (enclosure) {
      const enc = enclosure as Record<string, unknown>;
      const attrs = enc.$ as Record<string, string> | undefined;
      if (attrs?.type?.startsWith("image/") && attrs?.url) imageUrl = attrs.url;
    }
    if (!imageUrl) {
      const media =
        (r["media:content"] as Record<string, unknown>[] | undefined)?.[0] ??
        (r["media:thumbnail"] as Record<string, unknown>[] | undefined)?.[0];
      if (media) {
        const attrs = (media as Record<string, unknown>).$ as Record<string, string> | undefined;
        if (attrs?.url) imageUrl = attrs.url;
      }
    }
    if (!imageUrl && rawContent) {
      const match = rawContent.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (match?.[1]) imageUrl = match[1];
    }

    if (!title || !link) continue;
    if (description.length < MIN_CONTENT_LENGTH) continue;

    items.push({ title, link, description, pubDate, content: rawContent, imageUrl });
  }

  return items;
}
