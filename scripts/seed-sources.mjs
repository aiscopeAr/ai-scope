/**
 * seed-sources.mjs
 * ─────────────────────────────────────────────────────────────
 * Seeds AI news RSS sources into the DB via Prisma directly.
 *
 * Run:
 *   node --loader ts-node/esm scripts/seed-sources.mjs
 * or via tsx:
 *   npx tsx scripts/seed-sources.mjs
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SOURCES = [
  // ── TIER 1: Company Blogs (priority 10) ──────────────────────
  {
    name: "OpenAI Blog",
    rssUrl: "https://openai.com/news/rss.xml",
    website: "https://openai.com",
    priority: 10,
    enabled: true,
  },
  {
    name: "Google DeepMind Blog",
    rssUrl: "https://deepmind.google/blog/rss.xml",
    website: "https://deepmind.google",
    priority: 10,
    enabled: true,
  },
  {
    name: "Google AI Blog",
    rssUrl: "https://blog.research.google/feeds/posts/default?alt=rss",
    website: "https://blog.research.google",
    priority: 9,
    enabled: true,
  },
  {
    name: "Meta AI Research",
    rssUrl: "https://research.facebook.com/feed/",
    website: "https://ai.meta.com",
    priority: 9,
    enabled: true,
  },
  {
    name: "Microsoft AI Blog",
    rssUrl: "https://blogs.microsoft.com/ai/feed/",
    website: "https://blogs.microsoft.com/ai",
    priority: 9,
    enabled: true,
  },
  {
    name: "Hugging Face Blog",
    rssUrl: "https://huggingface.co/blog/feed.xml",
    website: "https://huggingface.co/blog",
    priority: 9,
    enabled: true,
  },
  {
    name: "Mistral AI News",
    rssUrl: "https://mistral.ai/news/rss.xml",
    website: "https://mistral.ai",
    priority: 8,
    enabled: true,
  },

  // ── TIER 2: Top AI News Sites (priority 9-10) ─────────────────
  {
    name: "TechCrunch — AI",
    rssUrl: "https://techcrunch.com/category/artificial-intelligence/feed/",
    website: "https://techcrunch.com/category/artificial-intelligence/",
    priority: 10,
    enabled: true,
  },
  {
    name: "MIT Technology Review",
    rssUrl: "https://www.technologyreview.com/feed/",
    website: "https://www.technologyreview.com",
    priority: 10,
    enabled: true,
  },
  {
    name: "VentureBeat — AI",
    rssUrl: "https://venturebeat.com/category/ai/feed/",
    website: "https://venturebeat.com/category/ai/",
    priority: 9,
    enabled: true,
  },
  {
    name: "The Verge — AI",
    rssUrl: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
    website: "https://www.theverge.com/ai-artificial-intelligence",
    priority: 9,
    enabled: true,
  },
  {
    name: "Wired — AI",
    rssUrl: "https://www.wired.com/feed/category/artificial-intelligence/rss",
    website: "https://www.wired.com/category/artificial-intelligence/",
    priority: 9,
    enabled: true,
  },
  {
    name: "Ars Technica",
    rssUrl: "https://feeds.arstechnica.com/arstechnica/index",
    website: "https://arstechnica.com",
    priority: 8,
    enabled: true,
  },
  {
    name: "MarkTechPost",
    rssUrl: "https://www.marktechpost.com/feed/",
    website: "https://www.marktechpost.com",
    priority: 8,
    enabled: true,
  },
  {
    name: "AI Business",
    rssUrl: "https://aibusiness.com/rss.xml",
    website: "https://aibusiness.com",
    priority: 8,
    enabled: true,
  },
  {
    name: "The Gradient",
    rssUrl: "https://thegradient.pub/rss/",
    website: "https://thegradient.pub",
    priority: 8,
    enabled: true,
  },

  // ── TIER 3: Research & Technical (priority 8-9) ───────────────
  {
    name: "arXiv — Artificial Intelligence",
    rssUrl: "https://rss.arxiv.org/rss/cs.AI",
    website: "https://arxiv.org/list/cs.AI/recent",
    priority: 8,
    enabled: true,
  },
  {
    name: "arXiv — Machine Learning",
    rssUrl: "https://rss.arxiv.org/rss/cs.LG",
    website: "https://arxiv.org/list/cs.LG/recent",
    priority: 8,
    enabled: true,
  },
  {
    name: "Towards Data Science",
    rssUrl: "https://towardsdatascience.com/feed",
    website: "https://towardsdatascience.com",
    priority: 7,
    enabled: true,
  },

  // ── TIER 4: Newsletters & Aggregators (priority 8-9) ──────────
  {
    name: "Import AI (Jack Clark)",
    rssUrl: "https://importai.substack.com/feed",
    website: "https://importai.substack.com",
    priority: 9,
    enabled: true,
  },
  {
    name: "Last Week in AI",
    rssUrl: "https://lastweekin.ai/feed",
    website: "https://lastweekin.ai",
    priority: 8,
    enabled: true,
  },
  {
    name: "The Batch — DeepLearning.AI",
    rssUrl: "https://www.deeplearning.ai/the-batch/feed/",
    website: "https://www.deeplearning.ai/the-batch/",
    priority: 9,
    enabled: true,
  },
  {
    name: "AI Supremacy (Substack)",
    rssUrl: "https://aisupremacy.substack.com/feed",
    website: "https://aisupremacy.substack.com",
    priority: 7,
    enabled: true,
  },
  {
    name: "Ben's Bites (AI Newsletter)",
    rssUrl: "https://bensbites.beehiiv.com/feed",
    website: "https://bensbites.com",
    priority: 8,
    enabled: true,
  },

  // ── TIER 5: Arabic & Regional Tech News (priority 7-8) ────────
  {
    name: "عالم التقنية",
    rssUrl: "https://www.3alam.net/feed",
    website: "https://www.3alam.net",
    priority: 7,
    enabled: true,
  },
  {
    name: "موقع عرب هاردوير",
    rssUrl: "https://www.arabhdware.net/feed",
    website: "https://www.arabhdware.net",
    priority: 6,
    enabled: true,
  },
  {
    name: "تك عربي",
    rssUrl: "https://techarabi.com/feed",
    website: "https://techarabi.com",
    priority: 7,
    enabled: true,
  },
  {
    name: "Al Arabiya Tech",
    rssUrl: "https://english.alarabiya.net/tools/mrss",
    website: "https://english.alarabiya.net",
    priority: 7,
    enabled: true,
  },
  {
    name: "Arab News — Technology",
    rssUrl: "https://www.arabnews.com/taxonomy/term/10251/feed",
    website: "https://www.arabnews.com/taxonomy/term/10251",
    priority: 7,
    enabled: true,
  },
];

async function main() {
  console.log(`\n🌱 Seeding ${SOURCES.length} AI news sources...\n`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const source of SOURCES) {
    try {
      // Check if source already exists by rssUrl
      const existing = await prisma.source.findFirst({
        where: { rssUrl: source.rssUrl },
      });

      if (existing) {
        console.log(`  ⏭  Skipped (exists): ${source.name}`);
        skipped++;
        continue;
      }

      await prisma.source.create({ data: source });
      console.log(`  ✅ Created: ${source.name}`);
      created++;
    } catch (err) {
      console.error(`  ❌ Failed: ${source.name} — ${err.message}`);
      failed++;
    }
  }

  console.log(`
────────────────────────────────
✅ Created : ${created}
⏭  Skipped : ${skipped}
❌ Failed  : ${failed}
Total      : ${SOURCES.length}
────────────────────────────────
  `);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
