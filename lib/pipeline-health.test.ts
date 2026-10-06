import { describe, it, expect } from "vitest";
import { evaluatePipelineHealth, DEFAULT_THRESHOLDS, type PipelineSignals } from "./pipeline-health";

const NOW = new Date("2026-10-05T12:00:00Z");
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3_600_000);

const healthy: PipelineSignals = {
  now: NOW,
  lastPublishAt: hoursAgo(5),
  lastFetchAt: hoursAgo(6),
  stuckQueueCount: 0,
  failedQueueCountRecent: 0,
  publishedLast48h: 3,
};

const get = (r: ReturnType<typeof evaluatePipelineHealth>, id: string) => r.checks.find((c) => c.id === id)!;

describe("evaluatePipelineHealth", () => {
  it("reports healthy when everything is recent and clean", () => {
    const r = evaluatePipelineHealth(healthy);
    expect(r.healthy).toBe(true);
    expect(r.worst).toBe("ok");
  });

  it("flags critical when publishing stalls past the threshold (the silent-stop case)", () => {
    const r = evaluatePipelineHealth({ ...healthy, lastPublishAt: hoursAgo(48) });
    expect(r.healthy).toBe(false);
    expect(r.worst).toBe("critical");
    expect(get(r, "publish").severity).toBe("critical");
  });

  it("stays healthy right at the publish threshold", () => {
    const atLimit = evaluatePipelineHealth({ ...healthy, lastPublishAt: hoursAgo(DEFAULT_THRESHOLDS.maxHoursSincePublish) });
    expect(get(atLimit, "publish").severity).toBe("ok");
    const past = evaluatePipelineHealth({ ...healthy, lastPublishAt: hoursAgo(DEFAULT_THRESHOLDS.maxHoursSincePublish + 1) });
    expect(get(past, "publish").severity).toBe("critical");
  });

  it("flags critical when news fetch stalls", () => {
    const r = evaluatePipelineHealth({ ...healthy, lastFetchAt: hoursAgo(40) });
    expect(get(r, "fetch").severity).toBe("critical");
    expect(r.healthy).toBe(false);
  });

  it("treats never-published / never-fetched as critical", () => {
    const r = evaluatePipelineHealth({ ...healthy, lastPublishAt: null, lastFetchAt: null });
    expect(get(r, "publish").severity).toBe("critical");
    expect(get(r, "fetch").severity).toBe("critical");
  });

  it("warns (not critical) on stuck queue items", () => {
    const r = evaluatePipelineHealth({ ...healthy, stuckQueueCount: 4 });
    expect(r.worst).toBe("warn");
    expect(r.healthy).toBe(false);
    expect(get(r, "stuck").severity).toBe("warn");
  });

  it("warns on recent failures", () => {
    const r = evaluatePipelineHealth({ ...healthy, failedQueueCountRecent: 2 });
    expect(get(r, "failed").severity).toBe("warn");
    expect(r.worst).toBe("warn");
  });

  it("critical dominates warn in `worst`", () => {
    const r = evaluatePipelineHealth({ ...healthy, lastPublishAt: hoursAgo(72), stuckQueueCount: 1 });
    expect(r.worst).toBe("critical");
  });

  it("always returns all four checks", () => {
    expect(evaluatePipelineHealth(healthy).checks.map((c) => c.id).sort()).toEqual(["failed", "fetch", "publish", "stuck"]);
  });
});
