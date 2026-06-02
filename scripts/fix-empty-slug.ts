import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[؀-ۿ\s]+/g, (match) => {
      // transliterate common Arabic words to English for slug
      return match.trim().replace(/\s+/g, "-");
    })
    // fallback: use timestamp-based slug
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  const review = await p.review.findUnique({
    where: { id: "cmpr3np2d0004lh04enjbw7ns" },
    select: { id: true, slug: true, titleAr: true },
  });
  console.log("Found:", review);

  // Generate a proper slug from title
  // Title: كيف يمكن للحوكمة أن تضمن نشر الذكاء الاصطناعي بأمان؟
  const newSlug = "ai-governance-safe-deployment";

  // Check it doesn't already exist
  const existing = await p.review.findUnique({ where: { slug: newSlug } });
  if (existing) {
    console.log(`Slug "${newSlug}" already taken, using timestamp variant`);
    const ts = Date.now().toString().slice(-6);
    const altSlug = `${newSlug}-${ts}`;
    await p.review.update({ where: { id: review!.id }, data: { slug: altSlug } });
    console.log(`✅ Updated slug to: ${altSlug}`);
  } else {
    await p.review.update({ where: { id: review!.id }, data: { slug: newSlug } });
    console.log(`✅ Updated slug to: ${newSlug}`);
  }
}

main().catch(console.error).finally(() => p.$disconnect());
