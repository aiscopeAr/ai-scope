/**
 * scripts/dark-launch-wordpress.ts
 *
 * Production-safe end-to-end validation of the WordPress Distribution
 * pipeline WITHOUT making a real network request. Exercises, in order:
 *
 *   1. target config validation (using either a real DistributionTarget's
 *      config, if one exists in the DB, or a synthetic example config)
 *   2. Review -> DistributableContent mapping (using a real, already-
 *      published Review if one is available, so the check reflects real
 *      content shape)
 *   3. WordPress Formatter output (title/body/excerpt/categories/status)
 *   4. image selection (whether a featured image would be uploaded)
 *   5. the exact request shape (method, headers minus Authorization
 *      value, URL, JSON body) the Transport WOULD send to WordPress
 *
 * The WordPress Transport is created with a mock fetchImpl (see
 * lib/distribution/wordpress/transport.ts's WordPressTransportOptions) that
 * records the request and returns a synthetic success response — it never
 * calls the real global fetch, so this script cannot reach Sonara or any
 * other real WordPress site no matter what config is loaded.
 *
 * Run with: npx tsx scripts/dark-launch-wordpress.ts [reviewId]
 * If reviewId is omitted, the script uses the most recently published
 * Review, or a synthetic example if none exists.
 */

import { prisma } from "@/lib/db";
import { mapReviewToDistributableContent, type ReviewMapperInput } from "@/lib/distribution/wordpress/review-mapper";
import { wordPressFormatter } from "@/lib/distribution/wordpress/formatter";
import { createWordPressTransport } from "@/lib/distribution/wordpress/transport";
import type { DistributionTarget, DistributionTargetConfig } from "@/lib/distribution/types";

const SYNTHETIC_REVIEW: ReviewMapperInput = {
  id: "dark-launch-synthetic-review",
  titleAr: "مثال: أفضل أدوات الذكاء الاصطناعي",
  content: "## مقدمة\n\nهذا محتوى تجريبي **لأغراض التحقق فقط**.\n\n## الخلاصة\n\nنهاية المثال.",
  summary: "ملخص تجريبي لأغراض التحقق.",
  slug: "dark-launch-example",
  imageUrl: "https://res.cloudinary.com/example/image.webp",
  tags: ["AI", "أدوات"],
  publishedAt: new Date(),
  category: { slug: "ai-tools", nameAr: "أدوات الذكاء الاصطناعي" },
  sources: [],
};

const SYNTHETIC_CONFIG: DistributionTargetConfig = {
  mode: "automatic",
  extra: {
    baseUrl: "https://sonara.net",
    categoryIds: [44945],
    defaultStatus: "publish",
    uploadFeaturedImage: true,
  },
};

interface RecordedRequest {
  url: string;
  method: string;
  headerKeys: string[];
  bodyPreview: unknown;
}

/** True for Prisma's "table does not exist" error (P2021) — expected
 *  pre-migration, since DistributionTarget/DistributionTask are additive
 *  models this sprint defines but (per the sprint's migration-drift stop
 *  condition) has not yet applied to the database. Any other DB error is
 *  re-thrown; only a genuinely missing table falls back to synthetic data. */
function isMissingTableError(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: unknown }).code === "P2021";
}

async function loadReview(reviewId?: string): Promise<ReviewMapperInput> {
  const where = reviewId ? { id: reviewId } : { published: true };
  const row = await prisma.review.findFirst({
    where,
    orderBy: reviewId ? undefined : { publishedAt: "desc" },
    select: {
      id: true,
      titleAr: true,
      content: true,
      summary: true,
      slug: true,
      imageUrl: true,
      tags: true,
      publishedAt: true,
      sources: true,
      category: { select: { slug: true, nameAr: true } },
    },
  });

  if (!row) {
    console.log("[dark-launch] No published Review found in the database — using a synthetic example review instead.");
    return SYNTHETIC_REVIEW;
  }
  return row;
}

