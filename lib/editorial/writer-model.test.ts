import { describe, it, expect } from "vitest";
import { resolveWriterRoute, GEMINI_WRITER_MODEL } from "./writer-model";

const KEY = "AIzaSyFAKEKEYFAKEKEYFAKEKEYFAKEKEY123"; // >=20 chars, plausible

describe("resolveWriterRoute", () => {
  it("routes the mapped author (lina) to Gemini when enabled + key present", () => {
    const r = resolveWriterRoute("lina", true, { GEMINI_API_KEY: KEY });
    expect(r).toEqual({ provider: "gemini", model: GEMINI_WRITER_MODEL });
  });

  it("returns null when multi-model is disabled (default OpenAI path)", () => {
    expect(resolveWriterRoute("lina", false, { GEMINI_API_KEY: KEY })).toBeNull();
  });

  it("returns null for an unmapped author", () => {
    expect(resolveWriterRoute("zayd", true, { GEMINI_API_KEY: KEY })).toBeNull();
  });

  it("returns null when GEMINI_API_KEY is missing or a short placeholder", () => {
    expect(resolveWriterRoute("lina", true, {})).toBeNull();
    expect(resolveWriterRoute("lina", true, { GEMINI_API_KEY: "sk-ant-x" })).toBeNull();
  });
});
