# تفقيط — Number-to-Arabic-Words Tool — Design Spec

**Status:** DRAFT for review (grammar needs native-speaker validation before coding)
**Date:** 2026-10-05
**Owner:** hannaobead · **Drafted by:** Claude

The tool converts a number into its written Arabic form (تفقيط), e.g. for invoices
and cheques where the amount must appear both in digits and in words. 100% client-side,
zero cost, same architecture as the other `/tools`.

> **Why this spec first:** Arabic number grammar (gender agreement, تمييز case endings,
> dual forms, scale pluralization) is intricate. The sample outputs below are my **best-effort
> draft** — please correct any that are wrong so the implementation matches correct Arabic.

---

## 1. Open decisions (I need your call) 🟡

### D1 — Grammar depth: full i'raab vs. simplified?
Real tafqit tools split into two schools:
- **(a) Full grammatical** — with case endings/tanwin: *"واحدٌ وعشرون ريالًا"*, *"خمسة وسبعون ألفًا"*.
- **(b) Simplified standard** — consistent base forms, no case tanwin on the scale word: *"واحد وعشرون ريال"*, *"خمسة وسبعون ألف"*.
Most **practical** invoice/cheque tools use **(b)** (cleaner, fewer edge errors).
**My recommendation: (b) simplified.** → **Your call?**

### D2 — Currency support
Proposed default list (toggle on the tool):
| code | main unit | fraction (×100) |
|---|---|---|
| none | — (pure number) | — |
| SAR | ريال سعودي | هللة |
| AED | درهم إماراتي | فلس |
| EGP | جنيه مصري | قرش |
| USD | دولار أمريكي | سنت |
| (add?) | | |
**Your call: which currencies? add دينار / دولار-عام / يورو?**

### D3 — Spelling: مئة vs مائة
Both correct. **My recommendation: مائة** (more traditional/formal, common on cheques). **Your call?**

### D4 — Cheque suffix "فقط … لا غير"
Common on official cheques: *"فقط ألف ومئتان وخمسون ريالًا لا غير"*.
**My recommendation: add as an optional toggle (on by default).** **Your call?**

### D5 — Range & decimals
- Integers up to **trillions** (تريليون)? or stop at **milliards/مليار**? (Recommend: up to مليار, covers all real money.)
- Decimals: support exactly **2 places** as the fraction unit (هللة/فلس…), rounding beyond. OK?

---

## 2. Vocabulary (my draft — please verify)

**Ones (masculine form, standalone):**
| 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| صفر | واحد | اثنان | ثلاثة | أربعة | خمسة | ستة | سبعة | ثمانية | تسعة | عشرة |

**Teens 11–19:** أحد عشر، اثنا عشر، ثلاثة عشر، أربعة عشر، خمسة عشر، ستة عشر، سبعة عشر، ثمانية عشر، تسعة عشر

**Tens:** عشرون، ثلاثون، أربعون، خمسون، ستون، سبعون، ثمانون، تسعون

**Hundreds:** مائة، مائتان، ثلاثمائة، أربعمائة، خمسمائة، ستمائة، سبعمائة، ثمانمائة، تسعمائة

**Scales:**
| | 1 | 2 | 3–10 | 11+ |
|---|---|---|---|---|
| thousand | ألف | ألفان | آلاف (ثلاثة آلاف) | ألف (أحد عشر ألف) |
| million | مليون | مليونان | ملايين | مليون |
| milliard | مليار | ملياران | مليارات | مليار |

**Connector:** و (و before every group and before tens, e.g. *واحد وعشرون*).

---

## 3. Sample outputs (PLEASE CORRECT) ✍️

Simplified form (D1-b), currency = none unless noted:

| # | Number | My draft output |
|---|---|---|
| 1 | 0 | صفر |
| 2 | 1 | واحد |
| 3 | 2 | اثنان |
| 4 | 7 | سبعة |
| 5 | 11 | أحد عشر |
| 6 | 21 | واحد وعشرون |
| 7 | 35 | خمسة وثلاثون |
| 8 | 100 | مائة |
| 9 | 115 | مائة وخمسة عشر |
| 10 | 200 | مائتان |
| 11 | 348 | ثلاثمائة وثمانية وأربعون |
| 12 | 1000 | ألف |
| 13 | 1250 | ألف ومائتان وخمسون |
| 14 | 2000 | ألفان |
| 15 | 3500 | ثلاثة آلاف وخمسمائة |
| 16 | 21000 | واحد وعشرون ألف |
| 17 | 1000000 | مليون |
| 18 | 2500000 | مليونان وخمسمائة ألف |
| 19 | 1250.75 SAR | ألف ومائتان وخمسون ريالًا وخمسة وسبعون هللة |
| 20 | 1000 SAR +suffix | فقط ألف ريال لا غير |

**For each row:** is it correct? if not, what's the right form?

---

## 4. Algorithm (implementation plan, after grammar is locked)

- `lib/tools/tafqit.ts` — pure, no deps:
  - `numberToArabicWords(n: number, opts): string`
  - triplet decomposition (groups of 3 digits) → each group 0–999 → join with scale word + connector.
  - scale pluralization rule by group value (1 / 2 / 3–10 / 11+).
  - currency layer: main unit + fraction, optional "فقط … لا غير".
- `lib/tools/tafqit.test.ts` — one assertion per approved sample row above (locks the grammar so it can't regress).
- UI `components/tools/Tafqit.tsx` — number input + currency dropdown + suffix toggle + live output + copy.
- Page + FAQ + registry entry (slug `tafqit` / `number-to-words`, category "حسابات" or "النصوص").
- SEO: titles around "تفقيط الأرقام"، "تحويل الرقم إلى كتابة"، "كتابة المبلغ بالحروف".

---

## 5. Process

1. **You review §1 decisions + §3 samples**, correct the Arabic.
2. I lock the corrected samples as unit tests → implement → all tests green.
3. I verify live in-browser, you do a final read of the live outputs.
4. Ship as its own PR (like #5, #6).

**→ Please mark up §1 (D1–D5) and §3 (any wrong rows). That's everything I need to build it correctly.**
