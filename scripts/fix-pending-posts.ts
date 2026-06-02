import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

async function main() {
  // Move all stuck pending → approved so next cron run sends them
  const result = await p.socialPost.updateMany({
    where: { status: "pending" },
    data: { status: "approved" },
  });
  console.log(`✅ Moved ${result.count} pending posts → approved`);
  console.log("   Next cron run will send them to Telegram.");
}

main().catch(console.error).finally(() => p.$disconnect());
