import { describe, it, expect, afterEach } from "vitest";
import { registerWordPressTarget, __resetWordPressRegistrationForTests } from "./register";
import { getFormatter, __resetFormattersForTests } from "../formatter";
import { getTransport, __resetTransportsForTests } from "../transport";
import { WORDPRESS_TARGET_TYPE } from "./formatter";

afterEach(() => {
  __resetWordPressRegistrationForTests();
  __resetFormattersForTests();
  __resetTransportsForTests();
});

describe("registerWordPressTarget", () => {
  it("registers a Formatter and Transport for the wordpress targetType", () => {
    expect(getFormatter(WORDPRESS_TARGET_TYPE)).toBeUndefined();
    expect(getTransport(WORDPRESS_TARGET_TYPE)).toBeUndefined();

    registerWordPressTarget();

    expect(getFormatter(WORDPRESS_TARGET_TYPE)).toBeDefined();
    expect(getTransport(WORDPRESS_TARGET_TYPE)).toBeDefined();
  });

  it("is idempotent — calling it twice does not throw", () => {
    registerWordPressTarget();
    expect(() => registerWordPressTarget()).not.toThrow();
  });

  it("passes transport options (e.g. a mock fetch) through to the registered transport", async () => {
    let called = false;
    const fetchImpl = (async () => {
      called = true;
      return new Response(JSON.stringify({ id: 1, link: "https://example.invalid/?p=1" }), { status: 200 });
    }) as unknown as typeof fetch;

    registerWordPressTarget({ fetchImpl });

    const transport = getTransport(WORDPRESS_TARGET_TYPE)!;
    await transport.publish(
      { kind: "wordpress-post", body: { title: "t", contentHtml: "<p>x</p>", excerpt: "", slug: "t", sourceUrl: "https://x", categoryIds: [1], status: "publish" } },
      {
        id: "t1",
        name: "Test",
        targetType: WORDPRESS_TARGET_TYPE,
        enabled: true,
        credentials: { username: "u", applicationPassword: "p" },
        config: { mode: "automatic", extra: { baseUrl: "https://example.invalid", categoryIds: [1], defaultStatus: "publish", uploadFeaturedImage: false } },
      },
    );

    expect(called).toBe(true);
  });
});
