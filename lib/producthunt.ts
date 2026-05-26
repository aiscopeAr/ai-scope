/**
 * ProductHunt API client — fetches daily new AI tools.
 *
 * Requires PRODUCTHUNT_API_TOKEN in env (Developer Token from producthunt.com/v2/oauth/applications).
 * Falls back gracefully if the token is missing (returns empty array).
 *
 * Docs: https://api.producthunt.com/v2/docs
 */

export interface PHPost {
  id: string;
  name: string;
  tagline: string;
  description: string;
  slug: string;
  url: string;
  website: string;
  thumbnail?: { url: string } | null;
  topics?: { edges: Array<{ node: { name: string; slug: string } }> };
  pricing?: string;
}

interface PHResponse {
  data?: {
    posts?: {
      edges: Array<{ node: PHPost }>;
    };
  };
  errors?: Array<{ message: string }>;
}

const PH_ENDPOINT = "https://api.producthunt.com/v2/api/graphql";

const DAILY_TOOLS_QUERY = `
query DailyTools($after: String) {
  posts(first: 20, order: VOTES, after: $after, postedAfter: $postedAfter, topic: "artificial-intelligence") {
    edges {
      node {
        id
        name
        tagline
        description
        slug
        url
        website
        thumbnail { url }
        topics(first: 5) { edges { node { name slug } } }
        pricing
      }
    }
  }
}
`;

/** Fetch AI posts from ProductHunt posted since `since` date. */
export async function fetchPHToolsSince(since: Date): Promise<PHPost[]> {
  const token = process.env.PRODUCTHUNT_API_TOKEN;
  if (!token) {
    console.warn("[producthunt] PRODUCTHUNT_API_TOKEN not set — skipping");
    return [];
  }

  // Build ISO datetime string for the GraphQL variable
  const postedAfter = since.toISOString();

  const query = `
    query DailyTools {
      posts(first: 20, order: VOTES, topic: "artificial-intelligence", postedAfter: "${postedAfter}") {
        edges {
          node {
            id
            name
            tagline
            description
            slug
            url
            website
            thumbnail { url }
            topics(first: 5) { edges { node { name slug } } }
            pricing
          }
        }
      }
    }
  `;

  try {
    const res = await fetch(PH_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      console.error(`[producthunt] HTTP ${res.status}: ${await res.text()}`);
      return [];
    }

    const data = (await res.json()) as PHResponse;

    if (data.errors?.length) {
      console.error("[producthunt] GraphQL errors:", data.errors);
      return [];
    }

    return (data.data?.posts?.edges ?? []).map((e) => e.node);
  } catch (err) {
    console.error("[producthunt] fetch failed:", err);
    return [];
  }
}

/** Map PH pricing string to our pricing enum. */
export function normalizePricing(ph: string | undefined | null): "free" | "freemium" | "paid" {
  if (!ph) return "freemium";
  const lower = ph.toLowerCase();
  if (lower.includes("free") && lower.includes("paid")) return "freemium";
  if (lower.includes("free")) return "free";
  if (lower.includes("paid") || lower.includes("$")) return "paid";
  return "freemium";
}
