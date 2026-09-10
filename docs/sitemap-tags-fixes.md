# Sitemap / Tags / Prompts — SEO fixes
Date: 2026-09-11 · Scope: sitemap hygiene, tag de-duplication, prompt-duplication root cause. **Code-first, minimal DB writes, fully reversible.**

## Context
GSC/sitemap review surfaced: a published test page, splintered duplicate tags, and ~159 prompts sharing base slugs with `-1..-N` suffixes. Investigation (read-only, 2026-09-11) produced exact numbers and **corrected three assumptions** in the original brief.

## Investigation numbers (2026-09-11, production)
- Reviews: 400 published. Junk-slug reviews: **`test-minimal-1781533660844`** (published) — plus `ai-blood-test-future-medicine`, a **legitimate** article that only *contains* "test-".
- Tags: 839 distinct raw, 809 after the pre-existing "ال"-strip. Sitemap already filters `__author:` and count < 3 (→103 tags).
- Prompts: 457 (all published), 106 with `-N` suffix, 54 base-slug families / 159 prompts. **0 of 54 families share an identical body.**

## Decisions & rationale

### 1. Test page — `published = false` (NOT hard delete)
- Reversible; preserves any external links; no destructive DB write. `reviews/[slug]` already `notFound()`s on unpublished → clean 404. Unpublishing also drops it from the sitemap (which filters `published:true`).
- **Sitemap junk filter is ANCHORED**: `/^(test|draft|tmp|temp)[-_]/i`. A `contains "test-"` filter (as originally proposed) would have wrongly excluded `ai-blood-test-future-medicine`. Anchoring to the slug start with a `-`/`_` boundary keeps legitimate slugs indexed. Defense-in-depth for any future test slug.

### 2. Duplicate tags — read-time normalization, NO migration
- Tags are a `String[]` column on `Review` (no `Tag` table, no FK). Every surface (sitemap, tag page, matching, links) already routes through `normalizeTag()`. So a **read-time alias map in `lib/tags.ts`** fixes grouping, the sitemap, and canonical URLs at once — with **zero DB writes** and instant code-level rollback. A 400-row rewrite was rejected as unnecessary risk.
- **Sitemap threshold stays 3** (already stricter than the requested 2 and consistent with `MIN_REVIEWS_FOR_TAG_PAGE=3` on the tag page — lowering to 2 would emit tag URLs that 404).
- **Tag-page canonical bug fixed:** the page canonicalized to the *requested* slug, so two encodings of one tag self-canonicalized to different URLs (split ranking). Now canonicals to `tagToSlug(canonical)`.

Merges applied (morphological / verified-synonym only):
| Variant(s) | Canonical | Why |
|---|---|---|
| `ذكاء اصطناعي`, `ذكاء_اصطناعي`, `الذكاء_الاصطناعي`, `الذكاء الاصطناعي` | `ذكاء الاصطناعي` | underscore + definite-article/morphology |
| `أمن سيبراني`, `أمن_سيبراني`, `أمن السيبراني`, `الأمن السيبراني` | `أمن سيبراني` | morphology (السيبراني↔سيبراني) |
| `نماذج اللغة`, `نماذج اللغة الكبيرة`, `نماذج لغوية كبيرة` | `نماذج لغوية` | verified all LLM/language-model content (ai-models desk) |
| `Nvidia` / `nvidia` | `NVIDIA` | brand casing |

**Deliberately NOT merged:**
- `أنظمة الحماية → أمن سيبراني` — "protection systems" (generic) ≠ "cybersecurity" (specific). Semantic loss.
- `شركات → الشركات الكبرى` — the tiny `شركات`(3) already merges with the big `الشركات`(22) via the existing "ال" strip; `الشركات الكبرى`(7) is a distinct granularity ("big companies"). Merging would sweep 22 generic-companies reviews into "big companies".
- **Flagged for your decision:** `النماذج اللغوية`(29, dominant) is morphologically the same LLM cluster but was **not** in the explicit mapping. Left as-is ("when in doubt, don't merge"); adding it later is a one-line alias.

### 3. Duplicate prompts — root-cause fix now, conservative cleanup later
- **Key finding contradicting the brief:** 0/54 families share an identical body — these are **same-title, different-content** prompts, not true duplicates. Blind merge + 301 from 159 URLs would have **deleted unique content**.
- **Root cause fixed in the generator** (`generate-prompts`): `ensureUniqueSlug` appended `-1..-N` on every title collision, so the AhI kept minting near-duplicate URLs for repeated titles. Now: **skip creation when the title already exists** (`promptTitleExists`), and on a genuine different-title slug collision use a **content-hash** suffix, never `-N`.
- **Existing 159:** to be handled separately after a real text-similarity pass (read-only). Preferred consolidation is **canonical → family head** (keeps every URL and its content, resolves Google duplicate-content) rather than delete/301. No prompt merge performed in this change.

### 4. Dynamic sitemap
- Already dynamic: `app/sitemap.ts` is ISR `revalidate=3600` with real `updatedAt` lastmod for reviews/tools/comparisons/prompts. No change needed beyond the junk filter.

## Files changed (code)
- `lib/tags.ts` — read-time normalization + alias map + brand casing.
- `app/sitemap.ts` — anchored junk-slug filter (reviews + their tags).
- `app/(main)/tag/[tag]/page.tsx` — canonical → normalized slug.
- `app/api/cron/generate-prompts/route.ts` — dedupe-by-title, hash slug fallback, `skipped` counter.
- `lib/tags.test.ts` — new coverage.

## DB writes
- Exactly one, deferred to after code verification: `review.update` set `published=false` on `test-minimal-1781533660844`. Reversible. Backups of `Review.tags` and `Prompt` taken pre-change.

## Rollback
- Code: revert the commit (no migration). Tags/canonical/sitemap revert instantly.
- Data: re-`publish` the test review from the backup.

## Follow-ups (not done here)
- Decide on `النماذج اللغوية`(29) alias.
- Real similarity pass over the 54 prompt families → canonical-consolidate genuinely-similar ones.
- Optional: a stored `Tag` model only if DB-level tag filtering is ever needed.
