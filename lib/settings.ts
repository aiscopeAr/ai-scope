/**
 * lib/settings.ts
 * System settings stored in DB — editable from Admin Pipeline page.
 */

import { prisma } from "@/lib/db";

export const SETTING_KEYS = {
  DAILY_PUBLISH_LIMIT:            "pipeline.dailyPublishLimit",
  MAX_PER_RUN:                    "pipeline.maxPerRun",
  EDITORIAL_V2_MODE:              "pipeline.editorialV2Mode",
  EDITORIAL_V2_SHADOW_MAX_PER_RUN: "pipeline.editorialV2ShadowMaxPerRun",
  EDITORIAL_V2_ON_MAX_PER_RUN:     "pipeline.editorialV2OnMaxPerRun",
  EDITORIAL_V2_GATE_MODE:          "pipeline.editorialV2GateMode",
} as const;

/** How many items per process-review run may execute the V2 shadow planner.
 *  Independent of MAX_PER_RUN (which governs V1 throughput and is untouched). */
export const DEFAULT_EDITORIAL_V2_SHADOW_MAX_PER_RUN = 3;
const EDITORIAL_V2_SHADOW_MAX_CEILING = 25;

/** A3 canary cap: how many items per process-review run may be written via the
 *  plan-driven (mode="on") path. Deliberately tiny by default so the first live
 *  exposure of A3 is a single article/run. Independent of MAX_PER_RUN and of the
 *  shadow cap. */
export const DEFAULT_EDITORIAL_V2_ON_MAX_PER_RUN = 1;
const EDITORIAL_V2_ON_MAX_CEILING = 10;

// Editorial V2 rollout flag (string-valued, unlike the numeric pipeline
// settings). "off" = V1 only (default); "shadow" = run the planner and log
// diagnostics but publish V1 unchanged; "on" = reserved for A3 writer
// consumption (NOT implemented yet — treated as "shadow" with a warning).
export const EDITORIAL_V2_MODES = ["off", "shadow", "on"] as const;
export type EditorialV2Mode = (typeof EDITORIAL_V2_MODES)[number];

// A5-lite quality-gate rollout flag (string-valued). "off" (default) = gate
// never runs; "shadow" = gate runs and logs diagnostics but NEVER changes the
// ReviewQueue lifecycle; "enforce" is RESERVED (phase-2) and in phase 1 behaves
// as shadow (the route logs a notice) — it must never block content yet.
export const EDITORIAL_V2_GATE_MODES = ["off", "shadow", "enforce"] as const;
export type EditorialV2GateMode = (typeof EDITORIAL_V2_GATE_MODES)[number];

// Default values — used when no DB record exists
const DEFAULTS: Record<string, number> = {
  [SETTING_KEYS.DAILY_PUBLISH_LIMIT]: 10,
  [SETTING_KEYS.MAX_PER_RUN]:         10,
};

export async function getSetting(key: string): Promise<number> {
  try {
    const row = await prisma.systemSetting.findUnique({ where: { key } });
    if (row) return parseInt(row.value, 10) || DEFAULTS[key] || 0;
  } catch {}
  return DEFAULTS[key] ?? 0;
}

/**
 * Read the Editorial V2 rollout mode (string-valued). Defaults to "off" so
 * existing installations keep exact V1 behavior until an admin opts in. One
 * `systemSetting.findUnique` per call — process-review reads it once per run,
 * the same way it already reads MAX_PER_RUN (config read, not a per-item query).
 */
export async function getEditorialV2Mode(): Promise<EditorialV2Mode> {
  try {
    const row = await prisma.systemSetting.findUnique({ where: { key: SETTING_KEYS.EDITORIAL_V2_MODE } });
    const v = row?.value?.trim().toLowerCase();
    if (v === "shadow" || v === "on") return v;
  } catch {
    // fail closed to "off"
  }
  return "off";
}

/**
 * Shadow-sampling cap: how many items per run may run the V2 planner. Unlike
 * the numeric getSetting() (whose `parseInt(v) || DEFAULT` coerces a stored 0
 * back to its default), this HONORS an explicit 0 (= run the planner for zero
 * items even in shadow), and clamps to [0, 25]. One `systemSetting.findUnique`
 * per call — the caller reads it once per run and only when mode != off, so
 * the default off production path adds no read.
 */
export async function getEditorialV2ShadowMaxPerRun(): Promise<number> {
  try {
    const row = await prisma.systemSetting.findUnique({ where: { key: SETTING_KEYS.EDITORIAL_V2_SHADOW_MAX_PER_RUN } });
    if (row) {
      const n = parseInt(row.value, 10);
      if (Number.isFinite(n)) return Math.max(0, Math.min(n, EDITORIAL_V2_SHADOW_MAX_CEILING));
    }
  } catch {
    // fall through to default
  }
  return DEFAULT_EDITORIAL_V2_SHADOW_MAX_PER_RUN;
}

/**
 * A3 canary cap (mode="on"). Same robust pattern as getEditorialV2ShadowMaxPerRun:
 * HONORS an explicit stored 0, clamps to [0, 10], falls back to the default 1 on
 * a missing row, a non-numeric value, or a DB error. One `systemSetting.findUnique`
 * per call — the route reads it once per run and ONLY when mode === "on", so the
 * off/shadow production paths add no read. Not routed through getSetting(), whose
 * `parseInt || DEFAULT` would coerce a stored 0 back to the default.
 */
export async function getEditorialV2OnMaxPerRun(): Promise<number> {
  try {
    const row = await prisma.systemSetting.findUnique({ where: { key: SETTING_KEYS.EDITORIAL_V2_ON_MAX_PER_RUN } });
    if (row) {
      const n = parseInt(row.value, 10);
      if (Number.isFinite(n)) return Math.max(0, Math.min(n, EDITORIAL_V2_ON_MAX_CEILING));
    }
  } catch {
    // fall through to default
  }
  return DEFAULT_EDITORIAL_V2_ON_MAX_PER_RUN;
}

/**
 * Read the A5-lite quality-gate mode (string-valued). Defaults to "off" so the
 * gate never runs until an admin opts in. One `systemSetting.findUnique` per
 * call — the route reads it once per run. Unknown values fail safe to "off".
 * NOTE: "enforce" is accepted/parsed but phase 1 has no enforcement wired — the
 * route treats it as shadow (logs a notice); it must never block content yet.
 */
export async function getEditorialV2GateMode(): Promise<EditorialV2GateMode> {
  try {
    const row = await prisma.systemSetting.findUnique({ where: { key: SETTING_KEYS.EDITORIAL_V2_GATE_MODE } });
    const v = row?.value?.trim().toLowerCase();
    if (v === "shadow" || v === "enforce") return v;
  } catch {
    // fail closed to "off"
  }
  return "off";
}

export async function setSetting(key: string, value: number): Promise<void> {
  await prisma.systemSetting.upsert({
    where:  { key },
    create: { key, value: String(value) },
    update: { value: String(value) },
  });
}

export async function getAllPipelineSettings(): Promise<{
  dailyPublishLimit: number;
  maxPerRun: number;
}> {
  const rows = await prisma.systemSetting.findMany({
    where: { key: { in: Object.values(SETTING_KEYS) } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, parseInt(r.value, 10)]));
  return {
    dailyPublishLimit: map[SETTING_KEYS.DAILY_PUBLISH_LIMIT] ?? DEFAULTS[SETTING_KEYS.DAILY_PUBLISH_LIMIT],
    maxPerRun:         map[SETTING_KEYS.MAX_PER_RUN]         ?? DEFAULTS[SETTING_KEYS.MAX_PER_RUN],
  };
}
