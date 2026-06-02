import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

async function main() {
  const pending = await p.socialPost.findMany({
    where: { status: "pending" },
    include: { review: { select: { titleAr: true, slug: true, published: true } } },
    orderBy: { createdAt: "asc" },
  });

  console.log(`\n⏳ Pending social posts: ${pending.length}\n`);
  console.log("─".repeat(70));

  const byPlatform: Record<string, typeof pending> = {};
  for (const post of pending) {
    if (!byPlatform[post.platform]) byPlatform[post.platform] = [];
    byPlatform[post.platform].push(post);
  }

  for (const [platform, posts] of Object.entries(byPlatform)) {
    console.log(`\n📱 ${platform.toUpperCase()} — ${posts.length} pending`);
    for (const post of posts) {
      const age = Math.round((Date.now() - post.createdAt.getTime()) / 3600000);
      console.log(`  [${age}h ago] ${post.review?.titleAr?.slice(0, 55) ?? "?"}`);
      console.log(`    review published: ${post.review?.published ? "✅" : "❌"}`);
      console.log(`    scheduledFor: ${post.scheduledFor ?? "null"}`);
      console.log(`    accountId: ${post.accountId ?? "null"}`);
    }
  }

  // Check social accounts
  console.log("\n\n📋 SOCIAL ACCOUNTS in DB:");
  console.log("─".repeat(70));
  const accounts = await p.socialAccount.findMany();
  if (accounts.length === 0) {
    console.log("  ❌ NO ACCOUNTS CONFIGURED");
  } else {
    for (const acc of accounts) {
      console.log(`  ${acc.enabled ? "🟢" : "⚫"} [${acc.platform}] ${acc.name} — token: ${acc.accessToken ? "✅ set" : "❌ missing"}`);
    }
  }
}

main().catch(console.error).finally(() => p.$disconnect());
