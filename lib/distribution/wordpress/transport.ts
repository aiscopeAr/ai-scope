/**
 * lib/distribution/wordpress/transport.ts
 *
 * The WordPress Transport Adapter — implements the Distribution Engine's
 * Transport contract (lib/distribution/transport.ts). Owns exactly:
 * authentication mechanics (Basic Auth via Application Password) and the
 * literal WordPress REST API calls (media upload, post creation). It
 * contains no queue, no retry scheduling, no database access, and no
 * Review queries — content arrives already formatted (WordPressFormattedContent,
 * produced by ./formatter.ts) and credentials/config arrive on the
 * DistributionTarget passed to publish().
 *
 * The `fetch` implementation is injectable (via `WordPressTransportOptions`)
 * specifically so tests never make a real network call — production code
 * omits it and gets the global `fetch`.
 */

import type { DistributionTarget, DistributionResult, DistributionError } from "../types";
import type { FormattedContent } from "../formatter";
import type { Transport } from "../transport";
import type { WordPressFormattedContent } from "./formatter";
import { validateWordPressTarget, resolveTimeoutMs, type WordPressTargetConfig, type WordPressCredentials } from "./config";
import { classifyWordPressResponseError, classifyWordPressNetworkError, classifyWordPressConfigError } from "./errors";
import { validateImageMetadata, deriveMediaFilename, isSupportedImageMimeType, MAX_IMAGE_BYTES } from "./image";

export const WORDPRESS_TARGET_TYPE = "wordpress";

type FetchLike = typeof fetch;

export interface WordPressTransportOptions {
  /** Injectable fetch implementation — tests supply a mock here so no
   *  real network call is ever made outside production. */
  fetchImpl?: FetchLike;
}

interface WordPressPostResponse {
  id: number;
  link: string;
}

interface WordPressMediaResponse {
  id: number;
  source_url: string;
}

function buildAuthHeader(credentials: WordPressCredentials): string {
  const encoded = Buffer.from(`${credentials.username}:${credentials.applicationPassword}`).toString("base64");
  return `Basic ${encoded}`;
}

function readWordPressTargetConfig(target: DistributionTarget): WordPressTargetConfig {
  return (target.config.extra ?? {}) as unknown as WordPressTargetConfig;
}

function readCredentials(target: DistributionTarget): WordPressCredentials {
  return target.credentials as unknown as WordPressCredentials;
}

function retryAfterFromHeaders(headers: Headers): number | undefined {
  const raw = headers.get("retry-after");
  if (!raw) return undefined;
  const seconds = Number(raw);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined;
}

/** Carries an already-classified DistributionError through a throw, so
 *  uploadFeaturedImage's internal early-return-via-throw control flow can
 *  be unwound by publish()'s catch block without re-deriving or guessing
 *  at the error shape — the DistributionError is attached verbatim. */
class WordPressTransportError extends Error {
  readonly distributionError: DistributionError;
  constructor(distributionError: DistributionError) {
    super(distributionError.message);
    this.name = "WordPressTransportError";
    this.distributionError = distributionError;
  }
}

/**
 * Creates a WordPress Transport bound to a given fetch implementation.
 * Production code calls this with no options (defaulting to the global
 * fetch); tests always supply `fetchImpl` so no real HTTP request is ever
 * issued during validation.
 */
