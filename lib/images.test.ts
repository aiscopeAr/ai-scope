import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mocks the explicit create -> poll get() lifecycle that replaced
// replicate.run(). run() proved unreliable in production twice:
//  - default block mode's server-side synchronous wait mistook "processing"
//    for done (output still null) — correlation_id=img_92fd0f337d84.
//  - even with { wait: { mode: "poll" } } requested, run() still returned
//    before the prediction had actually reached "succeeded" — a race
//    inside run() itself, not controllable from outside —
//    correlation_id=img_8d1f1a994d4f.
// generateReviewImage now owns the loop directly via predictions.create()
// + predictions.get(), and only reads output after observing
// status === "succeeded" itself.

const createMock = vi.fn();
const getMock = vi.fn();

vi.mock("replicate", () => {
  return {
    default: class MockReplicate {
      predictions = {
        create: (...args: unknown[]) => createMock(...args),
        get: (...args: unknown[]) => getMock(...args),
      };
    },
  };
});

vi.mock("@/lib/cloudinary", () => ({
  uploadImageFromUrl: vi.fn().mockResolvedValue("https://res.cloudinary.com/demo/image/upload/v1/x.webp"),
}));

const REAL_OUTPUT_URL = "https://ai-gateway-outputs.example.r2.cloudflarestorage.com/provider-outputs/a/b";
const PREDICTION_ID = "pred_test123";

function prediction(status: string, overrides: Record<string, unknown> = {}) {
  return { id: PREDICTION_ID, status, output: null, error: null, ...overrides };
}

/** Queues a sequence of predictions.get() responses, one per call. */
function queueGetResponses(...responses: ReturnType<typeof prediction>[]) {
  let call = 0;
  getMock.mockImplementation(() => {
    const response = responses[Math.min(call, responses.length - 1)];
    call += 1;
    return Promise.resolve(response);
  });
}

beforeEach(() => {
  vi.stubEnv("REPLICATE_API_TOKEN", "r8_test_token");
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockRestore();
});

/** Runs generateReviewImage while auto-advancing fake timers so the internal poll loop resolves. */
async function runWithFakeTimers(promptCtx?: Parameters<typeof import("./images").generateReviewImage>[1]) {
  const { generateReviewImage } = await import("./images");
  const resultPromise = generateReviewImage("test prompt", promptCtx);
  // Advance in small increments to let each queued microtask/poll tick settle.
  for (let i = 0; i < 10; i++) {
    await vi.advanceTimersByTimeAsync(500);
  }
  return resultPromise;
}

describe("generateReviewImage — explicit predictions.create/get lifecycle", () => {
  it("A: create -> starting -> get -> processing -> get -> succeeded with output", async () => {
    createMock.mockResolvedValue(prediction("starting"));
    queueGetResponses(
      prediction("processing"),
      prediction("succeeded", { output: REAL_OUTPUT_URL }),
    );

    const result = await runWithFakeTimers({ correlationId: "img_a", reviewId: "rev_a" });

    expect(result).toBe("https://res.cloudinary.com/demo/image/upload/v1/x.webp");
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: "black-forest-labs/flux-schnell", wait: false }),
    );
  });

  it("B: stays processing for multiple polls before succeeding", async () => {
    createMock.mockResolvedValue(prediction("starting"));
    queueGetResponses(
      prediction("processing"),
      prediction("processing"),
      prediction("processing"),
      prediction("processing"),
      prediction("succeeded", { output: REAL_OUTPUT_URL }),
    );

    const result = await runWithFakeTimers();

    expect(result).toBe("https://res.cloudinary.com/demo/image/upload/v1/x.webp");
    expect(getMock).toHaveBeenCalledTimes(5);
  });

  it("C: succeeded immediately with valid output", async () => {
    createMock.mockResolvedValue(prediction("starting"));
    queueGetResponses(prediction("succeeded", { output: REAL_OUTPUT_URL }));

    const result = await runWithFakeTimers();

    expect(result).toBe("https://res.cloudinary.com/demo/image/upload/v1/x.webp");
  });

  it("D: failed status returns null without reading output", async () => {
    createMock.mockResolvedValue(prediction("starting"));
    queueGetResponses(prediction("failed", { error: "model execution error" }));
    const { uploadImageFromUrl } = await import("@/lib/cloudinary");

    const result = await runWithFakeTimers();

    expect(result).toBeNull();
    expect(uploadImageFromUrl).not.toHaveBeenCalled();
  });

  it("E: canceled status returns null", async () => {
    createMock.mockResolvedValue(prediction("starting"));
    queueGetResponses(prediction("canceled"));

    const result = await runWithFakeTimers();

    expect(result).toBeNull();
  });

  it("F: timeout — polling stops and fails after the bounded limit instead of looping forever", async () => {
    createMock.mockResolvedValue(prediction("starting"));
    // Never resolves to a terminal state.
    getMock.mockResolvedValue(prediction("processing"));

    const { generateReviewImage } = await import("./images");
    const resultPromise = generateReviewImage("test prompt");

    // Advance well past the 120s poll timeout.
    for (let i = 0; i < 260; i++) {
      await vi.advanceTimersByTimeAsync(500);
    }
    const result = await resultPromise;

    expect(result).toBeNull();
    // Bounded: stopped polling rather than continuing indefinitely.
    expect(getMock.mock.calls.length).toBeLessThan(260);
  });

  it("G: succeeded but output null/unparseable -> controlled failure, not fabricated success", async () => {
    createMock.mockResolvedValue(prediction("starting"));
    queueGetResponses(prediction("succeeded", { output: null }));
    const { uploadImageFromUrl } = await import("@/lib/cloudinary");

    const result = await runWithFakeTimers();

    expect(result).toBeNull();
    expect(uploadImageFromUrl).not.toHaveBeenCalled();
  });

  it("regression: the run()-based race (succeeded moments after an early null read) is no longer possible because output is read only from the terminal predictions.get() response", async () => {
    createMock.mockResolvedValue(prediction("starting"));
    // Simulates exactly what production observed: one processing poll, then
    // a genuinely terminal succeeded response with real output — this is the
    // *only* value generateReviewImage ever reads, unlike run() which could
    // return the stale intermediate state instead.
    queueGetResponses(
      prediction("processing"),
      prediction("succeeded", { output: REAL_OUTPUT_URL }),
    );

    const result = await runWithFakeTimers();

    expect(result).not.toBeNull();
  });
});
