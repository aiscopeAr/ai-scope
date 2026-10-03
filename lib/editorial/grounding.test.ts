import { describe, it, expect } from "vitest";
import { checkGrounding, normalizeDigits, type GroundingSource } from "./grounding";

const sources: GroundingSource[] = [
  {
    title: "OpenAI launches GPT-6 at lower price",
    content: "OpenAI announced GPT-6 today. The model is 40% cheaper than GPT-4o. Anthropic responded within 24 hours.",
    name: "TechCrunch",
  },
];

describe("normalizeDigits", () => {
  it("converts Arabic-Indic digits to Western", () => {
    expect(normalizeDigits("٨٤")).toBe("84");
    expect(normalizeDigits("۲۴")).toBe("24");
    expect(normalizeDigits("abc 40 ٤٠")).toBe("abc 40 40");
  });
});

describe("checkGrounding", () => {
  it("passes when every number and name is present in sources", () => {
    const content = "أعلنت OpenAI عن GPT-6 بسعر أقل بنسبة 40% من GPT-4o، وردّت Anthropic خلال 24 ساعة.";
    const r = checkGrounding(content, sources);
    expect(r.ok).toBe(true);
    expect(r.ungroundedNumbers).toEqual([]);
    expect(r.ungroundedNames).toEqual([]);
  });

  it("matches Arabic-Indic digits against Western source digits", () => {
    const content = "انخفض السعر بنسبة ٤٠٪ وردّت الشركة خلال ٢٤ ساعة."; // 40 and 24 in Arabic-Indic
    const r = checkGrounding(content, sources);
    expect(r.ungroundedNumbers).toEqual([]);
  });

  it("flags an invented number (the '84 days' failure mode)", () => {
    const content = "انتظرت OpenAI أربعة وثمانين يوماً، أي 84 يوماً، قبل الإبلاغ.";
    const r = checkGrounding(content, sources);
    expect(r.ungroundedNumbers).toContain("84");
    expect(r.ok).toBe(false); // 84 is not in sources
  });

  it("flags an invented company/product name (trailing punctuation trimmed)", () => {
    const content = "وفق تقرير، تعاونت OpenAI مع شركة FakeCorp على نظام Zyntharex.";
    const r = checkGrounding(content, sources);
    expect(r.ungroundedNames).toEqual(expect.arrayContaining(["fakecorp", "zyntharex"]));
    expect(r.ok).toBe(false);
  });

  it("ignores single digits and 4-digit years (noise reduction)", () => {
    // "3" is a single digit (ignored); "2026" is a year (ignored) — neither fails.
    const content = "في 2026، دخلت OpenAI إلى 3 أسواق بسعر أقل 40% من GPT-4o.";
    const r = checkGrounding(content, sources);
    expect(r.ungroundedNumbers).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it("is strict by default — one invented 2-digit number fails", () => {
    const content = "ارتفع الاستخدام بنسبة 77% بحسب التقرير."; // 77 not in sources
    const r = checkGrounding(content, sources);
    expect(r.ungroundedNumbers).toEqual(["77"]);
    expect(r.ok).toBe(false);
  });

  it("can relax the tolerance explicitly", () => {
    const content = "ارتفع الاستخدام بنسبة 77% بحسب التقرير.";
    const r = checkGrounding(content, sources, { maxUngroundedNumbers: 1 });
    expect(r.ok).toBe(true);
  });
});
