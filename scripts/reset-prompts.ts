import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const deleted = await prisma.prompt.deleteMany({});
  console.log("Deleted prompts:", deleted.count);

  const reset = await prisma.promptQueue.updateMany({
    where: { status: "approved" },
    data: { status: "processed" },
  });
  console.log("Reset queue items to 'processed':", reset.count);

  await prisma.$disconnect();
}

run().catch(console.error);
