/**
 * lib/editorial-engine/rules/structural.ts
 * Required fields, title/slug quality, duplicate detection.
 */
import type { EditorialRule, RuleResult } from "../types";

function pass(ruleId: string): RuleResult {
  return { ruleId, status: "PASS", severity: "info", explanation: "OK", suggestedFix: null };
}
function warn(ruleId: string, explanation: string, suggestedFix: string): RuleResult {
  return { ruleId, status: "WARNING", severity: "warning", explanation, suggestedFix };
}
function fail(ruleId: string, explanation: string, suggestedFix: string): RuleResult {
  return { ruleId, status: "ERROR", severity: "error", explanation, suggestedFix };
}

export const requiredFields: EditorialRule = {
  id: "required-fields",
  evaluate: (subject) => {
    const missing: string[] = [];
    if (!subject.title || subject.title.trim().length === 0) missing.push("title");
    if (!subject.slug || subject.slug.trim().length === 0) missing.push("slug");
    if (!subject.bodyText || subject.bodyText.trim().length === 0) missing.push("body/description");
    if (missing.length > 0) {
      return fail("required-fields", `Missing required field(s): ${missing.join(", ")}.`, `Fill in: ${missing.join(", ")}.`);
    }
    return pass("required-fields");
  },
};

export const titleQuality: EditorialRule = {
  id: "title-quality",
  evaluate: (subject) => {
    const len = subject.title.trim().length;
    if (len < 10) {
      return warn("title-quality", `Title is only ${len} characters — likely too short to be descriptive.`, "Expand the title to clearly name the subject.");
    }
    if (len > 120) {
      return warn("title-quality", `Title is ${len} characters — likely too long for search/UI display.`, "Shorten the title to under ~120 characters.");
    }
    return pass("title-quality");
  },
};

const SLUG_PATTERN = /^[a-z0-9-]+$/;
export const slugQuality: EditorialRule = {
  id: "slug-quality",
  evaluate: (subject) => {
    if (!SLUG_PATTERN.test(subject.slug)) {
      return fail("slug-quality", `Slug "${subject.slug}" contains characters other than lowercase letters, numbers, and hyphens.`, "Rename the slug to match [a-z0-9-]+.");
    }
    if (/^test[-_]|^untitled|^draft/.test(subject.slug)) {
      return warn("slug-quality", `Slug "${subject.slug}" looks like a placeholder/test slug left in production.`, "Rename to a real, descriptive slug (note: renaming changes the URL — coordinate before doing so).");
    }
    return pass("slug-quality");
  },
};

export const duplicateSlug: EditorialRule = {
  id: "duplicate-slug",
  evaluate: (subject, context) => {
    // siblingSlugs includes this subject's own slug; a true duplicate would
    // mean two DB rows sharing one slug, which the DB's @unique constraint
    // already prevents — this rule exists as a defense-in-depth check for
    // content sources that bypass the ORM (e.g. bulk scripts).
    const occurrences = [...context.siblingSlugs].filter((s) => s === subject.slug).length;
    if (occurrences > 1) {
      return fail("duplicate-slug", `Slug "${subject.slug}" appears more than once among ${subject.kind} records.`, "Merge or rename one of the duplicate records.");
    }
    return pass("duplicate-slug");
  },
};

/** Near-duplicate title detection — same content kind, different slug, but
 *  a title that's either identical or a trivial rewording. Catches the
 *  Jasper AI / Jasper "same product listed twice" class of problem. */
export const duplicateTitle: EditorialRule = {
  id: "duplicate-title",
  evaluate: (subject, context) => {
    const normalize = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    const thisNorm = normalize(subject.title);
    const matches = [...context.siblingTitles.entries()].filter(
      ([slug, title]) => slug !== subject.slug && normalize(title) === thisNorm,
    );
    if (matches.length > 0) {
      return warn(
        "duplicate-title",
        `Title is a near-exact match with ${matches.length} other ${subject.kind}(s): ${matches.map(([s]) => s).join(", ")}.`,
        "Confirm these are genuinely different content, or merge the duplicates.",
      );
    }
    return pass("duplicate-title");
  },
};