export function createWordPressTransport(options: WordPressTransportOptions = {}): Transport {
  const fetchImpl: FetchLike = options.fetchImpl ?? fetch;

  async function uploadFeaturedImage(imageUrl: string, target: DistributionTarget, wpConfig: WordPressTargetConfig, credentials: WordPressCredentials, timeoutMs: number, slug: string): Promise<{ mediaId: string; mediaUrl?: string }> {
    const downloadController = new AbortController();
    const downloadTimeout = setTimeout(() => downloadController.abort(), timeoutMs);
    let imageRes: Response;
    try {
      imageRes = await fetchImpl(imageUrl, { signal: downloadController.signal });
    } catch (err) {
      throw new WordPressTransportError(classifyWordPressNetworkError(err));
    } finally {
      clearTimeout(downloadTimeout);
    }

    if (!imageRes.ok) {
      throw new WordPressTransportError(classifyWordPressResponseError(imageRes.status, await safeReadText(imageRes)));
    }

    const contentType = imageRes.headers.get("content-type");
    const contentLengthHeader = imageRes.headers.get("content-length");
    const contentLength = contentLengthHeader ? Number(contentLengthHeader) : null;

    const validation = validateImageMetadata({ contentType, contentLength });
    if (!validation.valid) {
      throw new WordPressTransportError(classifyWordPressConfigError(validation.errors.join("; ")));
    }
    // isSupportedImageMimeType narrows contentType for deriveMediaFilename below;
    // validateImageMetadata above already guarantees this holds.
    if (!isSupportedImageMimeType(contentType)) {
      throw new WordPressTransportError(classifyWordPressConfigError(`unsupported image content-type: ${contentType ?? "unknown"}`));
    }

    const imageBuffer = await imageRes.arrayBuffer();
    if (imageBuffer.byteLength > MAX_IMAGE_BYTES) {
      throw new WordPressTransportError(
        classifyWordPressConfigError(`image exceeds maximum size of ${MAX_IMAGE_BYTES} bytes (got ${imageBuffer.byteLength})`),
      );
    }

    const filename = deriveMediaFilename(slug, contentType);

    const uploadController = new AbortController();
    const uploadTimeout = setTimeout(() => uploadController.abort(), timeoutMs);
    let uploadRes: Response;
    try {
      uploadRes = await fetchImpl(`${wpConfig.baseUrl.replace(/\/$/, "")}/wp-json/wp/v2/media`, {
        method: "POST",
        headers: {
          Authorization: buildAuthHeader(credentials),
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
        body: imageBuffer,
        signal: uploadController.signal,
      });
    } catch (err) {
      throw new WordPressTransportError(classifyWordPressNetworkError(err));
    } finally {
      clearTimeout(uploadTimeout);
    }

    if (!uploadRes.ok) {
      throw new WordPressTransportError(
        classifyWordPressResponseError(uploadRes.status, await safeReadText(uploadRes), retryAfterFromHeaders(uploadRes.headers)),
      );
    }

    const media = (await uploadRes.json()) as WordPressMediaResponse;
    return { mediaId: String(media.id), mediaUrl: media.source_url };
  }

  const transport: Transport = {
    targetType: WORDPRESS_TARGET_TYPE,

    async uploadMedia(imageUrl: string, target: DistributionTarget) {
      const wpConfig = readWordPressTargetConfig(target);
      const credentials = readCredentials(target);
      const timeoutMs = resolveTimeoutMs(wpConfig);
      return uploadFeaturedImage(imageUrl, target, wpConfig, credentials, timeoutMs, "lumiq-image");
    },

    async publish(payload: FormattedContent, target: DistributionTarget): Promise<DistributionResult> {
      const validation = validateWordPressTarget(target.credentials, target.config.extra ?? {});
      if (!validation.valid) {
        return { success: false, error: classifyWordPressConfigError(validation.errors.join("; ")) };
      }

      if (payload.kind !== "wordpress-post") {
        return { success: false, error: classifyWordPressConfigError(`expected FormattedContent.kind "wordpress-post", got "${payload.kind}"`) };
      }

      const wpBody = (payload as WordPressFormattedContent).body;
      const wpConfig = readWordPressTargetConfig(target);
      const credentials = readCredentials(target);
      const timeoutMs = resolveTimeoutMs(wpConfig);

      let featuredMediaId: string | undefined;
      if (wpConfig.uploadFeaturedImage) {
        if (!wpBody.imageUrl) {
          return { success: false, error: classifyWordPressConfigError("uploadFeaturedImage is enabled but no imageUrl was provided") };
        }
        try {
          const media = await uploadFeaturedImage(wpBody.imageUrl, target, wpConfig, credentials, timeoutMs, wpBody.slug);
          featuredMediaId = media.mediaId;
        } catch (err) {
          // Image-upload failures never silently produce an incomplete post —
          // the whole publish attempt fails, per the sprint's explicit
          // requirement, unless a future config option opts into
          // image-optional behavior (not built here).
          if (err instanceof WordPressTransportError) {
            return { success: false, error: err.distributionError };
          }
          return { success: false, error: classifyWordPressNetworkError(err) };
        }
      }

      const postController = new AbortController();
      const postTimeout = setTimeout(() => postController.abort(), timeoutMs);
      let postRes: Response;
      try {
        postRes = await fetchImpl(`${wpConfig.baseUrl.replace(/\/$/, "")}/wp-json/wp/v2/posts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: buildAuthHeader(credentials),
          },
          body: JSON.stringify({
            title: wpBody.title,
            content: wpBody.contentHtml,
            excerpt: wpBody.excerpt,
            slug: wpBody.slug,
            status: wpBody.status,
            categories: wpBody.categoryIds,
            ...(featuredMediaId ? { featured_media: Number(featuredMediaId) } : {}),
            ...(wpBody.authorId ? { author: wpBody.authorId } : {}),
          }),
          signal: postController.signal,
        });
      } catch (err) {
        return { success: false, error: classifyWordPressNetworkError(err) };
      } finally {
        clearTimeout(postTimeout);
      }

      if (!postRes.ok) {
        const bodyText = await safeReadText(postRes);
        return { success: false, error: classifyWordPressResponseError(postRes.status, bodyText, retryAfterFromHeaders(postRes.headers)) };
      }

      const data = (await postRes.json()) as WordPressPostResponse;
      return { success: true, externalId: String(data.id), remoteUrl: data.link };
    },
  };

  return transport;
}

async function safeReadText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}
