import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

async function main() {
  const all = await p.review.findMany({
    select: { id: true, slug: true, titleAr: true, published: true },
    where: { published: true },
  });

  const bad = all.filter(r =>
    r.slug === "" ||
    r.slug === "/" ||
    r.slug.startsWith("/") ||
    r.slug.endsWith("/")
  );

  console.log(`Total published: ${all.length}`);
  console.log(`Bad slugs: ${bad.length}`);
  if (bad.length > 0) console.log(JSON.stringify(bad, null, 2));

  // Also check unpublished
  const badUnpublished = await p.review.findMany({
    select: { id: true, slug: true, titleAr: true, published: true },
    where: { OR: [{ slug: "" }, { slug: "/" }] },
  });
  console.log(`\nEmpty/slash slugs (all): ${badUnpublished.length}`);
  if (badUnpublished.length > 0) console.log(JSON.stringify(badUnpublished, null, 2));
}

main().catch(console.error).finally(() => p.$disconnect());
