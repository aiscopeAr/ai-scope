import { describe, it, expect, afterEach } from "vitest";
import { registerTransport, getTransport, __resetTransportsForTests } from "./transport";
import type { Transport } from "./transport";

afterEach(() => {
  __resetTransportsForTests();
});

function stubTransport(targetType: string): Transport {
  return {
    targetType,
    async publish() {
      return { success: true, externalId: "stub-id" };
    },
  };
}

describe("Transport registry", () => {
  it("returns undefined for an unregistered targetType", () => {
    expect(getTransport("wordpress")).toBeUndefined();
  });

  it("returns the registered transport for its targetType", () => {
    const transport = stubTransport("wordpress");
    registerTransport(transport);
    expect(getTransport("wordpress")).toBe(transport);
  });

  it("throws when registering a second transport for the same targetType", () => {
    registerTransport(stubTransport("wordpress"));
    expect(() => registerTransport(stubTransport("wordpress"))).toThrow(/already registered/);
  });

  it("keeps distinct targetTypes independent", () => {
    const wp = stubTransport("wordpress");
    const ghost = stubTransport("ghost");
    registerTransport(wp);
    registerTransport(ghost);

    expect(getTransport("wordpress")).toBe(wp);
    expect(getTransport("ghost")).toBe(ghost);
  });
});
