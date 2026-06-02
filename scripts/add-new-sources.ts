/**
 * Add replacement sources for deleted ones
 * Run: npx tsx scripts/add-new-sources.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const NEW_SOURCES = [
  {
    name: "NVIDIA AI Blog",
    rssUrl: "https://blogs.nvidia.com/feed/",
    priority: 7,
  },
  {
    name: "Simon Willison's Weblog (AI)",
    rssUrl: "https://simonwillison.net/atom/everything/",
    priority: 6,
  },
];

async function main() {
  console.log("\n➕ Adding new sources...\n");

  for (const src of NEW_SOURCES) {
    const existing = await prisma.source.findFirst({ where: { rssUrl: src.rssUrl } });
    if (existing) {
      console.log(`⚪ Already exists: ${src.name}`);
      continue;
    }

    // Quick availability check
    try {
      const res = await fetch(src.rssUrl, {
        headers: { "User-Agent": "Lumiq/1.0 RSS Reader" },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) {
        console.log(`⚠️  Skipping ${src.name} — HTTP ${res.status}`);
        continue;
      }
      const xml = await res.text();
      const items = (xml.match(/<item[\s>]/g) ?? []).length + (xml.match(/<entry[\s>]/g) ?? []).length;

      await prisma.source.create({
        data: {
          name: src.name,
          rssUrl: src.rssUrl,
          enabled: true,
          priority: src.priority,
        },
      });
      console.log(`✅ Added: ${src.name} (${items} items found)`);
    } catch (err) {
      console.log(`❌ Failed: ${src.name} — ${err instanceof Error ? err.message : err}`);
    }
  }

  const total = await prisma.source.count();
  const enabled = await prisma.source.count({ where: { enabled: true } });
  console.log(`\n📡 Total sources: ${total} (${enabled} enabled)\n`);

  // Final list
  const all = await prisma.source.findMany({ orderBy: [{ priority: "desc" }, { name: "asc" }] });
  console.log("Current sources:");
  for (const s of all) {
    console.log(`  ${s.enabled ? "🟢" : "⚫"} [${s.priority}] ${s.name}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
