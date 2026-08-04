# Distribution Engine — Sprint 4: Persistence, Queue, and Sonara Dark Launch

Status: implementation complete except database migration application (see "Migration Status" below — blocked by pre-existing, unrelated drift, deferred for manual operator resolution). No real Sonara request was made. No credentials exist in this environment.

---

## Migration Status — BLOCKED, Deferred to Operator

Running `prisma migrate dev --create-only` against the current database surfaced **pre-existing drift unrelated to this sprint's schema change**: the `prisma/migrations/` folder contains only 2 migrations (`20260513084739_init`, `20260513090745_add_article_queue`), but `prisma migrate status` reports the live database schema as already "up to date" with today's much larger `schema.prisma` — meaning most of the schema's evolution since `init` happened out-of-band (e.g. via `prisma db push` in a prior session), never captured in a migration file.

When asked to reconcile, `migrate dev` proposed **dropping a column** (`Source.url`) and required a full **`prisma migrate reset`** (destroying all data) to proceed. This is exactly the sprint's explicit stop condition ("a destructive migration requirement") — I did not proceed.

**What I did instead** (per your explicit direction after being asked): built and fully unit-tested every piece of Sprint 4 logic against the Prisma **client types** (which did regenerate correctly from the schema edit — only the native query-engine binary hit an unrelated Windows file-lock, not a schema problem), and hand-wrote the migration SQL for the two new tables below for your manual review and application once the `Source.url` drift is investigated and resolved on your terms.

