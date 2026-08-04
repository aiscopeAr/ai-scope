/**
 * lib/distribution/persistence/target.ts
 *
 * Prisma-backed access to DistributionTarget rows. This is the only module
 * in the Distribution Engine allowed to touch the DistributionTarget table
 * directly — everything else (resolution, task creation, the queue) goes
 * through the functions here so "never expose credentials in an ordinary
 * read" has exactly one place to get right.
 *
 * `listActiveTargets` and `getTargetSummaries` deliberately use a `select`
 * that omits `credentials` — the DistributionTarget shape callers get back
 * in those paths has no credentials field at all, not a redacted one, so
 * there is no risk of a future refactor accidentally serializing it.
 * `getTargetWithCredentials` is the sole, explicitly-named function that
 * returns credentials, reserved for the Transport dispatch path inside the
 * queue — never called from an admin-facing route.
 */

import { prisma } from "@/lib/db";
import type { DistributionTarget as EngineDistributionTarget, DistributionTargetConfig } from "../types";

/** Parses the DB's JSON-as-text `config` column into the engine's typed
 *  shape. Throws on malformed JSON rather than silently defaulting — a
 *  corrupt config row must surface loudly, not resolve to "no filter". */
function parseConfig(configText: string): DistributionTargetConfig {
  return JSON.parse(configText) as DistributionTargetConfig;
}

function parseCredentials(credentialsText: string): Record<string, unknown> {
  return JSON.parse(credentialsText) as Record<string, unknown>;
}

/** Read-only summary shape for admin/diagnostic surfaces — no credentials
 *  field exists on this type at all. */
export interface DistributionTargetSummary {
  id: string;
  name: string;
  targetType: string;
  enabled: boolean;
  config: DistributionTargetConfig;
  createdAt: Date;
  updatedAt: Date;
}

/** Lists every DistributionTarget for admin/diagnostic display. Never
 *  selects the `credentials` column. */
export async function listTargetSummaries(): Promise<DistributionTargetSummary[]> {
  const rows = await prisma.distributionTarget.findMany({
    select: { id: true, name: true, targetType: true, enabled: true, config: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    targetType: row.targetType,
    enabled: row.enabled,
    config: parseConfig(row.config),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

/** Lists enabled targets of a given targetType, WITH credentials — for the
 *  queue's dispatch path only. Never call this from an admin-facing route. */
export async function listEnabledTargetsForDispatch(targetType: string): Promise<EngineDistributionTarget[]> {
  const rows = await prisma.distributionTarget.findMany({
    where: { targetType, enabled: true },
    select: { id: true, name: true, targetType: true, enabled: true, config: true, credentials: true },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    targetType: row.targetType,
    enabled: row.enabled,
    config: parseConfig(row.config),
    credentials: parseCredentials(row.credentials),
  }));
}

/** Fetches a single target WITH credentials, by id — for the queue's
 *  dispatch path only. Returns null if not found or disabled (a disabled
 *  target must never be dispatched to, even if a stale DistributionTask
 *  still references it). */
export async function getTargetWithCredentials(targetId: string): Promise<EngineDistributionTarget | null> {
  const row = await prisma.distributionTarget.findUnique({
    where: { id: targetId },
    select: { id: true, name: true, targetType: true, enabled: true, config: true, credentials: true },
  });

  if (!row || !row.enabled) return null;

  return {
    id: row.id,
    name: row.name,
    targetType: row.targetType,
    enabled: row.enabled,
    config: parseConfig(row.config),
    credentials: parseCredentials(row.credentials),
  };
}

export interface UpsertTargetInput {
  name: string;
  targetType: string;
  enabled: boolean;
  config: DistributionTargetConfig;
  credentials: Record<string, unknown>;
}

/** Creates a DistributionTarget row identified by `name` + `targetType` if
 *  none exists, or updates the existing one's config/credentials/enabled
 *  state if it does. Used by setup scripts (see wordpress/setup-sonara.ts)
 *  so re-running a setup script is always safe — never creates a
 *  duplicate row for the same partner. */
export async function upsertDistributionTarget(input: UpsertTargetInput): Promise<{ id: string; created: boolean }> {
  const existing = await prisma.distributionTarget.findFirst({
    where: { name: input.name, targetType: input.targetType },
    select: { id: true },
  });

  if (existing) {
    await prisma.distributionTarget.update({
      where: { id: existing.id },
      data: {
        enabled: input.enabled,
        config: JSON.stringify(input.config),
        credentials: JSON.stringify(input.credentials),
      },
    });
    return { id: existing.id, created: false };
  }

  const created = await prisma.distributionTarget.create({
    data: {
      name: input.name,
      targetType: input.targetType,
      enabled: input.enabled,
      config: JSON.stringify(input.config),
      credentials: JSON.stringify(input.credentials),
    },
    select: { id: true },
  });

  return { id: created.id, created: true };
}
