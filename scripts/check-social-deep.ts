import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

async function main() {
  // Check account credentials
  const accounts = await p.socialAccount.findMany();
  console.log("\n🔑 ACCOUNT CREDENTIALS:");
  for (const acc of accounts) {
    console.log(`\n  Platform: ${acc.platform}`);
    console.log(`  Name: ${acc.name}`);
    console.log(`  Enabled: ${acc.enabled}`);
    console.log(`  accessToken: ${acc.accessToken ? `"${acc.accessToken.slice(0,20)}..."` : "null/empty"}`);
    try {
      const creds = JSON.parse(acc.credentials as string ?? "{}");
      console.log(`  credentials (parsed): ${JSON.stringify(creds)}`);
    } catch {
      console.log(`  credentials (raw): ${acc.credentials}`);
    }
  }

  // Check status distribution of ALL social posts
  console.log("\n\n📊 ALL SOCIAL POSTS BY STATUS:");
  const statuses = await p.socialPost.groupBy({
    by: ["status", "platform"],
    _count: true,
    orderBy: { _count: { status: "desc" } },
  });
  for (const s of statuses) {
    console.log(`  [${s.platform}] ${s.status}: ${s._count}`);
  }

  // Check the one sent post
  const sent = await p.socialPost.findFirst({
    where: { status: "sent" },
    include: { account: true },
  });
  if (sent) {
    console.log("\n\n✅ LAST SENT POST (for reference):");
    console.log(`  Platform: ${sent.platform}`);
    console.log(`  sentAt: ${sent.sentAt}`);
    console.log(`  accountId: ${sent.accountId}`);
    try {
      const creds = JSON.parse(sent.account.credentials as string ?? "{}");
      console.log(`  account credentials keys: ${Object.keys(creds).join(", ")}`);
    } catch {
      console.log(`  account credentials raw: ${sent.account.credentials}`);
    }
  }

  // Check vercel.json cron config
  console.log("\n\n⏰ CHECKING CRON FLOW:");
  console.log("  social-queue cron filters WHERE status = 'approved'");
  console.log("  But new posts are created with status = 'pending'");
  console.log("  → Posts never transition pending → approved → sent automatically");

  // Check if there's a field errorMsg vs errorMessage
  const anyPost = await p.socialPost.findFirst();
  if (anyPost) {
    console.log(`\n  Post fields: ${Object.keys(anyPost).join(", ")}`);
  }
}

main().catch(console.error).finally(() => p.$disconnect());
