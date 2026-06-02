import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

async function main() {
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // ── Queue ──────────────────────────────────────────────────────────────
  const [queueTotal, queuePending, queueProcessing, queueDone, queueFailed, queueRejected] = await Promise.all([
    p.reviewQueue.count(),
    p.reviewQueue.count({ where: { status: "pending" } }),
    p.reviewQueue.count({ where: { status: "processing" } }),
    p.reviewQueue.count({ where: { status: "done" } }),
    p.reviewQueue.count({ where: { status: "failed" } }),
    p.reviewQueue.count({ where: { status: "rejected" } }),
  ]);

  // ── Articles published ─────────────────────────────────────────────────
  const publishedLast2Days = await p.review.count({
    where: { published: true, publishedAt: { gte: twoDaysAgo } },
  });
  const publishedLast7Days = await p.review.count({
    where: { published: true, publishedAt: { gte: sevenDaysAgo } },
  });
  const totalPublished = await p.review.count({ where: { published: true } });

  // Recent articles
  const recentArticles = await p.review.findMany({
    where: { published: true, publishedAt: { gte: twoDaysAgo } },
    orderBy: { publishedAt: "desc" },
    select: { titleAr: true, slug: true, publishedAt: true, viewCount: true, category: { select: { nameAr: true } } },
  });

  // ── Social posts ───────────────────────────────────────────────────────
  const socialPosts = await p.socialPost.findMany({
    where: { createdAt: { gte: twoDaysAgo } },
    include: { review: { select: { titleAr: true } } },
    orderBy: { createdAt: "desc" },
  });

  const socialByStatus = {
    sent: socialPosts.filter(s => s.status === "sent").length,
    failed: socialPosts.filter(s => s.status === "failed").length,
    pending: socialPosts.filter(s => s.status === "pending").length,
  };

  const socialByPlatform: Record<string, { sent: number; failed: number }> = {};
  for (const post of socialPosts) {
    if (!socialByPlatform[post.platform]) socialByPlatform[post.platform] = { sent: 0, failed: 0 };
    if (post.status === "sent") socialByPlatform[post.platform].sent++;
    if (post.status === "failed") socialByPlatform[post.platform].failed++;
  }

  // ── Views ──────────────────────────────────────────────────────────────
  const topViewed = await p.review.findMany({
    where: { published: true },
    orderBy: { viewCount: "desc" },
    take: 5,
    select: { titleAr: true, slug: true, viewCount: true },
  });

  const totalViews = await p.review.aggregate({ _sum: { viewCount: true } });

  // ── Sources ────────────────────────────────────────────────────────────
  const sources = await p.source.findMany({
    where: { enabled: true },
    orderBy: { lastSyncedAt: "desc" },
    select: { name: true, lastSyncedAt: true },
    take: 5,
  });

  // ── News Items fetched ─────────────────────────────────────────────────
  const newsItemsLast2Days = await p.newsItem.count({
    where: { createdAt: { gte: twoDaysAgo } },
  });
  const newsItemsTotal = await p.newsItem.count();

  // ── Print ──────────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════════════");
  console.log("         📊 LUMIQ — STATUS REPORT");
  console.log(`         ${now.toLocaleString("ar-SA")}`);
  console.log("══════════════════════════════════════════════════\n");

  console.log("📰 ARTICLES");
  console.log(`  Total published:   ${totalPublished}`);
  console.log(`  Last 48 hours:     ${publishedLast2Days}`);
  console.log(`  Last 7 days:       ${publishedLast7Days}`);
  console.log(`  Total views:       ${totalViews._sum.viewCount ?? 0}`);

  if (recentArticles.length > 0) {
    console.log("\n  Recent (48h):");
    for (const a of recentArticles) {
      const time = a.publishedAt ? new Date(a.publishedAt).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "?";
      console.log(`    [${time}] 👁 ${a.viewCount ?? 0}  — ${a.titleAr.slice(0, 60)}`);
    }
  }

  console.log("\n👁 TOP 5 MOST VIEWED");
  for (const v of topViewed) {
    console.log(`  ${String(v.viewCount ?? 0).padStart(5)} views — ${v.titleAr.slice(0, 55)}`);
  }

  console.log("\n📬 QUEUE STATUS");
  console.log(`  Total items:   ${queueTotal}`);
  console.log(`  ⏳ Pending:    ${queuePending}`);
  console.log(`  ⚙️  Processing: ${queueProcessing}`);
  console.log(`  ✅ Done:       ${queueDone}`);
  console.log(`  ❌ Failed:     ${queueFailed}`);
  console.log(`  🚫 Rejected:   ${queueRejected}`);

  console.log("\n📡 NEWS FETCHED (48h)");
  console.log(`  New items fetched:  ${newsItemsLast2Days}`);
  console.log(`  Total in DB:       ${newsItemsTotal}`);

  console.log("\n  Last synced sources:");
  for (const s of sources) {
    const t = s.lastSyncedAt ? new Date(s.lastSyncedAt).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "never";
    console.log(`    ${t}  ${s.name}`);
  }

  console.log("\n📲 SOCIAL POSTS (48h)");
  console.log(`  Total:   ${socialPosts.length}`);
  console.log(`  ✅ Sent:    ${socialByStatus.sent}`);
  console.log(`  ❌ Failed:  ${socialByStatus.failed}`);
  console.log(`  ⏳ Pending: ${socialByStatus.pending}`);

  if (Object.keys(socialByPlatform).length > 0) {
    console.log("\n  By platform:");
    for (const [platform, stats] of Object.entries(socialByPlatform)) {
      console.log(`    ${platform.padEnd(12)} ✅ ${stats.sent}  ❌ ${stats.failed}`);
    }
  }

  if (socialPosts.filter(s => s.status === "failed").length > 0) {
    console.log("\n  ⚠️  Failed posts:");
    for (const post of socialPosts.filter(s => s.status === "failed").slice(0, 5)) {
      console.log(`    [${post.platform}] ${post.errorMsg?.slice(0, 80) ?? "unknown error"}`);
    }
  }

  console.log("\n══════════════════════════════════════════════════\n");
}

main().catch(console.error).finally(() => p.$disconnect());
