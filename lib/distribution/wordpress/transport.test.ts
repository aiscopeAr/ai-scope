import { describe, it, expect, vi } from "vitest";
import { createWordPressTransport, WORDPRESS_TARGET_TYPE } from "./transport";
import type { WordPressFormattedContent } from "./formatter";
import type { DistributionTarget } from "../types";

/**
 * Every test in this file constructs its own mock `fetch` and injects it
 * via `createWordPressTransport({ fetchImpl })`. No test in this file (or
 * anywhere in this sprint) calls the real global `fetch`, and no test
 * targets Sonara or any real hostname — `mockTarget()` below points at an
 * obviously fake example.com host purely as a config value that is never
 * actually dialed.
 */

function mockTarget(overrides: Partial<DistributionTarget> = {}): DistributionTarget {
  return {
    id: "target-1",
    name: "Test WordPress Site",
    targetType: WORDPRESS_TARGET_TYPE,
    enabled: true,
    credentials: { username: "editor", applicationPassword: "abcd 1234 efgh 5678" },
    config: {
      mode: "automatic",
      extra: {
        baseUrl: "https://example.invalid",
        categoryIds: [12],
        defaultStatus: "publish",
        uploadFeaturedImage: false,
      },
    },
    ...overrides,
  };
}

function mockFormattedContent(overrides: Partial<WordPressFormattedContent["body"]> = {}): WordPressFormattedContent {
  return {
    kind: "wordpress-post",
    body: {
      title: "Test Title",
      contentHtml: "<p>Body</p>",
      excerpt: "Excerpt",
      slug: "test-title",
      sourceUrl: "https://www.lumiq.news/reviews/test-title",
      categoryIds: [12],
      status: "publish",
      ...overrides,
    },
  };
}

function jsonResponse(body: unknown, init: { status?: number; headers?: Record<string, string> } = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "content-type": "application/json", ...init.headers },
  });
}

describe("WordPress Transport — Basic Auth header", () => {
  it("sends a correctly base64-encoded Basic Auth header without leaking the raw password", async () => {
    let capturedAuth: string | null = null;
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      capturedAuth = (init?.headers as Record<string, string>)?.Authorization ?? null;
      return jsonResponse({ id: 1, link: "https://example.invalid/?p=1" });
    });

    const transport = createWordPressTransport({ fetchImpl: fetchImpl as unknown as typeof fetch });
    await transport.publish(mockFormattedContent(), mockTarget());

    expect(capturedAuth).toMatch(/^Basic [A-Za-z0-9+/=]+$/);
    expect(capturedAuth).not.toContain("editor");
    expect(capturedAuth).not.toContain("abcd 1234 efgh 5678");

    const decoded = Buffer.from(capturedAuth!.replace("Basic ", ""), "base64").toString("utf-8");
    expect(decoded).toBe("editor:abcd 1234 efgh 5678");
  });

  it("never includes credentials in a thrown/returned error message", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ message: "invalid" }, { status: 401 }));
    const transport = createWordPressTransport({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const result = await transport.publish(mockFormattedContent(), mockTarget());

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).not.toContain("editor");
      expect(result.error.message).not.toContain("abcd 1234 efgh 5678");
    }
  });
});

describe("WordPress Transport — successful post creation", () => {
  it("returns a normalized success DistributionResult", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ id: 42, link: "https://example.invalid/?p=42" }));
    const transport = createWordPressTransport({ fetchImpl: fetchImpl as unknown as typeof fetch });

    const result = await transport.publish(mockFormattedContent(), mockTarget());

    expect(result).toEqual({ success: true, externalId: "42", remoteUrl: "https://example.invalid/?p=42" });
  });

  it("sends title, content, excerpt, slug, status, and categories in the post body", async () => {
    let capturedBody: Record<string, unknown> | null = null;
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      capturedBody = JSON.parse(init!.body as string);
      return jsonResponse({ id: 1, link: "https://example.invalid/?p=1" });
    });

    const transport = createWordPressTransport({ fetchImpl: fetchImpl as unknown as typeof fetch });
    await transport.publish(mockFormattedContent({ title: "Custom Title", status: "draft", categoryIds: [7, 8] }), mockTarget());

    expect(capturedBody).toMatchObject({
      title: "Custom Title",
      content: "<p>Body</p>",
      excerpt: "Excerpt",
      slug: "test-title",
      status: "draft",
      categories: [7, 8],
    });
  });

  it("includes author when authorId is configured", async () => {
    let capturedBody: Record<string, unknown> | null = null;
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      capturedBody = JSON.parse(init!.body as string);
      return jsonResponse({ id: 1, link: "https://example.invalid/?p=1" });
    });

    const transport = createWordPressTransport({ fetchImpl: fetchImpl as unknown as typeof fetch });
    await transport.publish(mockFormattedContent({ authorId: 9 }), mockTarget());

    expect(capturedBody).toMatchObject({ author: 9 });
  });

  it("omits author when not configured", async () => {
    let capturedBody: Record<string, unknown> | null = null;
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      capturedBody = JSON.parse(init!.body as string);
      return jsonResponse({ id: 1, link: "https://example.invalid/?p=1" });
    });

    const transport = createWordPressTransport({ fetchImpl: fetchImpl as unknown as typeof fetch });
    await transport.publish(mockFormattedContent(), mockTarget());

    expect(capturedBody).not.toHaveProperty("author");
  });
});

