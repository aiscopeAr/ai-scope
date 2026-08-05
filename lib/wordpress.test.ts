import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockFindUnique = vi.fn();
const mockFindUniqueOrThrow = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    syndicationPost: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
    review: {
      findUniqueOrThrow: (...args: unknown[]) => mockFindUniqueOrThrow(...args),
    },
  },
}));

import { syndicateReviewToWordPress } from "./wordpress";

const originalEnv = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("syndicateReviewToWordPress — Sprint 6 legacy kill-switch", () => {
  it("is a no-op even when WORDPRESS_* env vars are fully configured — the legacy path is retired regardless of environment state", async () => {
    process.env.WORDPRESS_SITE_URL = "https://sonara.net";
    process.env.WORDPRESS_USERNAME = "editor";
    process.env.WORDPRESS_APP_PASSWORD = "some-app-password";
    process.env.WORDPRESS_CATEGORY_ID = "44945";

    const realFetch = globalThis.fetch;
    const fetchSpy = vi.fn(realFetch);
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    try {
      await syndicateReviewToWordPress("review-1");

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(mockFindUnique).not.toHaveBeenCalled();
      expect(mockFindUniqueOrThrow).not.toHaveBeenCalled();
      expect(mockCreate).not.toHaveBeenCalled();
      expect(mockUpdate).not.toHaveBeenCalled();
    } finally {
      globalThis.fetch = realFetch;
    }
  });

  it("is a no-op when WORDPRESS_* env vars are absent (the pre-Sprint-6 behavior, still holds)", async () => {
    delete process.env.WORDPRESS_SITE_URL;
    delete process.env.WORDPRESS_USERNAME;
    delete process.env.WORDPRESS_APP_PASSWORD;
    delete process.env.WORDPRESS_CATEGORY_ID;

    await expect(syndicateReviewToWordPress("review-1")).resolves.toBeUndefined();
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it("never throws, regardless of environment configuration — approveReview()'s best-effort .catch() is never exercised by this path anymore", async () => {
    process.env.WORDPRESS_SITE_URL = "https://sonara.net";
    process.env.WORDPRESS_USERNAME = "editor";
    process.env.WORDPRESS_APP_PASSWORD = "some-app-password";
    process.env.WORDPRESS_CATEGORY_ID = "44945";

    await expect(syndicateReviewToWordPress("any-review-id")).resolves.not.toThrow();
  });
});
