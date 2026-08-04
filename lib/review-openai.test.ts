import { describe, it, expect } from "vitest";
import { pickHeadlineStyle } from "./review-openai";

describe("pickHeadlineStyle — headline diversity engine (Telegram Experience Sprint 5)", () => {
  it("is deterministic — the same topic always yields the same style", () => {
    const a = pickHeadlineStyle("GPT-5.6 release");
    const b = pickHeadlineStyle("GPT-5.6 release");
    expect(a.key).toBe(b.key);
  });

  it("spreads across multiple styles for different topics rather than collapsing onto one or two", () => {
    const topics = [
      "OpenAI GPT-5.6 release", "Google Gemini 3.5 launch", "Microsoft Mistral partnership",
      "Brown University AI cheating scandal", "MoE models Kimi K3", "No-code AI tools",
      "AI impact on jobs", "Physical video models LingBot", "Perplexity legal tool",
      "AI scientific research breakthrough", "xAI investigation", "Advanced materials AI limits",
      "Chinese models vs US models", "AI consciousness debate", "Nvidia partnership Germany",
    ];
    const styles = new Set(topics.map((t) => pickHeadlineStyle(t).key));
    // With 8 styles and 15 varied topics, a healthy hash spread should hit at
    // least half the pool — this is the exact failure mode being fixed
    // (94% of real headlines collapsing onto 2 of ~8 possible angles).
    expect(styles.size).toBeGreaterThanOrEqual(4);
  });

  it("always returns one of the 8 defined styles", () => {
    const style = pickHeadlineStyle("any topic string");
    expect(["breaking", "stakes", "company-first", "number-first", "comparison", "research", "industry", "future"]).toContain(style.key);
  });
});
