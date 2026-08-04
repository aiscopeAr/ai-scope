/**
 * lib/distribution/transport.ts
 *
 * The Transport Adapter contract — how the engine speaks to one external
 * system's API. A Transport is responsible for exactly two things:
 * authentication mechanics and the literal request/response call. It never
 * formats content (that's a Formatter's job, see formatter.ts) and never
 * touches DistributionTask persistence (that's the future queue's job).
 *
 * No concrete Transport is implemented in this sprint — this file defines
 * only the interface every future adapter (WordPress, Telegram, Ghost, ...)
 * must satisfy, plus the empty registry future adapters register into.
 */

import type { DistributionTarget, DistributionResult } from "./types";
import type { FormattedContent } from "./formatter";

/** Contract every platform-specific Transport Adapter must implement.
 *  One Transport per targetType, reused by every Target row of that type. */
export interface Transport {
  targetType: string;

  /** Send an already-formatted payload to the target. Must not throw for
   *  ordinary failures (auth error, validation error, rate limit) — those
   *  are reported via the failure branch of DistributionResult so the
   *  (future) retry engine can classify them without try/catch at the
   *  call site. Throwing is reserved for programmer error only. */
  publish(payload: FormattedContent, target: DistributionTarget): Promise<DistributionResult>;

  /** Optional: upload a media asset to the target ahead of publishing
   *  (e.g. WordPress's media library, which featured_media must reference
   *  locally). Targets that accept an external image URL directly omit
   *  this method entirely. */
  uploadMedia?(imageUrl: string, target: DistributionTarget): Promise<{ mediaId: string; mediaUrl?: string }>;
}

/** Registry of Transport Adapters keyed by targetType. Empty by design —
 *  populated only when a future sprint implements a real adapter and
 *  calls registerTransport(). Looking up an unregistered targetType is a
 *  configuration error the caller must handle, not a silent no-op. */
const transports = new Map<string, Transport>();

/** Registers a Transport Adapter for a given targetType. Throws if a
 *  Transport is already registered for that type — registration order
 *  bugs (e.g. double-importing a module) must fail loudly, not silently
 *  overwrite. */
export function registerTransport(transport: Transport): void {
  if (transports.has(transport.targetType)) {
    throw new Error(`Transport already registered for targetType "${transport.targetType}"`);
  }
  transports.set(transport.targetType, transport);
}

/** Looks up the Transport Adapter registered for a targetType. Returns
 *  undefined rather than throwing — callers (the future queue) decide how
 *  to surface "no transport for this target" (e.g. as a permanent
 *  DistributionTask failure), since that decision belongs to the caller's
 *  error-handling policy, not to this lookup. */
export function getTransport(targetType: string): Transport | undefined {
  return transports.get(targetType);
}

/** Test-only escape hatch to reset the registry between test files.
 *  Not part of the public API — see index.ts. */
export function __resetTransportsForTests(): void {
  transports.clear();
}
