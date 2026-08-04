# Distribution Engine — Foundation (Sprint 2)

Status: foundation only. No target is implemented, nothing publishes, nothing runs in production, and nothing about Telegram or Social changes. This document describes what exists in `lib/distribution/` after this sprint and what depends on it later.

Related design documents (Sprint 0/1, prior to this implementation): the Sonara-scoped Partner Publishing discovery, and the unified Distribution Engine architecture (three-phase rollout — Telegram stays on `SocialPost` until a future migration sprint; WordPress becomes the first real target in a future sprint, not this one).

---

## Why this exists

The approved architecture calls for one Distribution Engine — one Target model, one Job model, one Transport contract, one Formatter contract, one Audit shape — reused by every future publishing destination (WordPress first, then Ghost/Drupal/REST/RSS/email/etc.), instead of a bespoke integration per partner. This sprint builds only the shapes and contracts that make that reuse possible. It deliberately builds **nothing that does anything**: no networking, no persistence, no scheduling, no concrete WordPress/Telegram code. It is scaffolding a future sprint plugs real implementations into.

## What was NOT touched

`lib/social/*`, the `SocialAccount`/`SocialPost`/`SyndicationPost` Prisma models, `app/api/cron/social-queue/route.ts`, `lib/wordpress.ts`, and `lib/review-queue.ts`'s `approveReview()` are all byte-for-byte unchanged. `lib/distribution/` has no import from, and no import into, any of those. This is verified by the full existing test suite passing unmodified (see Validation below) and by `next build` succeeding with every existing route, including every admin/cron/social route, generating exactly as before.

---

## Module layout

```
lib/distribution/
  types.ts        — core data shapes (Target, Task, Status, Result, Error, Config)
  transport.ts     — Transport Adapter contract + empty registry
  formatter.ts      — Formatter contract + empty registry + DistributableContent
  audit.ts           — audit-entry shape + pure builder function
  validation.ts        — pure validators for Target/Config, category-filter matching
  factory.ts             — pure constructors for Target/Task, state-transition helper
  index.ts                 — the ONLY module other code should import from
  *.test.ts                 — one test file per module above (all passing)
```

Nothing outside `lib/distribution/` imports any of these files yet — this sprint adds no call sites. The barrel (`index.ts`) exists so that when a future sprint does start importing, there is already exactly one canonical entry point rather than reaching into internal files.

---

## Abstractions and responsibilities

### DistributionTarget (`types.ts`)
Identity + configuration of one destination ("Sonara", "Lumiq Telegram Channel", a future "CNN Arabic"). Fields: `id`, `name`, `targetType` (a free string discriminator, not a closed union — new platform types must be addable without editing shared code), `enabled`, `credentials` (opaque `Record<string, unknown>`, shape owned by each targetType's own Transport), `config` (`DistributionTargetConfig`). A `DistributionTarget` is pure data — it never sends anything itself.

### DistributionTargetConfig (`types.ts`)
Per-target policy: `mode` (`"automatic" | "manual"`), optional `categoryFilter` (string allow-list), and an `extra` escape hatch for settings a specific targetType's Formatter/Transport needs but the engine core has no opinion on (title templates, tag-mapping tables, etc.).

### DistributionTask (`types.ts`)
One unit of work: "this content should go to this Target." Field shape deliberately mirrors `SocialPost`'s already-production-proven retry bookkeeping (`status`, `attemptCount`, `nextAttemptAt`, `sendingAt`, `lastAttemptAt`, `externalId`, `remoteUrl`, `errorMsg`) so that a future migration sprint maps data, rather than redesigning the shape. `contentId` is a bare string — this foundation has no dependency on `Review` or any other content model.

### DistributionResult / DistributionError (`types.ts`)
`DistributionResult` is a discriminated union (`{success:true, externalId, remoteUrl?}` | `{success:false, error}`) — the return shape a future Transport's `publish()` produces. `DistributionError` mirrors `lib/social/retry.ts`'s proven `ProviderError` shape (`message`, `httpStatus?`, `retryAfterSeconds?`, `isNetworkError?`) exactly, so that module can be reused unmodified once a future sprint wires retry execution against it — no new classifier needs to be written.

### Transport (`transport.ts`)
Contract every platform-specific adapter implements: `targetType`, `publish(payload, target)`, optional `uploadMedia(imageUrl, target)`. A Transport never formats content and never touches persistence — it only knows how to authenticate and call one API. The module also exports an in-memory registry (`registerTransport`/`getTransport`), currently empty; registering a duplicate `targetType` throws rather than silently overwriting, so a double-import bug fails loudly during development instead of masking one adapter with another.

### Formatter (`formatter.ts`)
Contract every platform-specific content mapper implements: `targetType`, `format(content, config) → FormattedContent`. `DistributableContent` is the minimal, content-model-agnostic shape a Formatter reads from (`id`, `title`, `body`, `summary?`, `imageUrl?`, `canonicalUrl?`, `tags?`, `category?`) — mapping a real `Review` into this shape is explicitly future-sprint work, not built here. `FormattedContent` is intentionally opaque (`{kind, body: unknown}`) since different targets need fundamentally different payload shapes (HTML string, RSS XML, structured JSON) and the engine core must never need to inspect it. Same empty-registry pattern as Transport.

### Audit (`audit.ts`)
`DistributionAuditEntry` — the traceable record of one attempt (`taskId`, `targetId`, `contentId`, `status`, `attemptNumber`, `occurredAt`, `externalId?`, `remoteUrl?`, `errorMsg?`). `buildAuditEntry()` is a pure function deriving this from a `DistributionResult` — it writes nowhere; persistence is a future sprint's concern once a queue exists. Per the approved architecture, the long-term plan is for a `DistributionTask` row itself to double as the audit trail (matching `SocialPost`'s proven pattern today) — this shape is designed to make that a direct field copy, not a parallel model to keep in sync.

