/**
 * lib/tools/export-filename.ts
 *
 * Pure filename logic, split out from the export trigger so it's testable
 * without a browser/DOM environment (vitest's default "node" environment
 * has no document.fonts or canvas).
 */

export function buildCalligraphyExportFilename(): string {
  return "lumiq-arabic-calligraphy.png";
}
