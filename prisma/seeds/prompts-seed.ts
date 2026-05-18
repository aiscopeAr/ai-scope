import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedPrompts() {
  // Skip if already seeded
  const existing = await prisma.promptCategory.count();
  if (existing > 0) {
    console.log("Prompt categories already seeded — skipping.");
    return;
  }

  await Promise.all([
    prisma.promptCategory.create({ data: { name: "Writing", nameAr: "كتابة", slug: "writing", icon: "✍️", description: "Content creation and writing prompts" } }),
    prisma.promptCategory.create({ data: { name: "Coding", nameAr: "برمجة", slug: "coding", icon: "💻", description: "Programming and development prompts" } }),
    prisma.promptCategory.create({ data: { name: "Marketing", nameAr: "تسويق", slug: "marketing", icon: "📢", description: "Marketing and advertising prompts" } }),
    prisma.promptCategory.create({ data: { name: "Design", nameAr: "تصميم", slug: "design", icon: "🎨", description: "Design and creative prompts" } }),
    prisma.promptCategory.create({ data: { name: "Business", nameAr: "أعمال", slug: "business", icon: "💼", description: "Business strategy and planning" } }),
    prisma.promptCategory.create({ data: { name: "Education", nameAr: "تعليم", slug: "education", icon: "📚", description: "Learning and teaching prompts" } }),
  ]);

  await Promise.all([
    prisma.aIModel.create({ data: { name: "GPT-4o", slug: "gpt-4o", icon: "🤖", description: "OpenAI GPT-4o" } }),
    prisma.aIModel.create({ data: { name: "Claude", slug: "claude", icon: "🧠", description: "Anthropic Claude" } }),
    prisma.aIModel.create({ data: { name: "Gemini", slug: "gemini", icon: "✨", description: "Google Gemini" } }),
    prisma.aIModel.create({ data: { name: "Midjourney", slug: "midjourney", icon: "🎨", description: "Midjourney AI" } }),
    prisma.aIModel.create({ data: { name: "DALL-E", slug: "dalle", icon: "🖼️", description: "OpenAI DALL-E" } }),
  ]);

  await Promise.all([
    prisma.promptSource.create({
      data: {
        name: "Awesome ChatGPT Prompts",
        type: "github",
        url: "https://github.com/f/awesome-chatgpt-prompts",
        config: { repo: "f/awesome-chatgpt-prompts", file: "prompts.csv" },
        active: true,
        priority: 10,
      },
    }),
  ]);

  console.log("✅ Prompt seed data created successfully");
}

seedPrompts()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