describe("WordPress Transport — featured image", () => {
  it("uploads media and assigns featured_media when uploadFeaturedImage is enabled", async () => {
    const calls: string[] = [];
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      calls.push(url);
      if (url === "https://cdn.example.invalid/image.webp") {
        return new Response(new Uint8Array([1, 2, 3, 4]), {
          status: 200,
          headers: { "content-type": "image/webp", "content-length": "4" },
        });
      }
      if (url.endsWith("/wp-json/wp/v2/media")) {
        return jsonResponse({ id: 555, source_url: "https://example.invalid/wp-content/uploads/image.webp" });
      }
      if (url.endsWith("/wp-json/wp/v2/posts")) {
        const body = JSON.parse(init!.body as string);
        expect(body.featured_media).toBe(555);
        return jsonResponse({ id: 1, link: "https://example.invalid/?p=1" });
      }
      throw new Error(`unexpected URL in test: ${url}`);
    });

    const transport = createWordPressTransport({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const target = mockTarget({
      config: {
        mode: "automatic",
        extra: { baseUrl: "https://example.invalid", categoryIds: [12], defaultStatus: "publish", uploadFeaturedImage: true },
      },
    });

    const result = await transport.publish(mockFormattedContent({ imageUrl: "https://cdn.example.invalid/image.webp" }), target);

    expect(result.success).toBe(true);
    expect(calls).toContain("https://cdn.example.invalid/image.webp");
    expect(calls.some((u) => u.endsWith("/wp-json/wp/v2/media"))).toBe(true);
  });

  it("skips media upload entirely when uploadFeaturedImage is false, even if an imageUrl is present", async () => {
    const calls: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      calls.push(url);
      return jsonResponse({ id: 1, link: "https://example.invalid/?p=1" });
    });

    const transport = createWordPressTransport({ fetchImpl: fetchImpl as unknown as typeof fetch });
    await transport.publish(mockFormattedContent({ imageUrl: "https://cdn.example.invalid/image.webp" }), mockTarget());

    expect(calls.some((u) => u.includes("cdn.example.invalid"))).toBe(false);
    expect(calls.some((u) => u.endsWith("/wp-json/wp/v2/media"))).toBe(false);
  });

  it("fails the whole publish when uploadFeaturedImage is enabled but imageUrl is missing", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ id: 1, link: "https://example.invalid/?p=1" }));
    const transport = createWordPressTransport({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const target = mockTarget({
      config: { mode: "automatic", extra: { baseUrl: "https://example.invalid", categoryIds: [12], defaultStatus: "publish", uploadFeaturedImage: true } },
    });

    const result = await transport.publish(mockFormattedContent({ imageUrl: undefined }), target);

    expect(result.success).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects an unsupported image MIME type and does not create the post", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url === "https://cdn.example.invalid/image.svg") {
        return new Response("<svg/>", { status: 200, headers: { "content-type": "image/svg+xml", "content-length": "10" } });
      }
      throw new Error("post creation must not be reached");
    });

    const transport = createWordPressTransport({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const target = mockTarget({
      config: { mode: "automatic", extra: { baseUrl: "https://example.invalid", categoryIds: [12], defaultStatus: "publish", uploadFeaturedImage: true } },
    });

    const result = await transport.publish(mockFormattedContent({ imageUrl: "https://cdn.example.invalid/image.svg" }), target);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toMatch(/unsupported/i);
  });

  it("rejects an oversized image and does not create the post", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url === "https://cdn.example.invalid/image.webp") {
        return new Response(new Uint8Array(10), {
          status: 200,
          headers: { "content-type": "image/webp", "content-length": String(999_999_999) },
        });
      }
      throw new Error("post creation must not be reached");
    });

    const transport = createWordPressTransport({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const target = mockTarget({
      config: { mode: "automatic", extra: { baseUrl: "https://example.invalid", categoryIds: [12], defaultStatus: "publish", uploadFeaturedImage: true } },
    });

    const result = await transport.publish(mockFormattedContent({ imageUrl: "https://cdn.example.invalid/image.webp" }), target);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toMatch(/maximum size/i);
  });

  it("does not silently publish an incomplete post when image upload fails", async () => {
    let postCreationAttempted = false;
    const fetchImpl = vi.fn(async (url: string) => {
      if (url === "https://cdn.example.invalid/image.webp") {
        return new Response("not found", { status: 404 });
      }
      if (url.endsWith("/wp-json/wp/v2/posts")) {
        postCreationAttempted = true;
        return jsonResponse({ id: 1, link: "https://example.invalid/?p=1" });
      }
      throw new Error(`unexpected URL: ${url}`);
    });

    const transport = createWordPressTransport({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const target = mockTarget({
      config: { mode: "automatic", extra: { baseUrl: "https://example.invalid", categoryIds: [12], defaultStatus: "publish", uploadFeaturedImage: true } },
    });

    const result = await transport.publish(mockFormattedContent({ imageUrl: "https://cdn.example.invalid/image.webp" }), target);

    expect(result.success).toBe(false);
    expect(postCreationAttempted).toBe(false);
  });
});

