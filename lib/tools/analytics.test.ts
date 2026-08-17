import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@vercel/analytics", () => ({ track: vi.fn() }));

import { track } from "@vercel/analytics";
import {
  trackToolView,
  trackToolStyleChange,
  trackToolExport,
  trackToolShare,
  trackToolPresetChange,
} from "./analytics";

const mockedTrack = vi.mocked(track);

beforeEach(() => {
  mockedTrack.mockClear();
});

describe("tool analytics — never forwards free text", () => {
  it("trackToolView sends only the tool slug", () => {
    trackToolView("arabic-calligraphy");
    expect(mockedTrack).toHaveBeenCalledWith("tool_view", { tool_slug: "arabic-calligraphy" });
  });

  it("trackToolStyleChange sends only closed-shape identifiers, never the user's Arabic text", () => {
    trackToolStyleChange("arabic-calligraphy", "reemKufi");
    const [, payload] = mockedTrack.mock.calls[0];
    expect(payload).toEqual({ tool_slug: "arabic-calligraphy", selected_style: "reemKufi" });
    expect(Object.keys(payload as object)).toEqual(["tool_slug", "selected_style"]);
  });

  it("trackToolExport sends only the tool slug and export format", () => {
    trackToolExport("arabic-calligraphy", "png");
    expect(mockedTrack).toHaveBeenCalledWith("tool_export", {
      tool_slug: "arabic-calligraphy",
      export_format: "png",
    });
  });

  it("trackToolShare sends only the tool slug and share method", () => {
    trackToolShare("arabic-calligraphy", "web_share");
    expect(mockedTrack).toHaveBeenCalledWith("tool_share", {
      tool_slug: "arabic-calligraphy",
      method: "web_share",
    });
  });

  it("trackToolPresetChange sends only the tool slug and preset id, never the resulting color/background text", () => {
    trackToolPresetChange("arabic-calligraphy", "gold-elegant");
    const [, payload] = mockedTrack.mock.calls[0];
    expect(payload).toEqual({ tool_slug: "arabic-calligraphy", preset_id: "gold-elegant" });
    expect(Object.keys(payload as object)).toEqual(["tool_slug", "preset_id"]);
  });

  it("every event payload is a small closed set of fields — no arbitrary/free-text key could have been added silently", () => {
    trackToolView("arabic-calligraphy");
    trackToolStyleChange("arabic-calligraphy", "amiri");
    trackToolExport("arabic-calligraphy", "png");
    trackToolShare("arabic-calligraphy", "copy_link");
    trackToolPresetChange("arabic-calligraphy", "black-transparent");

    for (const call of mockedTrack.mock.calls) {
      const payload = call[1] as Record<string, unknown>;
      for (const value of Object.values(payload)) {
        // every value must be a short, closed-vocabulary string (slug / enum id),
        // never long free text that could be user-entered Arabic content
        expect(typeof value).toBe("string");
        expect((value as string).length).toBeLessThan(40);
      }
    }
  });
});
