import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  const sides = await p.comparisonSide.findMany({
    select: { id: true, score: true, comparison: { select: { title: true } } }
  });
  sides.forEach(s => console.log(`score=${s.score}  →  ${s.comparison.title}`));
}
main().finally(() => p.$disconnect());
