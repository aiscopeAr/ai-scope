/**
 * lib/tools/zakat.ts
 *
 * Pure Zakat (الزكاة) math. No deps, zero external data. Zakat on wealth is
 * 2.5% of the net zakatable assets a Muslim has held for one lunar year, if
 * that net reaches the niṣāb threshold. The niṣāb is the value of 85g of gold
 * (or 595g of silver); its money value depends on the current metal price, so
 * the caller supplies a gold price/gram (or the niṣāb directly) — we never
 * fetch live prices. General guidance, not a fatwa.
 */

export const ZAKAT_RATE = 0.025; // 2.5%
export const NISAB_GOLD_GRAMS = 85;
export const NISAB_SILVER_GRAMS = 595;

export interface ZakatAssets {
  cash: number; // النقد والحسابات البنكية
  gold: number; // قيمة الذهب
  silver: number; // قيمة الفضة
  investments: number; // الأسهم والاستثمارات
  trade: number; // عروض التجارة والمخزون
  debts: number; // الديون المستحقة عليك (تُطرح)
}

const n = (x: number) => (Number.isFinite(x) && x > 0 ? x : 0);

/** Net zakatable wealth: total assets minus debts, never below zero. */
export function netZakatable(a: ZakatAssets): number {
  const assets = n(a.cash) + n(a.gold) + n(a.silver) + n(a.investments) + n(a.trade);
  return Math.max(0, assets - n(a.debts));
}

/** Niṣāb in money = 85g of gold × price per gram. */
export function nisabFromGoldPrice(goldPricePerGram: number): number {
  return n(goldPricePerGram) * NISAB_GOLD_GRAMS;
}

export interface ZakatResult {
  net: number;
  nisab: number | null; // null when no gold price was given
  aboveNisab: boolean;
  due: number; // zakat owed
}

/**
 * Compute zakat. When `nisab` is provided, zakat is due only if net ≥ niṣāb.
 * When `nisab` is null (unknown), we still compute 2.5% of net and let the UI
 * remind the user to confirm they reached the niṣāb.
 */
export function computeZakat(a: ZakatAssets, nisab: number | null): ZakatResult {
  const net = netZakatable(a);
  const aboveNisab = nisab != null && nisab > 0 ? net >= nisab : net > 0;
  const due = aboveNisab ? Math.round(net * ZAKAT_RATE * 100) / 100 : 0;
  return { net, nisab: nisab != null && nisab > 0 ? nisab : null, aboveNisab, due };
}
