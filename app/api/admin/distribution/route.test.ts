import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAuth = vi.fn();
const mockListTargetSummaries = vi.fn();
const mockGetTaskCountsByTarget = vi.fn();
const mockGetLastOutcomes = vi.fn();

vi.mock("@/lib/auth", () => ({ auth: (...args: unknown[]) => mockAuth(...args) }));
vi.mock("@/lib/distribution/persistence/target", () => ({ listTargetSummaries: (...args: unknown[]) => mockListTargetSummaries(...args) }));
vi.mock("@/lib/distribution/persistence/task", () => ({
  getTaskCountsByTarget: (...args: unknown[]) => mockGetTaskCountsByTarget(...args),
  getLastOutcomes: (...args: unknown[]) => mockGetLastOutcomes(...args),
}));

import { GET } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/admin/distribution — auth gate", () => {
  it("returns 401 when there is no session", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
    expect(mockListTargetSummaries).not.toHaveBeenCalled();
  });

  it("returns 401 when the session user is not an admin", async () => {
    mockAuth.mockResolvedValue({ user: { role: "editor" } });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("proceeds when the session user has the admin role", async () => {
    mockAuth.mockResolvedValue({ user: { role: "admin" } });
    mockListTargetSummaries.mockResolvedValue([]);
    const res = await GET();
    expect(res.status).toBe(200);
  });
});

describe("GET /api/admin/distribution — response shape", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { role: "admin" } });
  });

  it("returns an empty targets array when no targets exist", async () => {
    mockListTargetSummaries.mockResolvedValue([]);
    const res = await GET();
    const body = await res.json();
    expect(body).toEqual({ targets: [] });
  });

  it("aggregates counts and outcomes per target", async () => {
    mockListTargetSummaries.mockResolvedValue([
      { id: "t1", name: "Sonara", targetType: "wordpress", enabled: true, config: { mode: "automatic" }, createdAt: new Date(), updatedAt: new Date() },
    ]);
    mockGetTaskCountsByTarget.mockResolvedValue({ pending: 2, sending: 1, published: 5, failed: 3, skipped: 0 });
    mockGetLastOutcomes.mockResolvedValue({ lastSuccessAt: new Date("2026-01-01T00:00:00Z"), lastFailureAt: new Date("2026-01-02T00:00:00Z") });

    const res = await GET();
    const body = await res.json();

    expect(body.targets[0]).toEqual({
      id: "t1",
      name: "Sonara",
      targetType: "wordpress",
      enabled: true,
      pendingTasks: 3, // pending + sending
      sentTasks: 5,
      failedTasks: 3,
      lastSuccessAt: "2026-01-01T00:00:00.000Z",
      lastFailureAt: "2026-01-02T00:00:00.000Z",
    });
  });

  it("never returns a credentials field anywhere in the response", async () => {
    mockListTargetSummaries.mockResolvedValue([
      { id: "t1", name: "Sonara", targetType: "wordpress", enabled: true, config: { mode: "automatic" }, createdAt: new Date(), updatedAt: new Date() },
    ]);
    mockGetTaskCountsByTarget.mockResolvedValue({ pending: 0, sending: 0, published: 0, failed: 0, skipped: 0 });
    mockGetLastOutcomes.mockResolvedValue({ lastSuccessAt: null, lastFailureAt: null });

    const res = await GET();
    const bodyText = JSON.stringify(await res.json());

    expect(bodyText).not.toContain("credentials");
    expect(bodyText).not.toContain("applicationPassword");
  });

  it("reports null timestamps for a target with no send history yet", async () => {
    mockListTargetSummaries.mockResolvedValue([
      { id: "t1", name: "Sonara", targetType: "wordpress", enabled: false, config: { mode: "automatic" }, createdAt: new Date(), updatedAt: new Date() },
    ]);
    mockGetTaskCountsByTarget.mockResolvedValue({ pending: 0, sending: 0, published: 0, failed: 0, skipped: 0 });
    mockGetLastOutcomes.mockResolvedValue({ lastSuccessAt: null, lastFailureAt: null });

    const res = await GET();
    const body = await res.json();

    expect(body.targets[0].lastSuccessAt).toBeNull();
    expect(body.targets[0].lastFailureAt).toBeNull();
    expect(body.targets[0].enabled).toBe(false);
  });
});
