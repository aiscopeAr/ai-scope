/**
 * lib/editorial-engine/rules/index.ts
 * The full default rule set. Adding a rule anywhere in this project means:
 * write it in the appropriate rules/*.ts file, export it, list it here.
 * Nothing else needs to change for it to run against every content type it
 * declares `appliesTo`.
 */
import { requiredFields, titleQuality, slugQuality, duplicateSlug, duplicateTitle } from "./structural";
import { internalLinkingOutbound, internalLinkingBroken, orphanPage, relatedContent } from "./linking";
import {
  faqPresence,
  comparisonVerdict,
  comparisonMethodology,
  comparisonCompleteness,
  comparisonScoreConsistency,
  emptyOptionalSections,
  thinContent,
  factualCompleteness,
} from "./completeness";
import { seoTitleLength, seoDescriptionLength } from "./seo";
import { freshnessReviewDate, freshnessUpdateDate } from "./freshness";
import { revenueReadiness } from "./revenue";
import { connectivityTool, connectivityPrompt, connectivityComparison, connectivityReview } from "./connectivity";
import type { EditorialRule } from "../types";

export const DEFAULT_RULES: EditorialRule[] = [
  requiredFields,
  titleQuality,
  slugQuality,
  duplicateSlug,
  duplicateTitle,
  internalLinkingOutbound,
  internalLinkingBroken,
  orphanPage,
  relatedContent,
  faqPresence,
  comparisonVerdict,
  comparisonMethodology,
  comparisonCompleteness,
  comparisonScoreConsistency,
  emptyOptionalSections,
  thinContent,
  factualCompleteness,
  seoTitleLength,
  seoDescriptionLength,
  freshnessReviewDate,
  freshnessUpdateDate,
  revenueReadiness,
  connectivityTool,
  connectivityPrompt,
  connectivityComparison,
  connectivityReview,
];
