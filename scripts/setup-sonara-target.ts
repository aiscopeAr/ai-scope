/**
 * scripts/setup-sonara-target.ts
 *
 * Creates or updates the Sonara DistributionTarget row from environment
 * variables. Safe to run repeatedly — upsertDistributionTarget() keys on
 * (name, targetType), so re-running this script never creates a duplicate
 * Sonara target; it only refreshes config/credentials on the existing row.
 *
 * Requires (no defaults, no fallback values — every one of these must be
 * set explicitly in the environment this script runs in):
 *   SONARA_WORDPRESS_BASE_URL           e.g. https://sonara.net
 *   SONARA_WORDPRESS_USERNAME
 *   SONARA_WORDPRESS_APPLICATION_PASSWORD
 *   SONARA_WORDPRESS_CATEGORY_ID        e.g. 44945
 *
 * Optional:
 *   SONARA_WORDPRESS_ENABLED            "true" to enable on creation/update;
 *                                       defaults to "false" (dark launch —
 *                                       see docs/distribution-engine-sprint4.md).
 *   SONARA_WORDPRESS_DEFAULT_STATUS     "draft" or "publish"; defaults to
 *                                       "draft" — a target must be
 *                                       explicitly opted into publishing
 *                                       live, never by omission.
 *   SONARA_WORDPRESS_UPLOAD_FEATURED_IMAGE  "true"/"false"; defaults to "true".
 *   SONARA_WORDPRESS_AUTHOR_ID
 *   SONARA_WORDPRESS_TIMEOUT_MS
 *
 * Run with: npx tsx scripts/setup-sonara-target.ts
 *
 * As of Sprint 4, none of the required env vars above are set in this
 * project's .env — this script will refuse to run until an operator adds
 * real Sonara Application Password credentials. This is intentional: per
 * the sprint's explicit stop condition on "invalid or unverifiable Sonara
 * credentials," no code path in this repository fabricates or assumes a
 * credential value.
 */

import { upsertDistributionTarget, type UpsertTargetInput } from "@/lib/distribution/persistence/target";
import { validateWordPressTarget } from "@/lib/distribution/wordpress/config";
import { WORDPRESS_TARGET_TYPE } from "@/lib/distribution/wordpress/formatter";
import { normalizePartnerId } from "@/lib/distribution/attribution";

export const SONARA_TARGET_NAME = "Sonara";

/** Deterministic partner identifier for UTM attribution — derived from the
 *  target's own name (normalizePartnerId("Sonara") === "sonara"), not a
 *  separate env var, since the two must always agree and there is no
 *  scenario where a target's UTM identity should differ from its own
 *  display name. */
export const SONARA_PARTNER_ID = normalizePartnerId(SONARA_TARGET_NAME);

export function requireEnv(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name];
  if (!value || value.trim() === "") {
    throw new Error(`${name} is not set — refusing to create/update the Sonara target without it.`);
  }
  return value;
}

/**
 * Pure: reads and validates the required Sonara env vars, returning the
 * exact UpsertTargetInput setup-sonara-target would pass to
 * upsertDistributionTarget(). Separated from main() so this logic is
 * testable without a real database or process.exit side effect.
 */
export function buildSonaraUpsertInput(env: NodeJS.ProcessEnv): UpsertTargetInput {
  const baseUrl = requireEnv(env, "SONARA_WORDPRESS_BASE_URL");
  const username = requireEnv(env, "SONARA_WORDPRESS_USERNAME");
  const applicationPassword = requireEnv(env, "SONARA_WORDPRESS_APPLICATION_PASSWORD");
  const categoryIdRaw = requireEnv(env, "SONARA_WORDPRESS_CATEGORY_ID");
  const categoryId = Number(categoryIdRaw);
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    throw new Error(`SONARA_WORDPRESS_CATEGORY_ID must be a positive integer, got "${categoryIdRaw}"`);
  }

  const enabled = env.SONARA_WORDPRESS_ENABLED === "true";
  const authorId = env.SONARA_WORDPRESS_AUTHOR_ID ? Number(env.SONARA_WORDPRESS_AUTHOR_ID) : undefined;
  const timeoutMs = env.SONARA_WORDPRESS_TIMEOUT_MS ? Number(env.SONARA_WORDPRESS_TIMEOUT_MS) : undefined;

  // Defaults to "draft" — a target must be explicitly switched to "publish"
  // by an operator, never end up there because this variable was unset.
  const defaultStatusRaw = env.SONARA_WORDPRESS_DEFAULT_STATUS ?? "draft";
  if (defaultStatusRaw !== "draft" && defaultStatusRaw !== "publish") {
    throw new Error(`SONARA_WORDPRESS_DEFAULT_STATUS must be "draft" or "publish", got "${defaultStatusRaw}"`);
  }
  const defaultStatus = defaultStatusRaw;

  const uploadFeaturedImage = env.SONARA_WORDPRESS_UPLOAD_FEATURED_IMAGE !== "false";

  const credentials = { username, applicationPassword };
  const config = {
    mode: "automatic" as const,
    partnerId: SONARA_PARTNER_ID,
    extra: {
      baseUrl,
      categoryIds: [categoryId],
      defaultStatus,
      uploadFeaturedImage,
      ...(authorId ? { authorId } : {}),
      ...(timeoutMs ? { timeoutMs } : {}),
    },
  };

  const validation = validateWordPressTarget(credentials, config.extra);
  if (!validation.valid) {
    // Error messages from validateWordPressTarget never include credential
    // values themselves — see lib/distribution/wordpress/config.ts.
    throw new Error(`Refusing to create/update Sonara target: ${validation.errors.join("; ")}`);
  }

  return { name: SONARA_TARGET_NAME, targetType: WORDPRESS_TARGET_TYPE, enabled, config, credentials };
}

async function main() {
  const input = buildSonaraUpsertInput(process.env);
  const result = await upsertDistributionTarget(input);

  // Never print the credentials object — only the non-secret outcome.
  const categoryIds = (input.config.extra as { categoryIds: number[] }).categoryIds;
  const baseUrl = (input.config.extra as { baseUrl: string }).baseUrl;
  console.log(
    `[setup-sonara-target] ${result.created ? "created" : "updated"} target id=${result.id} enabled=${input.enabled} categoryIds=${categoryIds} baseUrl=${baseUrl}`,
  );
  if (!input.enabled) {
    console.log("[setup-sonara-target] Target created in DISABLED (dark-launch) state. Set SONARA_WORDPRESS_ENABLED=true to enable dispatch once validated.");
  }
}

main()
  .catch((err) => {
    console.error(`[setup-sonara-target] FAILED: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    const { prisma } = await import("@/lib/db");
    await prisma.$disconnect();
  });
