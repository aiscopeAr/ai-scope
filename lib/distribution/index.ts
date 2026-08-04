/**
 * lib/distribution/index.ts
 *
 * Public API of the Distribution Engine foundation. This is the ONLY
 * module future sprints (and future targets) should import from — internal
 * files (types.ts, transport.ts, formatter.ts, audit.ts, validation.ts,
 * factory.ts) are implementation detail and may be reorganized freely as
 * long as this barrel's exports keep their shape.
 *
 * This foundation intentionally exports no concrete Transport, Formatter,
 * or Target — the registries below start empty. Populating them with real
 * WordPress/Telegram/Ghost implementations is out of scope for this sprint.
 */

// Core data shapes
export type {
  DistributionTargetType,
  DistributionStatus,
  DistributionTarget,
  DistributionTargetConfig,
  DistributionTask,
  DistributionResult,
  DistributionError,
} from "./types";

// Transport Adapter contract + registry
export type { Transport } from "./transport";
export { registerTransport, getTransport } from "./transport";

// Formatter contract + registry
export type { Formatter, FormattedContent, DistributableContent } from "./formatter";
export { registerFormatter, getFormatter } from "./formatter";

// Audit
export type { DistributionAuditEntry } from "./audit";
export { buildAuditEntry } from "./audit";

// Validation
export type { ValidationResult } from "./validation";
export { validateTarget, validateTargetConfig, isTargetActive, matchesCategoryFilter } from "./validation";

// Factories
export type { CreateTargetInput, CreateTaskInput } from "./factory";
export { createDistributionTarget, createDistributionTask, withStatus } from "./factory";
