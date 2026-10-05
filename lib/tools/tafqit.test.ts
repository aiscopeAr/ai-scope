import { describe, it, expect } from "vitest";
import { tafqit } from "./tafqit";

const pure = (n: string | number) => {
  const r = tafqit(n, { currency: "none" });
  return r.ok ? r.text : `ERR:${r.error}`;
};
const sar = (n: string | number, suffix = false) => {
  const r = tafqit(n, { currency: "SAR", chequeSuffix: suffix });
  return r.ok ? r.text : `ERR:${r.error}`;
};

describe("approved sample rows (pure numbers)", () => {
  const cases: [number, string][] = [
    [0, "صفر"],
    [1, "واحد"],
    [2, "اثنان"],
    [7, "سبعة"],
    [11, "أحد عشر"],
    [21, "واحد وعشرون"],
    [35, "خمسة وثلاثون"],
    [100, "مائة"],
    [115, "مائة وخمسة عشر"],
    [200, "مائتان"],
    [348, "ثلاثمائة وثمانية وأربعون"],
    [1000, "ألف"],
    [1250, "ألف ومائتان وخمسون"],
    [2000, "ألفان"],
    [3500, "ثلاثة آلاف وخمسمائة"],
    [21000, "واحد وعشرون ألفًا"],
    [1000000, "مليون"],
    [2500000, "مليونان وخمسمائة ألف"],
  ];
  for (const [n, expected] of cases) {
    it(`${n} → ${expected}`, () => expect(pure(n)).toBe(expected));
  }
});

describe("approved currency rows (SAR)", () => {
  it("row 19 — 1250.75 → full with gender", () => {
    expect(sar("1250.75")).toBe("ألف ومائتان وخمسون ريالًا سعوديًا وخمس وسبعون هللة");
  });
  it("row 20 — 1000 with cheque suffix", () => {
    expect(sar("1000", true)).toBe("فقط ألف ريال سعودي لا غير");
  });
});

describe("scale-rule edge cases from review", () => {
  it("103,000 → مائة وثلاثة آلاف (last two digits govern the noun)", () => {
    expect(pure(103000)).toBe("مائة وثلاثة آلاف");
  });
  it("200,000 → مائتا ألف (dual construct drops ن)", () => {
    expect(pure(200000)).toBe("مائتا ألف");
  });
  it("2,000 SAR → ألفا ريال سعودي (dual construct before currency)", () => {
    expect(sar("2000")).toBe("ألفا ريال سعودي");
  });
  it("standalone 2000 stays ألفان", () => {
    expect(pure(2000)).toBe("ألفان");
  });
});

describe("currency unit forms (SAR main)", () => {
  const cases: [number, string][] = [
    [1, "ريال سعودي واحد"],
    [2, "ريالان سعوديان"],
    [3, "ثلاثة ريالات سعودية"],
    [11, "أحد عشر ريالًا سعوديًا"],
    [100, "مائة ريال سعودي"],
  ];
  for (const [n, expected] of cases) {
    it(`${n} SAR → ${expected}`, () => expect(sar(n)).toBe(expected));
  }
});

describe("fraction forms (هللة, feminine)", () => {
  const cases: [string, string][] = [
    ["0.01", "هللة واحدة"],
    ["0.02", "هللتان"],
    ["0.03", "ثلاث هللات"],
    ["0.11", "إحدى عشرة هللة"],
    ["0.12", "اثنتا عشرة هللة"],
    ["0.75", "خمس وسبعون هللة"],
  ];
  for (const [n, expected] of cases) {
    it(`${n} SAR → ${expected}`, () => expect(sar(n)).toBe(expected));
  }
});

describe("approved cross-currency forms (locked after review)", () => {
  const t = (n: string, c: "AED" | "EGP" | "USD" | "EUR" | "ILS") => {
    const r = tafqit(n, { currency: c, chequeSuffix: false });
    return r.ok ? r.text : `ERR:${r.error}`;
  };
  it("main unit, count 3", () => {
    expect(t("3", "AED")).toBe("ثلاثة دراهم إماراتية");
    expect(t("3", "EGP")).toBe("ثلاثة جنيهات مصرية");
    expect(t("3", "USD")).toBe("ثلاثة دولارات أمريكية");
    expect(t("3", "EUR")).toBe("ثلاثة يورو");
    expect(t("3", "ILS")).toBe("ثلاثة شواكل إسرائيلية");
  });
  it("1250.75 endings", () => {
    expect(t("1250.75", "AED")).toBe("ألف ومائتان وخمسون درهمًا إماراتيًا وخمسة وسبعون فلسًا");
    expect(t("1250.75", "EGP")).toBe("ألف ومائتان وخمسون جنيهًا مصريًا وخمسة وسبعون قرشًا");
    expect(t("1250.75", "USD")).toBe("ألف ومائتان وخمسون دولارًا أمريكيًا وخمسة وسبعون سنتًا");
    expect(t("1250.75", "EUR")).toBe("ألف ومائتان وخمسون يورو وخمسة وسبعون سنتًا");
    expect(t("1250.75", "ILS")).toBe("ألف ومائتان وخمسون شيكلًا إسرائيليًا وخمس وسبعون أغورة");
  });
  it("EUR invariable across counts", () => {
    expect(t("1", "EUR")).toBe("يورو واحد");
    expect(t("2", "EUR")).toBe("اثنان يورو");
    expect(t("11", "EUR")).toBe("أحد عشر يورو");
  });
  it("fraction 3–10 forms", () => {
    expect(t("0.03", "AED")).toBe("ثلاثة فلوس");
    expect(t("0.03", "EGP")).toBe("ثلاثة قروش");
    expect(t("0.03", "USD")).toBe("ثلاثة سنتات");
    expect(t("0.03", "ILS")).toBe("ثلاث أغورات");
  });
});

describe("rounding carry", () => {
  it("999.995 SAR → ألف ريال سعودي (half up, carry into major)", () => {
    expect(sar("999.995")).toBe("ألف ريال سعودي");
  });
  it("2.994 SAR rounds down to 2.99", () => {
    expect(sar("2.994")).toBe("ريالان سعوديان وتسع وتسعون هللة");
  });
});

describe("no-currency decimals (digit-by-digit, preserve zeros)", () => {
  it("12.05 → اثنا عشر فاصلة صفر خمسة", () => {
    expect(pure("12.05")).toBe("اثنا عشر فاصلة صفر خمسة");
  });
  it("does NOT round in pure mode", () => {
    expect(pure("12.999")).toBe("اثنا عشر فاصلة تسعة تسعة تسعة");
  });
});

describe("validation & range", () => {
  it("rejects non-numeric", () => {
    expect(pure("abc")).toMatch(/^ERR:/);
  });
  it("accepts the max", () => {
    expect(tafqit("999999999999", { currency: "none" }).ok).toBe(true);
  });
  it("rejects above the max", () => {
    expect(pure("1000000000000")).toMatch(/خارج النطاق/);
  });
  it("zero currency amount", () => {
    expect(sar("0")).toBe("صفر ريال سعودي");
  });
});
