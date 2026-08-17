import { describe, it, expect } from "vitest";
import { buildCalligraphyExportFilename } from "./export-filename";

describe("buildCalligraphyExportFilename", () => {
  it("returns a sensible, stable, non-empty filename ending in .png", () => {
    const name = buildCalligraphyExportFilename();
    expect(name).toBe("lumiq-arabic-calligraphy.png");
    expect(name.endsWith(".png")).toBe(true);
  });

  it("never contains the user's text — filename logic takes no arguments", () => {
    // Enforced structurally: the function signature accepts no parameters,
    // so there is no way for caller-provided Arabic text to reach the
    // filename (and therefore no way for it to leak into a download log).
    expect(buildCalligraphyExportFilename.length).toBe(0);
  });
});
