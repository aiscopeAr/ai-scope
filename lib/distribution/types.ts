/**
 * lib/distribution/types.ts
 *
 * Core shared types for the Distribution Engine — the platform-agnostic
 * shapes every future target (WordPress, Telegram, Ghost, RSS, ...) is
 * expected to conform to. Nothing in this file knows about any specific
 * platform; platform-specific work lives in each target's own Transport
 * Adapter and Formatter, added in a later sprint.
 *
 * This module has no dependency on lib/social/* and is not imported by it —
 * the two systems are intentionally independent until a future migration
 * sprint (see docs/distribution-engine-foundation.md).
 */

/** Free-form discriminator identifying which Transport + Formatter pair a
 *  Distribution Target uses. Deliberately a plain string, not a closed
 *  union — new platform types must be addable by registering an adapter,
 *  not by editing this type, or every future target would require a change
 *  to shared code. */
export type DistributionTargetType = string;

/** Lifecycle states of a single DistributionTask, mirroring the terminology
 *  already proven in production by SocialPost's status field. */
export type DistributionStatus =
  | "pending"
  | "sending"
  | "published"
  | "failed"
  | "skipped";

/** Identity and configuration of one destination the Distribution Engine
 *  can publish to. This is a plain data shape — it does not know how to
 *  send anything itself; a Transport Adapter looks it up by `targetType`. */
export interface DistributionTarget {
  id: string;
  /** Human-readable label shown in admin UI, e.g. "Sonara" or "Lumiq Telegram Channel". */
  name: string;
  targetType: DistributionTargetType;
  enabled: boolean;
  /** Secret material (API keys, tokens, passwords). Shape is defined per
   *  targetType by that target's Transport Adapter — this module does not
   *  interpret it. */
  credentials: Record<string, unknown>;
  /** Non-secret target-specific settings — category mappings, title
   *  templates, footer copy, etc. Shape is defined per targetType. */
  config: DistributionTargetConfig;
}

/** Per-target policy: which content qualifies and how dispatch is gated.
 *  Deliberately generic — a target's Formatter/Transport may read
 *  additional keys from here, but the engine core only depends on the
 *  fields declared below. */
export interface DistributionTargetConfig {
  /** "automatic" = a DistributionTask is created without human review;
   *  "manual" = a task is created but requires explicit approval before
   *  the queue may claim it. Manual approval itself is out of scope for
   *  this foundation sprint — see docs/distribution-engine-foundation.md. */
  mode: "automatic" | "manual";
  /** Optional allow-list of content categories this target accepts. An
   *  empty/undefined list means "no filter — accept everything". */
  categoryFilter?: string[];
  /** Escape hatch for target-specific settings not modeled generically
   *  (title templates, tag-mapping tables, canonical-link footer copy,
   *  etc.) — read only by that target's own Formatter/Transport. */
  extra?: Record<string, unknown>;
}

/** One unit of work: "this piece of content should go to this Target."
 *  Field shape intentionally mirrors SocialPost's proven retry bookkeeping
 *  so that a future migration (see roadmap) is a data mapping, not a
 *  redesign. This foundation sprint defines the shape only — nothing
 *  creates, claims, or mutates DistributionTask rows yet. */
export interface DistributionTask {
  id: string;
  targetId: string;
  /** Identifier of the content being distributed. Deliberately untyped
   *  beyond `string` — the engine core has no knowledge of Review or any
   *  other content model; that mapping is a future sprint's concern. */
  contentId: string;
  status: DistributionStatus;
  attemptCount: number;
  /** Set when a transient failure schedules a retry; null/undefined means
   *  "no retry pending" (either never failed, or terminally failed). */
  nextAttemptAt?: Date;
  /** Set while a worker holds the claim, used for stale-claim recovery. */
  sendingAt?: Date;
  lastAttemptAt?: Date;
  /** Reference returned by the target once published (e.g. a WordPress
   *  post ID, a Telegram message ID). */
  externalId?: string;
  /** Public URL of the published content on the target, when available. */
  remoteUrl?: string;
  errorMsg?: string;
  createdAt: Date;
}

/** Outcome of one dispatch attempt, returned by a Transport Adapter's
 *  `publish()` call. Not persisted directly — the engine core maps this
 *  onto a DistributionTask's fields. */
export type DistributionResult =
  | { success: true; externalId: string; remoteUrl?: string }
  | { success: false; error: DistributionError };

/** Structured failure shape a Transport Adapter throws or returns, giving
 *  the (future) retry engine real signal instead of parsed message
 *  strings — mirrors the proven shape of lib/social/retry.ts's
 *  ProviderError exactly, so that module can be reused unmodified when a
 *  later sprint wires retry execution in. */
export interface DistributionError {
  message: string;
  httpStatus?: number;
  retryAfterSeconds?: number;
  isNetworkError?: boolean;
}
