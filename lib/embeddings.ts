import OpenAI from "openai";
import { prisma } from "@/lib/db";

let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

const EMBED_MODEL = "text-embedding-3-small";
const EMBED_DIMS = 1536;

export async function embedText(text: string): Promise<number[]> {
  const client = getClient();
  const res = await client.embeddings.create({
    model: EMBED_MODEL,
    input: text.slice(0, 8000), // token safety
    dimensions: EMBED_DIMS,
  });
  return res.data[0].embedding;
}

/** Store embedding on a published Review after approval */
export async function embedReview(reviewId: string): Promise<void> {
  const review = await prisma.review.findUniqueOrThrow({
    where: { id: reviewId },
    select: { titleAr: true, summary: true, content: true },
  });

  const text = `${review.titleAr}\n\n${review.summary}\n\n${review.content}`;
  const vector = await embedText(text);

  // pgvector expects a Postgres array literal: '[0.1,0.2,...]'
  const literal = `[${vector.join(",")}]`;
  await prisma.$executeRaw`
    UPDATE "Review"
    SET embedding = ${literal}::vector
    WHERE id = ${reviewId}
  `;
}

export interface SimilarReview {
  id: string;
  titleAr: string;
  slug: string;
  summary: string;
  authorSlug: string;
  publishedAt: Date | null;
  similarity: number;
}

/**
 * Find the N most similar published reviews for a given author.
 * Used to inject memory context before writing a new review.
 */
export async function findSimilarReviews(
  queryText: string,
  authorSlug: string,
  limit = 4,
  excludeId?: string,
): Promise<SimilarReview[]> {
  const vector = await embedText(queryText);
  const literal = `[${vector.join(",")}]`;

  // Raw query — Prisma doesn't support vector ops natively yet
  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      titleAr: string;
      slug: string;
      summary: string;
      authorSlug: string;
      publishedAt: Date | null;
      similarity: number;
    }>
  >`
    SELECT
      id,
      "titleAr",
      slug,
      summary,
      "authorSlug",
      "publishedAt",
      1 - (embedding <=> ${literal}::vector) AS similarity
    FROM "Review"
    WHERE
      published = true
      AND "authorSlug" = ${authorSlug}
      AND embedding IS NOT NULL
      ${excludeId ? prisma.$queryRaw`AND id != ${excludeId}` : prisma.$queryRaw``}
    ORDER BY embedding <=> ${literal}::vector
    LIMIT ${limit}
  `;

  return rows;
}
