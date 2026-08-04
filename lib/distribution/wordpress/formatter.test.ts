import { describe, it, expect } from "vitest";
import { wordPressFormatter, readWordPressTargetConfig, WORDPRESS_TARGET_TYPE, type WordPressFormattedContent } from "./formatter";
import type { DistributableContent } from "../formatter";
import type { DistributionTargetConfig } from "../types";

function buildConfig(extra: Record<string, unknown> = {}): DistributionTargetConfig {
  return {
    mode: "automatic",
    extra: {
      baseUrl: "https://sonara.example.com",
      categoryIds: [12],
      defaultStatus: "publish",
      uploadFeaturedImage: false,
      ...extra,
    },
  };
}

function buildContent(overrides: Partial<DistributableContent> = {}): DistributableContent {
  return {
    id: "review-1",
    title: "أفضل أدوات الذكاء الاصطناعي لعام 2026",
    body: "## مقدمة\n\nهذا محتوى تجريبي **مهم**.",
    summary: "ملخص قصير للمقال.",
    imageUrl: "https://res.cloudinary.com/example/image.webp",
    canonicalUrl: "https://www.lumiq.news/reviews/best-ai-tools-2026",
    tags: ["AI", "أدوات"],
    category: "ai-tools",
    ...overrides,
  };
}

describe("wordPressFormatter", () => {
  it("declares the wordpress targetType", () => {
    expect(wordPressFormatter.targetType).toBe(WORDPRESS_TARGET_TYPE);
  });

  it("produces a wordpress-post FormattedContent", () => {
    const result = wordPressFormatter.format(buildContent(), buildConfig()) as WordPressFormattedContent;
    expect(result.kind).toBe("wordpress-post");
  });

  it("maps title, excerpt, and categories from content + config", () => {
    const result = wordPressFormatter.format(buildContent(), buildConfig({ categoryIds: [12, 34] })) as WordPressFormattedContent;
    expect(result.body.title).toBe("أفضل أدوات الذكاء الاصطناعي لعام 2026");
    expect(result.body.excerpt).toBe("ملخص قصير للمقال.");
    expect(result.body.categoryIds).toEqual([12, 34]);
  });

  it("maps defaultStatus from config as draft", () => {
    const result = wordPressFormatter.format(buildContent(), buildConfig({ defaultStatus: "draft" })) as WordPressFormattedContent;
    expect(result.body.status).toBe("draft");
  });

  it("maps defaultStatus from config as publish", () => {
    const result = wordPressFormatter.format(buildContent(), buildConfig({ defaultStatus: "publish" })) as WordPressFormattedContent;
    expect(result.body.status).toBe("publish");
  });

  it("carries the image URL through unmodified", () => {
    const result = wordPressFormatter.format(buildContent(), buildConfig()) as WordPressFormattedContent;
    expect(result.body.imageUrl).toBe("https://res.cloudinary.com/example/image.webp");
  });

  it("carries an optional authorId through when configured", () => {
    const result = wordPressFormatter.format(buildContent(), buildConfig({ authorId: 7 })) as WordPressFormattedContent;
    expect(result.body.authorId).toBe(7);
  });

  it("sets sourceUrl to the content's canonicalUrl", () => {
    const result = wordPressFormatter.format(buildContent(), buildConfig()) as WordPressFormattedContent;
    expect(result.body.sourceUrl).toBe("https://www.lumiq.news/reviews/best-ai-tools-2026");
  });

  it("embeds the full body content and the required attribution footer in contentHtml", () => {
    const result = wordPressFormatter.format(buildContent(), buildConfig()) as WordPressFormattedContent;
    expect(result.body.contentHtml).toContain("محتوى تجريبي");
    expect(result.body.contentHtml).toContain("المصدر:");
    expect(result.body.contentHtml).toContain("https://www.lumiq.news/reviews/best-ai-tools-2026");
  });

  it("does not include 'بالتعاون مع' anywhere in the formatted output", () => {
    const result = wordPressFormatter.format(buildContent(), buildConfig()) as WordPressFormattedContent;
    expect(result.body.contentHtml).not.toContain("بالتعاون مع");
  });

  it("throws when canonicalUrl is missing (footer cannot be built without it)", () => {
    expect(() => wordPressFormatter.format(buildContent({ canonicalUrl: undefined }), buildConfig())).toThrow(/canonicalUrl/);
  });

  it("throws when the target config's extra bag is not a valid WordPress config", () => {
    expect(() => wordPressFormatter.format(buildContent(), { mode: "automatic", extra: { baseUrl: "not-a-url" } })).toThrow(
      /Invalid WordPress target config/,
    );
  });

  it("derives a slug from the title", () => {
    const result = wordPressFormatter.format(buildContent({ title: "Simple English Title" }), buildConfig()) as WordPressFormattedContent;
    expect(result.body.slug).toBe("simple-english-title");
  });

  it("strips Arabic punctuation (e.g. a question mark) from the derived slug", () => {
    const result = wordPressFormatter.format(
      buildContent({ title: "كيف تعيد أدوات الذكاء الاصطناعي تشكيل العالم؟" }),
      buildConfig(),
    ) as WordPressFormattedContent;
    expect(result.body.slug).not.toContain("؟");
    expect(result.body.slug).not.toContain("،");
  });

  it("keeps Arabic letters in the derived slug", () => {
    const result = wordPressFormatter.format(buildContent({ title: "أدوات الذكاء الاصطناعي" }), buildConfig()) as WordPressFormattedContent;
    expect(result.body.slug).toBe("أدوات-الذكاء-الاصطناعي");
  });
});

describe("readWordPressTargetConfig", () => {
  it("returns the validated config from a DistributionTargetConfig's extra bag", () => {
    const config = readWordPressTargetConfig(buildConfig());
    expect(config.baseUrl).toBe("https://sonara.example.com");
  });

  it("throws for an invalid extra bag", () => {
    expect(() => readWordPressTargetConfig({ mode: "automatic", extra: {} })).toThrow();
  });
});
