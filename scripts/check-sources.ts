/**
 * Checks all RSS sources in the DB and reports which are working / broken
 * Run: npx tsx scripts/check-sources.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TIMEOUT_MS = 12_000;

type Result = {
  name: string;
  url: string;
  status: "ok" | "error";
  httpStatus?: number;
  itemCount?: number;
  error?: string;
  lastSyncedAt?: Date | null;
};

async function checkFeed(url: string): Promise<{ httpStatus: number; itemCount: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Lumiq/1.0 RSS Checker" },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const xml = await res.text();
    // Count items/entries roughly
    const items = (xml.match(/<item[\s>]/g) ?? []).length;
    const entries = (xml.match(/<entry[\s>]/g) ?? []).length;

    return { httpStatus: res.status, itemCount: Math.max(items, entries) };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const sources = await prisma.source.findMany({
    orderBy: [{ enabled: "desc" }, { priority: "desc" }, { name: "asc" }],
  });

  console.log(`\n📡 Checking ${sources.length} sources...\n`);
  console.log("─".repeat(80));

  const results: Result[] = [];

  for (const src of sources) {
    process.stdout.write(`  ${src.enabled ? "🟢" : "⚫"} ${src.name.padEnd(35)} `);
    const start = Date.now();

    try {
      const { httpStatus, itemCount } = await checkFeed(src.rssUrl);
      const elapsed = Date.now() - start;
      console.log(`✅  ${itemCount} items  (${elapsed}ms)`);
      results.push({ name: src.name, url: src.rssUrl, status: "ok", httpStatus, itemCount, lastSyncedAt: src.lastSyncedAt });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const elapsed = Date.now() - start;
      const isTimeout = msg.includes("abort") || msg.includes("AbortError") || elapsed >= TIMEOUT_MS - 500;
      const label = isTimeout ? "⏱ TIMEOUT" : `❌ ${msg}`;
      console.log(label);
      results.push({ name: src.name, url: src.rssUrl, status: "error", error: isTimeout ? "Timeout" : msg, lastSyncedAt: src.lastSyncedAt });
    }
  }

  console.log("\n" + "─".repeat(80));

  const ok      = results.filter(r => r.status === "ok");
  const broken  = results.filter(r => r.status === "error");
  const disabled = sources.filter(s => !s.enabled);

  console.log(`\n✅ Working:  ${ok.length}`);
  console.log(`❌ Broken:   ${broken.length}`);
  console.log(`⚫ Disabled: ${disabled.length}`);

  if (broken.length > 0) {
    console.log("\n🔴 BROKEN SOURCES:\n");
    for (const r of broken) {
      console.log(`  • ${r.name}`);
      console.log(`    URL:   ${r.url}`);
      console.log(`    Error: ${r.error}`);
      if (r.lastSyncedAt) console.log(`    Last synced: ${r.lastSyncedAt.toISOString()}`);
      console.log();
    }
  }

  if (ok.length > 0) {
    console.log("🟢 WORKING SOURCES:\n");
    for (const r of ok) {
      console.log(`  • ${r.name} — ${r.itemCount} items`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
