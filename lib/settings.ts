/**
 * lib/settings.ts
 * System settings stored in DB — editable from Admin Pipeline page.
 */

import { prisma } from "@/lib/db";

export const SETTING_KEYS = {
  DAILY_PUBLISH_LIMIT: "pipeline.dailyPublishLimit",
  MAX_PER_RUN:         "pipeline.maxPerRun",
} as const;

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
