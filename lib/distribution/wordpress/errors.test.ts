import { describe, it, expect } from "vitest";
import { classifyWordPressResponseError, classifyWordPressNetworkError, classifyWordPressConfigError } from "./errors";

describe("classifyWordPressResponseError", () => {
  it("carries the HTTP status through", () => {
    const err = classifyWordPressResponseError(401, "invalid credentials");
    expect(err.httpStatus).toBe(401);
  });

  it("truncates a very long response body", () => {
    const longBody = "x".repeat(1000);
    const err = classifyWordPressResponseError(500, longBody);
    expect(err.message.length).toBeLessThan(400);
  });

  it("does not set retryAfterSeconds for non-429 statuses even if a value is supplied", () => {
    const err = classifyWordPressResponseError(400, "bad request", 30);
    expect(err.retryAfterSeconds).toBeUndefined();
  });

  it("sets retryAfterSeconds for 429 when supplied", () => {
    const err = classifyWordPressResponseError(429, "too many requests", 30);
    expect(err.retryAfterSeconds).toBe(30);
  });

  it("leaves retryAfterSeconds undefined for 429 when not supplied", () => {
    const err = classifyWordPressResponseError(429, "too many requests");
    expect(err.retryAfterSeconds).toBeUndefined();
  });

  it("does not set isNetworkError for an HTTP response error", () => {
    const err = classifyWordPressResponseError(500, "server error");
    expect(err.isNetworkError).toBeUndefined();
  });
});

describe("classifyWordPressNetworkError", () => {
  it("marks isNetworkError true", () => {
    const err = classifyWordPressNetworkError(new Error("fetch failed"));
    expect(err.isNetworkError).toBe(true);
  });

  it("does not set httpStatus", () => {
    const err = classifyWordPressNetworkError(new Error("fetch failed"));
    expect(err.httpStatus).toBeUndefined();
  });

  it("produces a distinct message for an AbortError (timeout)", () => {
    const abortError = new Error("The operation was aborted");
    abortError.name = "AbortError";
    const err = classifyWordPressNetworkError(abortError);
    expect(err.message).toMatch(/timed out/);
  });

  it("handles a non-Error thrown value", () => {
    const err = classifyWordPressNetworkError("plain string failure");
    expect(err.isNetworkError).toBe(true);
    expect(err.message).toContain("plain string failure");
  });
});

describe("classifyWordPressConfigError", () => {
  it("carries no httpStatus or isNetworkError (so it is treated as permanent by a future classifier)", () => {
    const err = classifyWordPressConfigError("missing baseUrl");
    expect(err.httpStatus).toBeUndefined();
    expect(err.isNetworkError).toBeUndefined();
  });

  it("includes the supplied message", () => {
    const err = classifyWordPressConfigError("missing baseUrl");
    expect(err.message).toContain("missing baseUrl");
  });
});
