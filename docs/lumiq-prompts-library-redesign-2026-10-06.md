# Prompts Library — Redesign Plan

**Status:** DRAFT for review · **Date:** 2026-10-06 · **Owner:** hannaobead · Drafted by: Claude

## 0. Locked decisions (from review)
- **Role:** curated **secondary asset** — a small, excellent set. Tools + news stay the main focus.
- **Content model:** **hybrid** — curate & enrich the best existing prompts (by viewCount) + an upgraded AI generator that produces **drafts for human approval**, not auto-published filler.
- **Example images:** yes, **featured only** (generated via Replicate, like article covers).

---

## 1. Current state (audit, live 2026-10-06)
- **529 prompts**, all `published:true`, only **6 featured**.
- viewCount distribution: `0→26 · 1-4→98 · 5-19→237 · 20-49→142 · 50-99→20 · 100+→6`. So **≥50 views = 26 prompts**, ≥20 = 168, ≥100 = 6.
- By category: **general 268 (51%)** · writing 76 · marketing 74 · code 63 · **image 48**.
- Total views 9,108; top page 130. Real but skewed on-site usage.
- **Generator** (`/api/cron/generate-prompts`, daily 03:00 UTC): ~5/run (3 tool + 2 general), gpt-4o-mini single-shot, 50–200 words, **auto-published, no quality gate, never featured, no example image**. ~17/week of thin content burning OpenAI credits → all `noindex` (per PROMPT_INDEXATION_001) → ~1 view each.
- **Page** (`/prompts/[slug]`): already solid — cached reads, AR/EN tabs, copy, related, tool card, OG. **Missing for quality:** example image, variations, pro-tips, use-cases, and genuinely specific prompt text. `general` category is the vaguest and the largest.

**Diagnosis:** a thin-content factory. The design is fine; the *content* and the *generation strategy* are the problem.

---

## 2. Target vision
An **Arabic-first curated prompt gallery** — few, excellent, indexed prompts that actually help, each at ~promptlibrary.org quality: a **real, specific, copy-pasteable prompt** + (for image prompts) an **example output image** + **variations** + **pro tips** + **use-cases**. English prompt libraries are saturated; **Arabic quality prompts with examples are a weak-competition niche** — same thesis as the Tools platform.

Size: **~35–40 featured** prompts (indexed), the rest pruned or left noindexed.

---

## 3. The "great prompt page" anatomy (new)
1. **Hero example image** (image prompts) — what the prompt produces. *(featured only)*
2. **The prompt** — specific & runnable, AR/EN tabs, copy button, model hint (e.g. "Midjourney v6 · `--ar 16:9`", "DALL·E 3", "ChatGPT/Claude"). Not generic filler.
3. **لماذا يعمل** — 2–3 sentences on why it's good (the current `description`, upgraded).
4. **تنويعات (Variations)** — 2–4 ready tweaks ("نسخة سينمائية", "نسخة مينيمال", "بخلفية شفافة").
5. **نصائح احترافية (Pro tips)** — 2–4 bullets (parameters, what to change, pitfalls).
6. **أمثلة استخدام (Use-cases)** — chips.
7. Tool card + compatible-models + related + tags (keep — already good).

---

## 4. Schema changes (Prompt model)
Add nullable columns (safe additive migration; existing rows unaffected):
```prisma
exampleImageUrl String?        // Cloudinary URL, featured image prompts
imagePrompt     String?  @db.Text  // the exact gen prompt used for the example (shown + reproducible)
modelHint       String?        // "Midjourney v6", "DALL·E 3", "ChatGPT / Claude", …
variations      Json?          // [{ label, text }]
tips            String[]       // pro tips
useCases        String[]       // chips
quality         Int      @default(0)  // 0 raw · 1 reviewed · 2 featured-grade (curation workflow)
```
Page renders new sections only when the fields are present → **no visual regression** for un-enriched prompts.

---

