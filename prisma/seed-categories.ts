import { prisma } from "../lib/db";

const categories = [
  { name: "AI Models",      nameAr: "نماذج الذكاء الاصطناعي", slug: "ai-models" },
  { name: "AI Tools",       nameAr: "أدوات الذكاء الاصطناعي", slug: "ai-tools" },
  { name: "AI Companies",   nameAr: "شركات الذكاء الاصطناعي", slug: "ai-companies" },
  { name: "AI Policy",      nameAr: "سياسات وتشريعات الذكاء الاصطناعي", slug: "ai-policy" },
  { name: "Research",       nameAr: "أبحاث ودراسات", slug: "research" },
  { name: "Applications",   nameAr: "تطبيقات وحالات استخدام", slug: "applications" },
  { name: "Infrastructure", nameAr: "بنية تحتية وأجهزة", slug: "infrastructure" },
  { name: "Safety",         nameAr: "أمان وأخلاقيات", slug: "safety" },
];

async function main() {
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { nameAr: cat.nameAr, name: cat.name },
      create: cat,
    });
    console.log(`✓ ${cat.nameAr}`);
  }
  console.log("\nDone — seeded", categories.length, "categories.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
