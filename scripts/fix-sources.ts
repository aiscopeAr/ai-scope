/**
 * Fix broken / duplicate sources in DB
 * Run: npx tsx scripts/fix-sources.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n🔧 Fixing sources...\n");

  // ── 1. DELETE broken sources that have no valid RSS ──────────────────────
  const toDelete = [
    "https://www.deeplearning.ai/the-batch/feed/",   // 404
    "https://bensbites.beehiiv.com/feed",            // 404 + Cloudflare blocked
    "https://mistral.ai/news/rss.xml",               // 404
    "https://english.alarabiya.net/tools/mrss",      // 403
    "https://www.arabnews.com/taxonomy/term/10251/feed", // 403
  ];

  for (const url of toDelete) {
    const res = await prisma.source.deleteMany({ where: { rssUrl: url } });
    if (res.count > 0) console.log(`🗑  Deleted: ${url}`);
    else console.log(`⚪ Not found: ${url}`);
  }

  // ── 2. FIX arXiv — the feed URL works but rss.ts filters out items with
  //    description < 400 chars. arXiv abstracts are short. Update the URLs
  //    to the export API which includes full abstracts, and lower priority
  //    so they don't flood the queue. ──────────────────────────────────────
  const arxivAI = await prisma.source.findFirst({
    where: { rssUrl: { contains: "arxiv.org" }, name: { contains: "Artificial" } },
  });
  const arxivML = await prisma.source.findFirst({
    where: { rssUrl: { contains: "arxiv.org" }, name: { contains: "Machine" } },
  });

  if (arxivAI) {
    await prisma.source.update({
      where: { id: arxivAI.id },
      data: { rssUrl: "https://rss.arxiv.org/rss/cs.AI", priority: 1 },
    });
    console.log(`✅ Fixed arXiv AI → rss.arxiv.org/rss/cs.AI`);
  }
  if (arxivML) {
    await prisma.source.update({
      where: { id: arxivML.id },
      data: { rssUrl: "https://rss.arxiv.org/rss/cs.LG", priority: 1 },
    });
    console.log(`✅ Fixed arXiv ML → rss.arxiv.org/rss/cs.LG`);
  }

  // ── 3. REMOVE DUPLICATES — keep highest priority, delete the rest ────────
  // MIT Technology Review
  const mits = await prisma.source.findMany({
    where: { name: "MIT Technology Review" },
    orderBy: { priority: "desc" },
  });
  if (mits.length > 1) {
    for (const dup of mits.slice(1)) {
      await prisma.source.delete({ where: { id: dup.id } });
      console.log(`🗑  Removed duplicate MIT Technology Review (id=${dup.id})`);
    }
  }

  // Wired AI — both "Wired — AI" and "Wired AI"
  const wireds = await prisma.source.findMany({
    where: { name: { contains: "Wired" } },
    orderBy: { priority: "desc" },
  });
  if (wireds.length > 1) {
    for (const dup of wireds.slice(1)) {
      await prisma.source.delete({ where: { id: dup.id } });
      console.log(`🗑  Removed duplicate Wired source: "${dup.name}" (id=${dup.id})`);
    }
  }

  // ── 4. ADD replacement for Ben's Bites — use their public newsletter page feed
  //    (Beehiiv blocks curl but the Lumiq server might get through with different UA)
  //    Add Morning Brew AI instead which has a clean RSS ───────────────────
  const replacements = [
    {
      name: "TLDR AI Newsletter",
      rssUrl: "https://tldr.tech/ai/rss",
      category: "AI Newsletter",
      priority: 7,
    },
    {
      name: "Anthropic Blog",
      rssUrl: "https://www.anthropic.com/rss.xml",
      category: "AI Research",
      priority: 8,
    },
  ];

  for (const src of replacements) {
    const existing = await prisma.source.findFirst({ where: { rssUrl: src.rssUrl } });
    if (existing) {
      console.log(`⚪ Already exists: ${src.name}`);
      continue;
    }
    // Quick check
    try {
      const res = await fetch(src.rssUrl, {
        headers: { "User-Agent": "Lumiq/1.0 RSS Reader" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        console.log(`⚠️  Skipping ${src.name} — HTTP ${res.status}`);
        continue;
      }
      await prisma.source.create({
        data: {
          name: src.name,
          rssUrl: src.rssUrl,
          enabled: true,
          priority: src.priority,
        },
      });
      console.log(`➕ Added: ${src.name}`);
    } catch (err) {
      console.log(`⚠️  Skipping ${src.name} — ${err instanceof Error ? err.message : err}`);
    }
  }

  // ── 5. Final count ────────────────────────────────────────────────────────
  const total = await prisma.source.count();
  const enabled = await prisma.source.count({ where: { enabled: true } });
  console.log(`\n✅ Done. Total sources: ${total} (${enabled} enabled)\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