## 5. Triage of the existing 529
| Tier | Which | Action | Index |
|---|---|---|---|
| **A — Feature & enrich** | 26 with ≥50 views **+** ~10–15 hand-picked strong image/writing prompts → **~35–40** | rewrite to specific prompt, add variations+tips+use-cases; **example image for image-category**; set `featured:true` | **indexed** |
| **B — Keep (lean)** | 20–49 views (≈142), not enriched | leave as-is | noindexed (unchanged) |
| **C — Prune** | 0–4 views (≈124), and the weakest **general** filler | set `published:false` (drops from hub + sitemap) or delete | removed |

Net: a clean library fronted by ~40 excellent indexed pages, ~140 decent noindexed ones, and the thin tail retired. (Exact Tier-C cut is a reviewable list before anything is unpublished.)

---

## 6. Generator overhaul (hybrid)
- **Now:** gate behind a `SystemSetting` flag `promptsAutoGenerate` → **set OFF** (stops credit burn immediately, reversible without deploy).
- **Upgraded generator (when ON):** gpt-4o, a quality **rubric** in the prompt (must be specific, include model params, 2–4 variations, 2–4 tips, use-cases, and — for image — an `imagePrompt` for the example), **output as `published:false` draft with `quality:0`**. Lower cadence (e.g. 1–2/week).
- **Review workflow:** an admin view lists drafts; you approve/edit → `published:true`, `quality:2`, `featured:true` (and generate the example image on approval). Nothing reaches the public un-reviewed.

---

## 7. Example images (featured only)
- Reuse the article pipeline: Replicate **flux-schnell** → Cloudinary (permanent). Same `lib/images.ts` + `lib/image-style.ts` style palette.
- Only for **featured image-category** prompts (and optionally a hero for non-image featured). ~40 images one-off ≈ trivial Replicate cost; **no OpenAI images** (credit rule).
- Stored in `exampleImageUrl`; `imagePrompt` shown so users can reproduce.

---

## 8. SEO / indexation
Fits the existing **PROMPT_INDEXATION_001** policy unchanged: **featured ⇒ indexed + in sitemap**, everything else `noindex,follow`. So Tier A automatically becomes the indexed surface; no policy change needed. Enriched pages = real ranking candidates (Arabic niche). JSON-LD: keep, enrich `HowTo`/add `ImageObject` for the example.

---

## 9. Hub (`/prompts`) redesign
- Lead with **Featured** (card + thumbnail for image ones), then category tabs (dedupe/rename: fold vague **general** into real categories where possible), and a client-side search/filter. Make the hub feel like a gallery, not a list.

---

## 10. Phased rollout (each its own PR)
1. **P1 — Stop the bleed** *(tiny, zero-risk)*: add `promptsAutoGenerate` flag, default OFF; generator respects it. **Ship first.**
2. **P2 — Schema + page sections**: additive migration + render new sections when present (no regression).
3. **P3 — Curate Tier A**: pick the ~40, enrich content (you + me), generate example images, set featured. Reviewable slug list first.
4. **P4 — Prune Tier C**: reviewable list → `published:false`.
5. **P5 — Generator v2 + review view** *(optional, only if we keep generating)*.
6. **P6 — Hub gallery redesign.**

---

## 11. Open decisions (need your call) 🟡
- **D1 — Tier-A size:** ~40 (26 proven + ~14 hand-picked)? more/less?
- **D2 — Tier-C:** `published:false` (recoverable) vs hard delete? Recommend unpublish.
- **D3 — `general` category (268):** keep as a catch-all, or re-map into image/writing/code/marketing and retire "general"? Recommend re-map + retire.
- **D4 — Generator (P5):** keep a slow, reviewed generator, or go **fully hand-curated** and remove the cron entirely? (Role is "curated", so fully-manual is defensible.)
- **D5 — Start point:** confirm we start with **P1 (flag, stop the bleed)** now.

**→ Mark up §11 and I'll start with P1.**