async function loadSonaraConfig(): Promise<DistributionTargetConfig> {
  try {
    const row = await prisma.distributionTarget.findFirst({
      where: { name: "Sonara", targetType: "wordpress" },
      select: { config: true },
    });

    if (!row) {
      console.log("[dark-launch] No Sonara DistributionTarget row found — using a synthetic example config instead (never a real one).");
      return SYNTHETIC_CONFIG;
    }
    return JSON.parse(row.config) as DistributionTargetConfig;
  } catch (err) {
    if (isMissingTableError(err)) {
      console.log("[dark-launch] DistributionTarget table does not exist yet (migration not applied) — using a synthetic example config instead.");
      return SYNTHETIC_CONFIG;
    }
    throw err;
  }
}

async function main() {
  const reviewIdArg = process.argv[2];

  console.log("=== Distribution Engine — WordPress Dark-Launch Validation ===\n");

  // 1. Load content + config (real if available, synthetic otherwise —
  //    never real credentials, only config/content shape).
  const review = await loadReview(reviewIdArg);
  const config = await loadSonaraConfig();
  console.log(`[1/5] Loaded review "${review.titleAr}" (id=${review.id}) and target config (baseUrl=${(config.extra as { baseUrl: string }).baseUrl})`);

  // 2. Mapping
  const content = mapReviewToDistributableContent(review);
  console.log(`[2/5] Mapped to DistributableContent: title="${content.title}", canonicalUrl=${content.canonicalUrl}`);

  // 3. Formatting
  const formatted = wordPressFormatter.format(content, config);
  console.log(`[3/5] Formatted output: slug="${formatted.body.slug}", status=${formatted.body.status}, categories=${formatted.body.categoryIds}`);
  console.log(`      contentHtml length=${formatted.body.contentHtml.length} chars, contains attribution footer: ${formatted.body.contentHtml.includes("المصدر:")}`);

  // 4. Image selection
  const wpConfig = config.extra as { uploadFeaturedImage: boolean };
  console.log(`[4/5] Featured image: uploadFeaturedImage=${wpConfig.uploadFeaturedImage}, imageUrl=${formatted.body.imageUrl ?? "(none)"}`);

  // 5. Request shape — via a fully mocked transport. No real network call
  //    is possible: fetchImpl below never delegates to the real fetch.
  const recorded: RecordedRequest[] = [];
  const mockFetch = (async (url: string, init?: RequestInit) => {
    const headers = (init?.headers ?? {}) as Record<string, string>;
    recorded.push({
      url,
      method: init?.method ?? "GET",
      headerKeys: Object.keys(headers), // key names only — never header values (Authorization included)
      bodyPreview: init?.body && typeof init.body === "string" ? JSON.parse(init.body) : "[binary]",
    });

    if (url.endsWith("/wp-json/wp/v2/media")) {
      return new Response(JSON.stringify({ id: 999, source_url: `${(config.extra as { baseUrl: string }).baseUrl}/wp-content/uploads/dark-launch.webp` }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    if (url === content.imageUrl) {
      return new Response(new Uint8Array([1, 2, 3, 4]), { status: 200, headers: { "content-type": "image/webp", "content-length": "4" } });
    }
    // Synthetic success — this is the ONLY response any URL in this script
    // can ever receive, since mockFetch never calls the real global fetch.
    return new Response(JSON.stringify({ id: 123456, link: `${(config.extra as { baseUrl: string }).baseUrl}/?p=123456` }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as unknown as typeof fetch;

  const transport = createWordPressTransport({ fetchImpl: mockFetch });
  const fakeTarget: DistributionTarget = {
    id: "dark-launch-target",
    name: "Sonara (dark launch)",
    targetType: "wordpress",
    enabled: true,
    credentials: { username: "[REDACTED]", applicationPassword: "[REDACTED]" },
    config,
  };

  const result = await transport.publish(formatted, fakeTarget);

  console.log(`[5/5] Simulated dispatch result: success=${result.success}`);
  console.log(`      Requests that WOULD be sent (${recorded.length}):`);
  for (const r of recorded) {
    console.log(`        ${r.method} ${r.url}`);
    console.log(`          headers: [${r.headerKeys.join(", ")}] (values never printed)`);
    console.log(`          body: ${JSON.stringify(r.bodyPreview).slice(0, 200)}${JSON.stringify(r.bodyPreview).length > 200 ? "..." : ""}`);
  }

  console.log("\n=== Dark-launch validation complete. No real network request was made. ===");
}

main()
  .catch((err) => {
    console.error(`[dark-launch] FAILED: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
