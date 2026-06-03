import { chromium, devices } from "playwright";

const iPhone = devices["iPhone 13"];

const PAGES = [
  { name: "homepage", url: "https://www.lumiq.news" },
  { name: "ai-tools", url: "https://www.lumiq.news/ai-tools" },
  { name: "prompts",  url: "https://www.lumiq.news/prompts" },
  { name: "article",  url: "https://www.lumiq.news/reviews" },
];

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ ...iPhone });
  const page = await context.newPage();

  for (const p of PAGES) {
    console.log(`\n📱 Testing: ${p.name} (${p.url})`);
    await page.goto(p.url, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);

    const hasHScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 5
    );

    const navHeight = await page.evaluate(() => {
      const h = document.querySelector("header");
      return h ? Math.round(h.getBoundingClientRect().height) : 0;
    });

    const smallTapTargets = await page.evaluate(() => {
      const els = [...document.querySelectorAll("button, a, [role='button']")];
      return els.filter(el => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && (r.height < 36 || r.width < 36);
      }).map(el => ({ tag: el.tagName, text: el.textContent?.trim().slice(0, 30), h: Math.round((el as HTMLElement).getBoundingClientRect().height), w: Math.round((el as HTMLElement).getBoundingClientRect().width) })).slice(0, 5);
    });

    const overflowEls = await page.evaluate(() => {
      return [...document.querySelectorAll("*")].filter(el => {
        const r = el.getBoundingClientRect();
        return r.right > window.innerWidth + 10 && r.width > 0;
      }).map(el => ({ tag: el.tagName, class: el.className?.toString().slice(0, 40) })).slice(0, 5);
    });

    console.log(`  Horizontal scroll: ${hasHScroll ? "❌ YES" : "✅ NO"}`);
    console.log(`  Header height: ${navHeight}px ${navHeight > 40 ? "✅" : "❌ too small"}`);
    console.log(`  Small tap targets (< 36px): ${smallTapTargets.length === 0 ? "✅ none" : `⚠️ ${smallTapTargets.length}`}`);
    if (smallTapTargets.length > 0) smallTapTargets.forEach(t => console.log(`    → ${t.tag} "${t.text}" ${t.w}x${t.h}px`));
    console.log(`  Overflow elements: ${overflowEls.length === 0 ? "✅ none" : `❌ ${overflowEls.length}`}`);
    if (overflowEls.length > 0) overflowEls.forEach(e => console.log(`    → ${e.tag} .${e.class}`));

    const ss = `d:/AIScope/scripts/mobile-${p.name}.png`;
    await page.screenshot({ path: ss, fullPage: false });
    console.log(`  Screenshot: ${ss}`);
  }

  await browser.close();
}

run().catch(console.error);
