import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const total = await prisma.article.count({ where: { published: true } });
  const noImage = await prisma.article.count({ where: { published: true, imageUrl: null } });
  const withImage = await prisma.article.count({ where: { published: true, imageUrl: { not: null } } });

  const noImageSample = await prisma.article.findMany({
    where: { published: true, imageUrl: null },
    take: 5,
    orderBy: { createdAt: "desc" },
    select: { id: true, slug: true, titleAr: true, createdAt: true },
  });

  const withImageSample = await prisma.article.findMany({
    where: { published: true, imageUrl: { not: null } },
    take: 2,
    select: { id: true, imageUrl: true },
  });

  console.log({ total, noImage, withImage });
  console.log("No-image sample:", noImageSample);
  console.log("With-image sample:", withImageSample);
  await prisma.$disconnect();
}

main().catch(console.error);