**Hand-written migration** (additive only — reflects exactly the two new Prisma models, nothing else): `prisma/migrations/20260804010000_add_distribution_engine/migration.sql` (not applied; created via `git status`-visible new file, ready for you to run `prisma migrate resolve`/`deploy` once you've dealt with the `init`/drift gap on your own terms — possibly via `prisma migrate resolve --applied` for the untracked historical changes first).

Until this is applied, `DistributionTarget`/`DistributionTask` do not exist as real tables — every runtime code path that touches them (task creation in `approveReview()`, the `distribution-queue` cron, the admin diagnostic route, the Sonara setup script) will fail loudly (Prisma's `P2021` "table does not exist") rather than silently. This was verified directly: `scripts/dark-launch-wordpress.ts` hit exactly this error on first run before I added a graceful synthetic-data fallback specifically for this pre-migration state (see below) — proving the fail-loud behavior is real, not theoretical.

---

## Legacy Syndication Coexistence

**Guarantee for this sprint: only one of the two WordPress paths can ever actually publish to Sonara, because both are currently inert.**

- **Legacy path** (`lib/wordpress.ts` → `SyndicationPost`): reads `WORDPRESS_SITE_URL`/`WORDPRESS_USERNAME`/`WORDPRESS_APP_PASSWORD`/`WORDPRESS_CATEGORY_ID` from env vars. **None of these are set in `.env`** (verified directly) — `getConfig()` returns `null`, and `syndicateReviewToWordPress()` silently no-ops on every call. Confirmed zero existing `SyndicationPost` rows in the database.
- **New path** (`lib/distribution/wordpress/*` → `DistributionTask`): requires a `DistributionTarget` row with `enabled: true`. No such row exists (table doesn't even exist pre-migration), and `scripts/setup-sonara-target.ts` — the only code that can create one — refuses to run without real `SONARA_WORDPRESS_*` credentials, which also don't exist. Even once created, the script **defaults `enabled: false`** (dark launch) unless `SONARA_WORDPRESS_ENABLED=true` is explicitly set.

Both call sites now coexist inside `approveReview()` (`lib/review-queue.ts`), one new line added alongside the untouched legacy call — both are currently no-ops for Sonara specifically, so there is no risk of a double-publish today.

**The actual enforcement mechanism, going forward**: this is a documented operational discipline, not a code-level mutex, because the two systems don't share any row-level lock by design (that would be exactly the "duplicate publication tracking" the frozen architecture forbids). The discipline is: **never set both** legacy WordPress env vars **and** create/enable a Sonara `DistributionTarget` at the same time. Sprint 5's cutover (below) is what removes the possibility entirely by deleting the legacy path.

### Retirement Checklist (Sprint 5)

Execute in this exact order — each step assumes the previous one is verified:

1. Confirm the Sonara `DistributionTarget` has been running with `enabled: true` in production for a meaningful stretch with correct `published`/`failed` outcomes in the admin diagnostic route (`GET /api/admin/distribution`).
2. Confirm zero `SyndicationPost` rows have a `status` other than what existed at cutover time (i.e., legacy path genuinely never fired during the dark-launch/validation window) — a quick `SELECT` audit.
3. Remove the `syndicateReviewToWordPress(review.id)` call and its import from `lib/review-queue.ts`, leaving only the Distribution Engine call.
4. Delete `lib/wordpress.ts`.
5. Migrate any historical `SyndicationPost` rows into `DistributionTask` if audit continuity is desired (optional — there are zero rows today, so likely unnecessary), then drop the `SyndicationPost` model and its migration.
6. Remove `WORDPRESS_SITE_URL`/`WORDPRESS_USERNAME`/`WORDPRESS_APP_PASSWORD`/`WORDPRESS_CATEGORY_ID` from `.env`/`.env.example`/Vercel project env vars.
7. Update `docs/distribution-engine-foundation.md` and this file to mark the legacy path as retired.

---

## Dark-Launch Validation — What Was Actually Run

`scripts/dark-launch-wordpress.ts` was executed twice against **real, already-published Reviews** from the database (not synthetic data, since real Reviews exist) — see the two runs' console output, both confirming zero real network calls:

**Run 1** (`cmsd1o7ux000gl1040biucjp4`, no image): mapped → formatted → transport dispatch. Result: `success=false`, 0 requests sent — because the target config's `uploadFeaturedImage: true` combined with the review having no `imageUrl` correctly and safely refuses to publish an incomplete post (the exact behavior Sprint 3 built and tested), rather than silently proceeding without an image. This is the pipeline behaving *correctly*, not a defect.

**Run 2** (`cmsd1o6l70006l104w8xoje0c`, has an image): full successful simulated dispatch — 3 requests recorded (image download, media upload, post creation), full request shape logged (URLs, header **names** only, JSON body preview), `success=true`. No credential value ever printed — only header key names (`Authorization`, `Content-Type`, ...).

**Bug found and fixed during this validation**: the WordPress Formatter's `slugify()` allowed the full Arabic Unicode block (U+0600–U+06FF), which includes punctuation like `؟`/`،`, producing slugs like `...-الحرجة؟`. Narrowed the allow-list to Arabic letters + digits only (U+0621–U+064A, U+0660–U+0669). Added two regression tests (`formatter.test.ts`). This is a genuine defect this dark-launch exercise caught before it could reach a real WordPress post.

The dark-launch script gracefully falls back to synthetic example data when `DistributionTarget` doesn't exist yet (current pre-migration state) or has no Sonara row — this fallback was itself exercised live, confirmed working as designed, not just written defensively.

---

## Environment Variables Required (Not Set Today)

For `scripts/setup-sonara-target.ts` to run at all:
```
SONARA_WORDPRESS_BASE_URL              (e.g. https://sonara.net)
SONARA_WORDPRESS_USERNAME
SONARA_WORDPRESS_APPLICATION_PASSWORD
SONARA_WORDPRESS_CATEGORY_ID           (e.g. 44945)
```
Optional: `SONARA_WORDPRESS_ENABLED` (default `false` — dark launch), `SONARA_WORDPRESS_AUTHOR_ID`, `SONARA_WORDPRESS_TIMEOUT_MS`.

None of these exist in `.env` today. This is the concrete reason "create a Sonara target with real credentials" and "enable automatic publishing" are both out of scope for this sprint's actual execution — the script exists, is tested, and will work the moment an operator supplies real values, but I did not fabricate placeholder credentials to exercise it end-to-end against a live site.