describe("WordPress Transport — error classification", () => {
  it("classifies a network timeout as isNetworkError", async () => {
    const fetchImpl = vi.fn(async () => {
      const err = new Error("aborted");
      err.name = "AbortError";
      throw err;
    });
    const transport = createWordPressTransport({ fetchImpl: fetchImpl as unknown as typeof fetch });

    const result = await transport.publish(mockFormattedContent(), mockTarget());

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.isNetworkError).toBe(true);
  });

  it("classifies a 429 with a retry-after header", async () => {
    const fetchImpl = vi.fn(
      async () => new Response(JSON.stringify({ message: "rate limited" }), { status: 429, headers: { "retry-after": "30" } }),
    );
    const transport = createWordPressTransport({ fetchImpl: fetchImpl as unknown as typeof fetch });

    const result = await transport.publish(mockFormattedContent(), mockTarget());

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.httpStatus).toBe(429);
      expect(result.error.retryAfterSeconds).toBe(30);
    }
  });

  it("classifies a 5xx as a server error with the status preserved", async () => {
    const fetchImpl = vi.fn(async () => new Response("server error", { status: 503 }));
    const transport = createWordPressTransport({ fetchImpl: fetchImpl as unknown as typeof fetch });

    const result = await transport.publish(mockFormattedContent(), mockTarget());

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.httpStatus).toBe(503);
  });

  it("classifies a permanent 4xx (e.g. 401) distinctly from a network error", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ message: "invalid credentials" }), { status: 401 }));
    const transport = createWordPressTransport({ fetchImpl: fetchImpl as unknown as typeof fetch });

    const result = await transport.publish(mockFormattedContent(), mockTarget());

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.httpStatus).toBe(401);
      expect(result.error.isNetworkError).toBeUndefined();
    }
  });

  it("returns a config error without calling fetch when the target config is invalid", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ id: 1, link: "x" }));
    const transport = createWordPressTransport({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const badTarget = mockTarget({ credentials: { username: "", applicationPassword: "" } });

    const result = await transport.publish(mockFormattedContent(), badTarget);

    expect(result.success).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("returns a config error when the FormattedContent kind does not match", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ id: 1, link: "x" }));
    const transport = createWordPressTransport({ fetchImpl: fetchImpl as unknown as typeof fetch });

    const result = await transport.publish({ kind: "telegram-caption", body: {} }, mockTarget());

    expect(result.success).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("WordPress Transport — uploadMedia (standalone)", () => {
  it("uploads and returns a normalized media reference", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url === "https://cdn.example.invalid/image.png") {
        return new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { "content-type": "image/png", "content-length": "3" } });
      }
      return jsonResponse({ id: 99, source_url: "https://example.invalid/uploads/image.png" });
    });

    const transport = createWordPressTransport({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const media = await transport.uploadMedia!("https://cdn.example.invalid/image.png", mockTarget());

    expect(media).toEqual({ mediaId: "99", mediaUrl: "https://example.invalid/uploads/image.png" });
  });
});

describe("WordPress Transport — no real network calls", () => {
  it("never invokes the real global fetch (every call in this file goes through fetchImpl)", async () => {
    const realFetch = globalThis.fetch;
    const realFetchSpy = vi.fn(realFetch);
    globalThis.fetch = realFetchSpy as unknown as typeof fetch;

    try {
      const fetchImpl = vi.fn(async () => jsonResponse({ id: 1, link: "https://example.invalid/?p=1" }));
      const transport = createWordPressTransport({ fetchImpl: fetchImpl as unknown as typeof fetch });
      await transport.publish(mockFormattedContent(), mockTarget());

      expect(realFetchSpy).not.toHaveBeenCalled();
    } finally {
      globalThis.fetch = realFetch;
    }
  });
});
