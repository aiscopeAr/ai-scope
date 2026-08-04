/**
 * lib/distribution/wordpress/register.ts
 *
 * Explicit registration entry point for the WordPress Formatter and
 * Transport. Deliberately NOT a side effect of importing this directory's
 * index — Lumiq's existing conventions (lib/social/index.ts's `providers`
 * map, lib/distribution/*'s empty-by-default registries) treat
 * registration as something a caller triggers, not something that
 * happens implicitly on module load, so that importing types or running
 * unrelated tests can never accidentally populate global registry state.
 *
 * A future sprint's orchestration bootstrap (e.g. a queue's startup code)
 * is expected to call `registerWordPressTarget()` once before any
 * WordPress DistributionTask is dispatched. This sprint defines the
 * function but does not call it from anywhere in the app.
 */

import { registerFormatter } from "../formatter";
import { registerTransport } from "../transport";
import { wordPressFormatter } from "./formatter";
import { createWordPressTransport, type WordPressTransportOptions } from "./transport";

let registered = false;

/**
 * Registers the WordPress Formatter and Transport into the Distribution
 * Engine's registries. Idempotent — calling it more than once is a no-op
 * rather than throwing, since a future queue's bootstrap code may run in
 * more than one code path (e.g. both a cron entry point and an admin
 * "send now" action) and neither should need to coordinate who registers
 * first.
 */
export function registerWordPressTarget(options: WordPressTransportOptions = {}): void {
  if (registered) return;
  registerFormatter(wordPressFormatter);
  registerTransport(createWordPressTransport(options));
  registered = true;
}

/** Test-only escape hatch mirroring the pattern already used by the
 *  underlying registries (__resetFormattersForTests/__resetTransportsForTests). */
export function __resetWordPressRegistrationForTests(): void {
  registered = false;
}
