/**
 * lib/distribution/wordpress/index.ts
 *
 * Public API of the WordPress Distribution target implementation. Callers
 * outside this directory should import from here, not from the internal
 * files directly.
 *
 * Importing this module registers nothing — see register.ts for the
 * explicit, idempotent registration entry point a future sprint's
 * orchestration bootstrap is expected to call.
 */

export { WORDPRESS_TARGET_TYPE } from "./formatter";
export { wordPressFormatter, readWordPressTargetConfig } from "./formatter";
export type { WordPressFormattedBody, WordPressFormattedContent } from "./formatter";

export { createWordPressTransport } from "./transport";
export type { WordPressTransportOptions } from "./transport";

export {
  validateWordPressConfig,
  validateWordPressCredentials,
  validateWordPressTarget,
  resolveTimeoutMs,
  DEFAULT_TIMEOUT_MS,
  MIN_TIMEOUT_MS,
  MAX_TIMEOUT_MS,
} from "./config";
export type { WordPressTargetConfig, WordPressCredentials, ConfigValidationResult } from "./config";

export { markdownToHtml, buildAttributionFooter, buildWordPressBodyHtml } from "./html";

export {
  SUPPORTED_IMAGE_MIME_TYPES,
  MAX_IMAGE_BYTES,
  validateImageMetadata,
  deriveMediaFilename,
  isSupportedImageMimeType,
} from "./image";
export type { SupportedImageMimeType, ImageValidationResult } from "./image";

export { classifyWordPressResponseError, classifyWordPressNetworkError, classifyWordPressConfigError } from "./errors";

export { buildWordPressIdempotencyKey, parseWordPressIdempotencyKey } from "./idempotency";

export { registerWordPressTarget } from "./register";
