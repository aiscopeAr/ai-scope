/**
 * lib/settings.ts
 * System settings stored in DB — editable from Admin Pipeline page.
 */

import { prisma } from "@/lib/db";

export const SETTING_KEYS = {
  DAILY_PUBLISH_LIMIT: "pipeline.dailyPublishLimit",
  MAX_PER_RUN:         "pipeline.maxPerRun",
  EDITORIAL_V2_MODE:   "pipeline.editorialV2Mode",
} as const;

// Editorial V2 rollout flag (string-valued, unlike the numeric pipeline
// settings). "off" = V1 only (default); "shadow" = run the planner and log
// diagnostics but publish V1 unchanged; "on" = reserved for A3 writer
// consumption (NOT implemented yet — treated as "shadow" with a warning).
export const EDITORIAL_V2_MODES = ["off", "shadow", "on"] as const;
export type EditorialV2Mode = (typeof EDITORIAL_V2_MODES)[number];

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
