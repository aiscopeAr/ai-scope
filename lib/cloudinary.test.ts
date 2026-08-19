import { afterEach, describe, expect, it, vi } from "vitest";

const uploadStreamMock = vi.fn();

vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload_stream: (
        _options: unknown,
        callback: (error: unknown, result: { secure_url: string } | undefined) => void,
      ) => uploadStreamMock(callback),
    },
  },
}));

const REPLICATE_DELIVERY_URL = "https://replicate.delivery/xezq/abc123/out-0.webp";
const R2_SIGNED_URL =
  "https://ai-gateway-outputs.0d37909e38d3e99c29fa2cd343ac421a.r2.cloudflarestorage.com/provider-outputs/abc/def?X-Amz-Expires=86400&X-Amz-Signature=deadbeef&X-Amz-Credential=secretcred";

function mockFetchOnce(response: Partial<Response> & { arrayBuffer?: () => Promise<ArrayBuffer> }) {
  const fetchMock = vi.fn().mockResolvedValue(response as Response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function fakeImageBytes(): ArrayBuffer {
  return new Uint8Array([1, 2, 3, 4]).buffer;
}

function successfulImageResponse(overrides: Partial<Response> = {}) {
  return {
    ok: true,
    status: 200,
    headers: new Headers({ "content-type": "image/webp" }),
    arrayBuffer: async () => fakeImageBytes(),
    ...overrides,
  };
}

// Makes upload_stream's callback fire successfully with the given secure_url.
function stubUploadSuccess(secureUrl: string) {
  uploadStreamMock.mockImplementation((callback: (error: unknown, result: { secure_url: string }) => void) => {
    callback(null, { secure_url: secureUrl });
    return { end: vi.fn() };
  });
}

function stubUploadFailure(message: string) {
  uploadStreamMock.mockImplementation((callback: (error: unknown, result: undefined) => void) => {
    callback(new Error(message), undefined);
    return { end: vi.fn() };
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  uploadStreamMock.mockReset();
  vi.spyOn(console, "error").mockRestore();
});

describe("uploadImageFromUrl", () => {
  it("A: uploads bytes fetched from a historical replicate.delivery URL", async () => {
    const fetchMock = mockFetchOnce(successfulImageResponse());
    stubUploadSuccess("https://res.cloudinary.com/demo/image/upload/v1/aiscope/reviews/x.webp");

    const { uploadImageFromUrl } = await import("./cloudinary");
    const result = await uploadImageFromUrl(REPLICATE_DELIVERY_URL, "aiscope/reviews");

    expect(result).toBe("https://res.cloudinary.com/demo/image/upload/v1/aiscope/reviews/x.webp");
    expect(fetchMock).toHaveBeenCalledWith(REPLICATE_DELIVERY_URL, { method: "GET" });
  });

  it("B: uploads bytes fetched from a signed R2/Cloudflare gateway URL", async () => {
    mockFetchOnce(successfulImageResponse());
    stubUploadSuccess("https://res.cloudinary.com/demo/image/upload/v1/aiscope/reviews/y.webp");

    const { uploadImageFromUrl } = await import("./cloudinary");
    const result = await uploadImageFromUrl(R2_SIGNED_URL, "aiscope/reviews");

    expect(result).toBe("https://res.cloudinary.com/demo/image/upload/v1/aiscope/reviews/y.webp");
  });

  it("C: only ever issues a GET (never HEAD) against the source URL", async () => {
    const fetchMock = mockFetchOnce(successfulImageResponse());
    stubUploadSuccess("https://res.cloudinary.com/demo/image/upload/v1/x.webp");

    const { uploadImageFromUrl } = await import("./cloudinary");
    await uploadImageFromUrl(R2_SIGNED_URL);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(R2_SIGNED_URL, { method: "GET" });
  });

  it("D: returns null and does not call Cloudinary on a non-200 GET", async () => {
    mockFetchOnce({ ok: false, status: 403, headers: new Headers(), arrayBuffer: async () => fakeImageBytes() });

    const { uploadImageFromUrl } = await import("./cloudinary");
    const result = await uploadImageFromUrl(R2_SIGNED_URL);

    expect(result).toBeNull();
    expect(uploadStreamMock).not.toHaveBeenCalled();
  });

  it("E: returns null when the response is not image content", async () => {
    mockFetchOnce(successfulImageResponse({ headers: new Headers({ "content-type": "text/plain" }) }));

    const { uploadImageFromUrl } = await import("./cloudinary");
    const result = await uploadImageFromUrl(R2_SIGNED_URL);

    expect(result).toBeNull();
    expect(uploadStreamMock).not.toHaveBeenCalled();
  });

  it("F: returns null when Cloudinary upload fails", async () => {
    mockFetchOnce(successfulImageResponse());
    stubUploadFailure("cloudinary boom");

    const { uploadImageFromUrl } = await import("./cloudinary");
    const result = await uploadImageFromUrl(R2_SIGNED_URL);

    expect(result).toBeNull();
  });

  it("G: sanitized logging never leaks signed query parameters or credentials", async () => {
    mockFetchOnce({ ok: false, status: 403, headers: new Headers(), arrayBuffer: async () => fakeImageBytes() });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { uploadImageFromUrl } = await import("./cloudinary");
    await uploadImageFromUrl(R2_SIGNED_URL);

    expect(errorSpy).toHaveBeenCalled();
    const loggedText = errorSpy.mock.calls.map((call) => call.join(" ")).join("\n");
    expect(loggedText).not.toContain("X-Amz-Signature");
    expect(loggedText).not.toContain("X-Amz-Credential");
    expect(loggedText).not.toContain("deadbeef");
    expect(loggedText).not.toContain("secretcred");
    expect(loggedText).not.toContain("?");
    expect(loggedText).toContain("ai-gateway-outputs.0d37909e38d3e99c29fa2cd343ac421a.r2.cloudflarestorage.com");
  });

  it("H: returns the permanent Cloudinary URL on success", async () => {
    mockFetchOnce(successfulImageResponse());
    stubUploadSuccess("https://res.cloudinary.com/demo/image/upload/v1/aiscope/reviews/final.webp");

    const { uploadImageFromUrl } = await import("./cloudinary");
    const result = await uploadImageFromUrl(REPLICATE_DELIVERY_URL, "aiscope/reviews");

    expect(result).toMatch(/^https:\/\/res\.cloudinary\.com\//);
  });

  it("I: stage logs include the passed correlation_id and review_id", async () => {
    mockFetchOnce(successfulImageResponse());
    stubUploadSuccess("https://res.cloudinary.com/demo/image/upload/v1/x.webp");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { uploadImageFromUrl } = await import("./cloudinary");
    await uploadImageFromUrl(R2_SIGNED_URL, "aiscope/reviews", {
      correlationId: "img_test123",
      reviewId: "rev_abc",
    });

    const loggedText = errorSpy.mock.calls.map((call) => call.join(" ")).join("\n");
    expect(loggedText).toContain("correlation_id=img_test123");
    expect(loggedText).toContain("review_id=rev_abc");
    expect(loggedText).toContain("stage=replicate_output_fetch status=success");
    expect(loggedText).toContain("stage=cloudinary_upload status=success");
  });

  it("J: failure-stage logs still include correlation_id/review_id and stay sanitized", async () => {
    mockFetchOnce({ ok: false, status: 403, headers: new Headers(), arrayBuffer: async () => fakeImageBytes() });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { uploadImageFromUrl } = await import("./cloudinary");
    await uploadImageFromUrl(R2_SIGNED_URL, "aiscope/reviews", {
      correlationId: "img_fail456",
      reviewId: "rev_xyz",
    });

    const loggedText = errorSpy.mock.calls.map((call) => call.join(" ")).join("\n");
    expect(loggedText).toContain("correlation_id=img_fail456");
    expect(loggedText).toContain("review_id=rev_xyz");
    expect(loggedText).toContain("stage=replicate_output_fetch status=failed");
    expect(loggedText).not.toContain("X-Amz-Signature");
  });
});
