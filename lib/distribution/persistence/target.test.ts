import { describe, it, expect, vi, beforeEach } from "vitest";

const findMany = vi.fn();
const findUnique = vi.fn();
const findFirst = vi.fn();
const create = vi.fn();
const update = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    distributionTarget: {
      findMany: (...args: unknown[]) => findMany(...args),
      findUnique: (...args: unknown[]) => findUnique(...args),
      findFirst: (...args: unknown[]) => findFirst(...args),
      create: (...args: unknown[]) => create(...args),
      update: (...args: unknown[]) => update(...args),
    },
  },
}));

import { listTargetSummaries, listEnabledTargetsForDispatch, getTargetWithCredentials, upsertDistributionTarget } from "./target";

beforeEach(() => {
  vi.clearAllMocks();
});

const SECRET_PASSWORD = "super-secret-app-password-xyz";

describe("listTargetSummaries — credential redaction", () => {
  it("does not select the credentials column from Prisma at all", async () => {
    findMany.mockResolvedValue([]);
    await listTargetSummaries();

    const [{ select }] = findMany.mock.calls[0];
    expect(select).not.toHaveProperty("credentials");
  });

  it("returns summaries with no credentials field on the resulting objects", async () => {
    findMany.mockResolvedValue([
      { id: "t1", name: "Sonara", targetType: "wordpress", enabled: true, config: '{"mode":"automatic"}', createdAt: new Date(), updatedAt: new Date() },
    ]);

    const summaries = await listTargetSummaries();

    expect(summaries[0]).not.toHaveProperty("credentials");
    expect(JSON.stringify(summaries)).not.toContain(SECRET_PASSWORD);
  });

  it("parses the config JSON column into a typed object", async () => {
    findMany.mockResolvedValue([
      { id: "t1", name: "Sonara", targetType: "wordpress", enabled: true, config: '{"mode":"manual","categoryFilter":["ai-news"]}', createdAt: new Date(), updatedAt: new Date() },
    ]);

    const summaries = await listTargetSummaries();

    expect(summaries[0].config).toEqual({ mode: "manual", categoryFilter: ["ai-news"] });
  });
});

describe("listEnabledTargetsForDispatch", () => {
  it("filters to enabled targets of the given targetType", async () => {
    findMany.mockResolvedValue([]);
    await listEnabledTargetsForDispatch("wordpress");

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { targetType: "wordpress", enabled: true } }));
  });

  it("parses credentials JSON for the dispatch path", async () => {
    findMany.mockResolvedValue([
      { id: "t1", name: "Sonara", targetType: "wordpress", enabled: true, config: "{}", credentials: `{"username":"editor","applicationPassword":"${SECRET_PASSWORD}"}` },
    ]);

    const targets = await listEnabledTargetsForDispatch("wordpress");

    expect(targets[0].credentials).toEqual({ username: "editor", applicationPassword: SECRET_PASSWORD });
  });
});

describe("getTargetWithCredentials", () => {
  it("returns null when the target does not exist", async () => {
    findUnique.mockResolvedValue(null);
    expect(await getTargetWithCredentials("missing")).toBeNull();
  });

  it("returns null when the target exists but is disabled — never dispatches to a disabled target", async () => {
    findUnique.mockResolvedValue({ id: "t1", name: "Sonara", targetType: "wordpress", enabled: false, config: "{}", credentials: "{}" });
    expect(await getTargetWithCredentials("t1")).toBeNull();
  });

  it("returns the full target with parsed credentials when enabled", async () => {
    findUnique.mockResolvedValue({
      id: "t1",
      name: "Sonara",
      targetType: "wordpress",
      enabled: true,
      config: '{"mode":"automatic"}',
      credentials: `{"username":"editor","applicationPassword":"${SECRET_PASSWORD}"}`,
    });

    const target = await getTargetWithCredentials("t1");

    expect(target).not.toBeNull();
    expect(target!.credentials.applicationPassword).toBe(SECRET_PASSWORD);
  });
});

describe("upsertDistributionTarget", () => {
  it("creates a new row when none exists for the (name, targetType) pair", async () => {
    findFirst.mockResolvedValue(null);
    create.mockResolvedValue({ id: "new-target-id" });

    const result = await upsertDistributionTarget({
      name: "Sonara",
      targetType: "wordpress",
      enabled: false,
      config: { mode: "automatic" },
      credentials: { username: "editor", applicationPassword: SECRET_PASSWORD },
    });

    expect(result).toEqual({ id: "new-target-id", created: true });
    expect(update).not.toHaveBeenCalled();
  });

  it("updates the existing row instead of creating a duplicate when one already exists", async () => {
    findFirst.mockResolvedValue({ id: "existing-id" });
    update.mockResolvedValue({});

    const result = await upsertDistributionTarget({
      name: "Sonara",
      targetType: "wordpress",
      enabled: true,
      config: { mode: "automatic" },
      credentials: { username: "editor", applicationPassword: SECRET_PASSWORD },
    });

    expect(result).toEqual({ id: "existing-id", created: false });
    expect(create).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "existing-id" } }));
  });

  it("is idempotent — calling it twice with the same name+targetType never creates two rows", async () => {
    findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: "created-id" });
    create.mockResolvedValue({ id: "created-id" });
    update.mockResolvedValue({});

    const first = await upsertDistributionTarget({ name: "Sonara", targetType: "wordpress", enabled: false, config: { mode: "automatic" }, credentials: {} });
    const second = await upsertDistributionTarget({ name: "Sonara", targetType: "wordpress", enabled: false, config: { mode: "automatic" }, credentials: {} });

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("serializes credentials as JSON text, never as a nested object literal", async () => {
    findFirst.mockResolvedValue(null);
    create.mockResolvedValue({ id: "t1" });

    await upsertDistributionTarget({
      name: "Sonara",
      targetType: "wordpress",
      enabled: false,
      config: { mode: "automatic" },
      credentials: { username: "editor", applicationPassword: SECRET_PASSWORD },
    });

    const [{ data }] = create.mock.calls[0];
    expect(typeof data.credentials).toBe("string");
    expect(JSON.parse(data.credentials)).toEqual({ username: "editor", applicationPassword: SECRET_PASSWORD });
  });
});
