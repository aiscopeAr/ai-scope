import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const reset = await prisma.promptQueue.updateMany({
    where: { status: { in: ["processed", "approved"] } },
    data: { status: "pending" },
  });
  console.log("Reset to pending:", reset.count);
  await prisma.$disconnect();
}

run().catch(console.error);
