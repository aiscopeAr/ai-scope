import { describe, it, expect, afterEach } from "vitest";
import { registerFormatter, getFormatter, __resetFormattersForTests } from "./formatter";
import type { Formatter } from "./formatter";

afterEach(() => {
  __resetFormattersForTests();
});

function stubFormatter(targetType: string): Formatter {
  return {
    targetType,
    format(content) {
      return { kind: "text", body: content.title };
    },
  };
}

describe("Formatter registry", () => {
  it("returns undefined for an unregistered targetType", () => {
    expect(getFormatter("wordpress")).toBeUndefined();
  });

  it("returns the registered formatter for its targetType", () => {
    const formatter = stubFormatter("wordpress");
    registerFormatter(formatter);
    expect(getFormatter("wordpress")).toBe(formatter);
  });

  it("throws when registering a second formatter for the same targetType", () => {
    registerFormatter(stubFormatter("wordpress"));
    expect(() => registerFormatter(stubFormatter("wordpress"))).toThrow(/already registered/);
  });

  it("produces a FormattedContent from a DistributableContent", () => {
    const formatter = stubFormatter("wordpress");
    const result = formatter.format(
      { id: "review-1", title: "Test Review", body: "body text" },
      { mode: "automatic" },
    );
    expect(result).toEqual({ kind: "text", body: "Test Review" });
  });
});
