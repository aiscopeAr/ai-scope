/**
 * lib/distribution/formatter.ts
 *
 * The Formatter contract — how a piece of content becomes the shape a
 * given targetType expects (HTML body, a short caption, an RSS <item>,
 * a structured JSON payload, ...). A Formatter never performs I/O and
 * never knows about authentication; it is a pure content transform,
 * called by the future queue before the Transport Adapter is invoked.
 *
 * No concrete Formatter is implemented in this sprint — this file defines
 * only the interface and the empty registry future formatters register
 * into. Mapping a real content model (e.g. Review) into a FormattedContent
 * is explicitly out of scope here — see docs/distribution-engine-foundation.md.
 */

import type { DistributionTargetConfig } from "./types";

/** Opaque payload a Formatter produces and a Transport Adapter consumes.
 *  Deliberately loose (`unknown` body) — different targets need
 *  fundamentally different shapes (HTML string, structured JSON, XML
 *  string), and the engine core never inspects this value, only passes it
 *  through. Concrete Formatters narrow this via their own return type. */
export interface FormattedContent {
  /** Discriminates the shape of `body` for the receiving Transport. */
  kind: string;
  body: unknown;
}

/** Minimal, platform-agnostic shape a Formatter reads from. Concrete
 *  content models (Review, etc.) are adapted into this shape by a future
 *  sprint — this foundation does not depend on any specific content model. */
export interface DistributableContent {
  id: string;
  title: string;
  /** Primary body text, format unspecified at this layer (a concrete
   *  Formatter decides how to interpret it, e.g. as Markdown). */
  body: string;
  summary?: string;
  imageUrl?: string;
  canonicalUrl?: string;
  tags?: string[];
  category?: string;
}

/** Contract every platform-specific Formatter must implement. One
 *  Formatter per targetType — shared by every Target row of that type,
 *  since formatting rules depend on the platform, not the individual
 *  partner (their differences are expressed via DistributionTargetConfig). */
export interface Formatter {
  targetType: string;
  format(content: DistributableContent, config: DistributionTargetConfig): FormattedContent;
}

/** Registry of Formatters keyed by targetType. Empty by design — see
 *  transport.ts's registry for the identical rationale. */
const formatters = new Map<string, Formatter>();

/** Registers a Formatter for a given targetType. Throws on duplicate
 *  registration for the same reason registerTransport does. */
export function registerFormatter(formatter: Formatter): void {
  if (formatters.has(formatter.targetType)) {
    throw new Error(`Formatter already registered for targetType "${formatter.targetType}"`);
  }
  formatters.set(formatter.targetType, formatter);
}

/** Looks up the Formatter registered for a targetType. Returns undefined
 *  rather than throwing — same rationale as getTransport. */
export function getFormatter(targetType: string): Formatter | undefined {
  return formatters.get(targetType);
}

/** Test-only escape hatch to reset the registry between test files. */
export function __resetFormattersForTests(): void {
  formatters.clear();
}
