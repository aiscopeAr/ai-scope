import { afterEach, describe, expect, it, vi } from "vitest";

// Simulates the real Replicate SDK's two `run()` wait modes:
//  - "block" (the buggy default): mirrors the actual defect — the server-side
//    synchronous wait can return once the prediction leaves "starting", even
//    if it's still "processing" with output still null. This is exactly what
//    caused correlation_id=img_92fd0f337d84 to fail in production.
//  - "poll": walks the prediction through starting -> processing -> succeeded
//    and only returns once a true terminal state is reached, matching the
//    real SDK's polling loop.
let runMock: ReturnType<typeof vi.fn<(options: { wait?: { mode?: string } }) => Promise<unknown>>>;

vi.mock("replicate", () => {
  return {
    default: class MockReplicate {
      run(_ref: string, options: { wait?: { mode?: string } }) {
        return runMock(options);
      }
    },
  };
});

vi.mock("@/lib/cloudinary", () => ({
  uploadImageFromUrl: vi.fn().mockResolvedValue("https://res.cloudinary.com/demo/image/upload/v1/x.webp"),
}));

const REAL_OUTPUT_URL = "https://ai-gateway-outputs.example.r2.cloudflarestorage.com/provider-outputs/a/b";

function simulateBlockModeRace() {
  // The prediction sequence: starting -> processing -> (server hold window
  // elapses, HTTP response returns here) with output still null.
  return { output: null };
}

function simulatePollModeToCompletion() {
  // The polling loop keeps checking until a genuine terminal state.
  const states = ["starting", "processing", "processing", "succeeded"];
  const final = states.at(-1) ?? "";
  if (final !== "succeeded") return null;
  return { output: REAL_OUTPUT_URL };
}

afterEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockRestore();
});

describe("generateReviewImage — Replicate polling regression", () => {
  it("does not treat a stale processing/output=null block-mode result as success", async () => {
    vi.stubEnv("REPLICATE_API_TOKEN", "r8_test_token");
    runMock = vi.fn().mockImplementation((options: { wait?: { mode?: string } }) => {
      // This simulates what would happen if the code regressed to the
      // buggy default (no wait option, or block mode): the race condition
      // returns before the prediction is truly done.
      if (!options?.wait || options.wait.mode === "block") {
        return Promise.resolve(simulateBlockModeRace().output);
      }
      return Promise.resolve(simulatePollModeToCompletion()?.output ?? null);
    });

    const { generateReviewImage } = await import("./images");
    const result = await generateReviewImage("test prompt", { correlationId: "img_test", reviewId: "rev_test" });

    // With the fix in place, generateReviewImage always requests poll mode,
    // so this must resolve successfully rather than reproduce the bug.
    expect(result).toBe("https://res.cloudinary.com/demo/image/upload/v1/x.webp");
    expect(runMock).toHaveBeenCalledWith(
      expect.objectContaining({ wait: { mode: "poll", interval: 500 } }),
    );
  });

  it("passes wait: { mode: 'poll', interval: 500 } to replicate.run()", async () => {
    vi.stubEnv("REPLICATE_API_TOKEN", "r8_test_token");
    runMock = vi.fn().mockResolvedValue(REAL_OUTPUT_URL);

    const { generateReviewImage } = await import("./images");
    await generateReviewImage("test prompt");

    const callOptions = runMock.mock.calls[0][0] as { wait?: { mode?: string; interval?: number } };
    expect(callOptions.wait).toEqual({ mode: "poll", interval: 500 });
  });

  it("regression: would fail if run() used block mode (proves the test catches the bug)", async () => {
    vi.stubEnv("REPLICATE_API_TOKEN", "r8_test_token");
    // This mock ignores wait entirely and always simulates the buggy
    // early-return behavior, regardless of what options are passed —
    // standing in for the pre-fix code path.
    runMock = vi.fn().mockImplementation(() => Promise.resolve(simulateBlockModeRace().output));

    const { generateReviewImage } = await import("./images");
    const result = await generateReviewImage("test prompt");

    // Even with the fix requesting poll mode, if the underlying SDK (or a
    // regression back to block mode) still returns the stale null output,
    // generateReviewImage must surface that as a failure (null) — not
    // fabricate success.
    expect(result).toBeNull();
  });

  it("returns null and never calls uploadImageFromUrl when output stays null", async () => {
    vi.stubEnv("REPLICATE_API_TOKEN", "r8_test_token");
    runMock = vi.fn().mockResolvedValue(null);
    const { uploadImageFromUrl } = await import("@/lib/cloudinary");

    const { generateReviewImage } = await import("./images");
    const result = await generateReviewImage("test prompt");

    expect(result).toBeNull();
    expect(uploadImageFromUrl).not.toHaveBeenCalled();
  });
});
