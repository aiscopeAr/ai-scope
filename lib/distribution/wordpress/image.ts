/**
 * lib/distribution/wordpress/image.ts
 *
 * Minimal, bounded featured-image handling for the WordPress Transport:
 * MIME/size validation and a safe filename derivation. No image
 * transformation, no caching layer, no Cloudinary involvement — Lumiq's
 * existing image pipeline (lib/images.ts) already produced and hosted the
 * source image; this module only prepares it for a WordPress media upload.
 *
 * Network I/O (the actual download + upload) lives in transport.ts, where
 * it can be injected/mocked. This module is pure so its rules can be unit
 * tested without any fetch involved.
 */

export const SUPPORTED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type SupportedImageMimeType = (typeof SUPPORTED_IMAGE_MIME_TYPES)[number];

/** 8 MB — comfortably above Lumiq's own generated images (16:9 webp,
 *  quality 80 from lib/images.ts) while still bounding worst-case memory
 *  use for a single upload. */
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export const DEFAULT_IMAGE_TIMEOUT_MS = 15_000;

export interface ImageValidationResult {
  valid: boolean;
  errors: string[];
}

/** Validates a candidate image's content-type and size before it is sent
 *  to WordPress's media endpoint. Pure — takes already-known metadata
 *  rather than performing the fetch itself, so it composes with whatever
 *  HTTP client the Transport uses. */
export function validateImageMetadata(params: { contentType: string | null; contentLength: number | null }): ImageValidationResult {
  const errors: string[] = [];

  if (!params.contentType || !SUPPORTED_IMAGE_MIME_TYPES.includes(params.contentType as SupportedImageMimeType)) {
    errors.push(`unsupported image content-type: ${params.contentType ?? "unknown"}`);
  }

  if (params.contentLength !== null) {
    if (params.contentLength <= 0) {
      errors.push("image content-length must be greater than zero");
    } else if (params.contentLength > MAX_IMAGE_BYTES) {
      errors.push(`image exceeds maximum size of ${MAX_IMAGE_BYTES} bytes (got ${params.contentLength})`);
    }
  }

  return { valid: errors.length === 0, errors };
}

const EXTENSION_BY_MIME: Record<SupportedImageMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Derives a safe, ASCII-only filename for the WordPress media upload
 *  from a content slug and its validated MIME type — never derived from
 *  the source URL directly, since a URL's path segment is not guaranteed
 *  to be a safe or sensible filename. */
export function deriveMediaFilename(slug: string, mimeType: SupportedImageMimeType): string {
  const safeSlug = slug.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "lumiq-image";
  return `${safeSlug}.${EXTENSION_BY_MIME[mimeType]}`;
}

/** Returns true if `contentType` is one of the supported image MIME types. */
export function isSupportedImageMimeType(contentType: string | null): contentType is SupportedImageMimeType {
  return contentType !== null && (SUPPORTED_IMAGE_MIME_TYPES as readonly string[]).includes(contentType);
}