### Validation (`validation.ts`)
Pure, dependency-free guards: `validateTarget`/`validateTargetConfig` (structural checks, return `{valid, errors[]}` rather than throwing, so callers can decide how to surface multiple problems at once), `isTargetActive` (enabled AND structurally valid), `matchesCategoryFilter` (case-sensitive allow-list check, no filter = accept everything). Deliberately does not validate `credentials` contents — that shape is owned per-targetType by a Transport that doesn't exist yet.

### Factory (`factory.ts`)
`createDistributionTarget()` and `createDistributionTask()` — the one canonical, validated way to construct these objects, instead of every future call site hand-assembling object literals. `createDistributionTarget` defaults `enabled: false` (a new target must be explicitly turned on, never accidentally live) and throws on an invalid result rather than returning a partially-formed object. `withStatus()` is a pure, non-mutating state-transition helper; it does not enforce a state machine (which transitions are legal in which circumstances depends on retry/claim logic a future queue owns), matching the proven "sending → pending" stale-claim-recovery transition already used by `social-queue` today.

---

## Public API

Only `lib/distribution/index.ts`'s exports are supported for use outside this directory:

```ts
// Types
DistributionTargetType, DistributionStatus, DistributionTarget,
DistributionTargetConfig, DistributionTask, DistributionResult, DistributionError

// Transport
Transport, registerTransport(transport), getTransport(targetType)

// Formatter
Formatter, FormattedContent, DistributableContent,
registerFormatter(formatter), getFormatter(targetType)

// Audit
DistributionAuditEntry, buildAuditEntry(params)

// Validation
ValidationResult, validateTarget(target), validateTargetConfig(config),
isTargetActive(target), matchesCategoryFilter(config, category)

// Factories
CreateTargetInput, CreateTaskInput,
createDistributionTarget(input), createDistributionTask(input), withStatus(task, status, patch?)
```

Internal files (`types.ts`, `transport.ts`, `formatter.ts`, `audit.ts`, `validation.ts`, `factory.ts`) may be reorganized freely in future sprints as long as the barrel's exports keep their shape — nothing outside `lib/distribution/` should import them directly.

---

## Extension points for future sprints

- **A concrete Transport** (e.g. WordPress): implement the `Transport` interface in a new file, call `registerTransport()` once at module load. No change to this foundation required.
- **A concrete Formatter** (e.g. WordPress markdown→HTML): implement the `Formatter` interface, call `registerFormatter()` once. No change to this foundation required.
- **Real persistence**: a future sprint introduces the actual `DistributionTarget`/`DistributionTask` Prisma models (this sprint defines only their TypeScript shape) and a queue that reads/writes them, using `createDistributionTask`/`withStatus`/`buildAuditEntry` as the shape-construction layer rather than duplicating that logic inline.
- **Retry execution**: `DistributionError`'s shape is deliberately identical to `lib/social/retry.ts`'s `ProviderError` so that module's `classifyError`/`computeNextAttemptAt`/`isStaleSending` can be imported and reused unmodified by a future queue — no new retry logic should be written.
- **Content mapping**: adapting `Review` (or any other Lumiq content model) into `DistributableContent` is intentionally not built here — it is future-sprint work once a real Formatter needs it.

## What Sprint 3 (or whichever sprint implements the first real target) will need to add

1. `DistributionTarget`/`DistributionTask` Prisma models (schema + migration) — out of scope this sprint per explicit instruction.
2. A `Review → DistributableContent` mapping function.
3. One concrete Transport + Formatter pair (WordPress, per the approved rollout order) registered via the extension points above.
4. A queue/cron that creates tasks, claims them, calls the registered Transport/Formatter, and persists the result — reusing `lib/social/retry.ts` for classification/backoff, per the architecture's explicit "one retry engine" requirement.
5. The one new call site in `approveReview()` (per the approved three-phase plan, added without touching its existing `SocialPost` creation logic).

None of the above is implemented in this sprint.
