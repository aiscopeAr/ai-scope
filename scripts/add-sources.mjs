import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const newSources = [
  { name: "The Verge AI", website: "https://theverge.com", rssUrl: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", priority: 9, enabled: true },
  { name: "Wired AI", website: "https://wired.com", rssUrl: "https://www.wired.com/feed/tag/ai/latest/rss", priority: 8, enabled: true },
  { name: "Ars Technica", website: "https://arstechnica.com", rssUrl: "https://feeds.arstechnica.com/arstechnica/index", priority: 7, enabled: true },
  { name: "AI News", website: "https://artificialintelligence-news.com", rssUrl: "https://artificialintelligence-news.com/feed/", priority: 9, enabled: true },
  { name: "Import AI", website: "https://importai.substack.com", rssUrl: "https://importai.substack.com/feed", priority: 8, enabled: true },
];

let added = 0;
for (const s of newSources) {
  const existing = await prisma.source.findFirst({ where: { rssUrl: s.rssUrl } });
  if (!existing) {
    await prisma.source.create({ data: s });
    added++;
    console.log("Added:", s.name);
  } else {
    console.log("Already exists:", s.name);
  }
}
console.log(`Done. Added ${added} new sources.`);
await prisma.$disconnect();
