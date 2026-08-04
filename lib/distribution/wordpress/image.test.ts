import { describe, it, expect } from "vitest";
import { validateImageMetadata, deriveMediaFilename, isSupportedImageMimeType, MAX_IMAGE_BYTES, SUPPORTED_IMAGE_MIME_TYPES } from "./image";

describe("validateImageMetadata — MIME type", () => {
  it("accepts every supported MIME type", () => {
    for (const mime of SUPPORTED_IMAGE_MIME_TYPES) {
      expect(validateImageMetadata({ contentType: mime, contentLength: 1000 }).valid).toBe(true);
    }
  });

  it("rejects an unsupported MIME type", () => {
    const result = validateImageMetadata({ contentType: "image/gif", contentLength: 1000 });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/unsupported/);
  });

  it("rejects a null content type", () => {
    expect(validateImageMetadata({ contentType: null, contentLength: 1000 }).valid).toBe(false);
  });

  it("rejects a non-image MIME type (e.g. an HTML error page served instead of an image)", () => {
    expect(validateImageMetadata({ contentType: "text/html", contentLength: 500 }).valid).toBe(false);
  });
});

describe("validateImageMetadata — size", () => {
  it("accepts a size within the limit", () => {
    expect(validateImageMetadata({ contentType: "image/webp", contentLength: MAX_IMAGE_BYTES - 1 }).valid).toBe(true);
  });

  it("rejects a size over the limit", () => {
    const result = validateImageMetadata({ contentType: "image/webp", contentLength: MAX_IMAGE_BYTES + 1 });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("maximum size"))).toBe(true);
  });

  it("rejects a zero size", () => {
    expect(validateImageMetadata({ contentType: "image/webp", contentLength: 0 }).valid).toBe(false);
  });

  it("rejects a negative size", () => {
    expect(validateImageMetadata({ contentType: "image/webp", contentLength: -1 }).valid).toBe(false);
  });

  it("allows an unknown (null) content-length to pass size checks (validated later from the actual buffer)", () => {
    const result = validateImageMetadata({ contentType: "image/webp", contentLength: null });
    expect(result.valid).toBe(true);
  });
});

describe("deriveMediaFilename", () => {
  it("produces a safe ascii filename from a slug", () => {
    expect(deriveMediaFilename("my-review-slug", "image/webp")).toBe("my-review-slug.webp");
  });

  it("maps each supported MIME type to its expected extension", () => {
    expect(deriveMediaFilename("x", "image/jpeg")).toBe("x.jpg");
    expect(deriveMediaFilename("x", "image/png")).toBe("x.png");
    expect(deriveMediaFilename("x", "image/webp")).toBe("x.webp");
  });

  it("strips unsafe characters from the slug", () => {
    const filename = deriveMediaFilename("عربي/../../etc passwd?.jpg", "image/webp");
    expect(filename).not.toContain("/");
    expect(filename).not.toContain("..");
    expect(filename).not.toContain(" ");
  });

  it("falls back to a default name when the slug sanitizes to empty", () => {
    expect(deriveMediaFilename("###", "image/png")).toBe("lumiq-image.png");
  });
});

describe("isSupportedImageMimeType", () => {
  it("returns true for supported types", () => {
    expect(isSupportedImageMimeType("image/png")).toBe(true);
  });

  it("returns false for unsupported types", () => {
    expect(isSupportedImageMimeType("image/svg+xml")).toBe(false);
  });

  it("returns false for null", () => {
    expect(isSupportedImageMimeType(null)).toBe(false);
  });
});
