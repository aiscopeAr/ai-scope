/**
 * lib/distribution/validation.ts
 *
 * Pure validation helpers for the Distribution Engine's core shapes.
 * No I/O, no database access — these guard the boundary between whatever
 * calls into the engine (a future admin UI, a future cron) and the engine
 * itself, the same role Zod schemas play at Lumiq's other admin boundaries,
 * kept dependency-free here since the foundation has no framework to
 * validate against yet.
 */

import type { DistributionTarget, DistributionTargetConfig } from "./types";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function ok(): ValidationResult {
  return { valid: true, errors: [] };
}

function fail(...errors: string[]): ValidationResult {
  return { valid: false, errors };
}

/** Validates a DistributionTargetConfig in isolation — used both when
 *  validating a full Target and independently when a future admin UI
 *  wants to validate config edits before saving. */
export function validateTargetConfig(config: DistributionTargetConfig): ValidationResult {
  const errors: string[] = [];

  if (config.mode !== "automatic" && config.mode !== "manual") {
    errors.push(`config.mode must be "automatic" or "manual", got "${String(config.mode)}"`);
  }

  if (config.categoryFilter !== undefined) {
    if (!Array.isArray(config.categoryFilter)) {
      errors.push("config.categoryFilter must be an array when present");
    } else if (config.categoryFilter.some((c) => typeof c !== "string" || c.trim() === "")) {
      errors.push("config.categoryFilter must contain only non-empty strings");
    }
  }

  return errors.length === 0 ? ok() : fail(...errors);
}

/** Validates a DistributionTarget's structural integrity — required
 *  fields present and well-formed. Deliberately does NOT validate
 *  `credentials` contents, since their required shape is defined per
 *  targetType by that target's own Transport Adapter, which does not
 *  exist yet in this foundation sprint. */
export function validateTarget(target: DistributionTarget): ValidationResult {
  const errors: string[] = [];

  if (!target.id || target.id.trim() === "") errors.push("id is required");
  if (!target.name || target.name.trim() === "") errors.push("name is required");
  if (!target.targetType || target.targetType.trim() === "") errors.push("targetType is required");
  if (typeof target.enabled !== "boolean") errors.push("enabled must be a boolean");
  if (target.credentials === null || typeof target.credentials !== "object") {
    errors.push("credentials must be an object");
  }

  const configResult = validateTargetConfig(target.config);
  if (!configResult.valid) errors.push(...configResult.errors);

  return errors.length === 0 ? ok() : fail(...errors);
}

/** Returns true if a DistributionTarget is currently eligible to receive
 *  new tasks — enabled, and (for automatic mode) not otherwise gated.
 *  Manual-mode targets are still "eligible" in the sense this function
 *  checks; the distinction between automatic and manual dispatch gating
 *  is a future queue's concern, not a validity concept. */
export function isTargetActive(target: DistributionTarget): boolean {
  return target.enabled && validateTarget(target).valid;
}

/** Returns true if `category` passes a target's categoryFilter (or the
 *  target has no filter, meaning it accepts every category). Pure,
 *  case-sensitive-by-design string matching — callers needing
 *  case-insensitive or slug-normalized matching should normalize their
 *  inputs before calling this, since the engine core has no opinion on a
 *  content model's category-naming convention. */
export function matchesCategoryFilter(config: DistributionTargetConfig, category: string | undefined): boolean {
  if (!config.categoryFilter || config.categoryFilter.length === 0) return true;
  if (!category) return false;
  return config.categoryFilter.includes(category);
}
