import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // הוסף ChatGPT
  const existing = await prisma.aITool.findUnique({ where: { slug: "chatgpt" } });
  if (!existing) {
    await prisma.aITool.create({
      data: {
        name: "ChatGPT",
        slug: "chatgpt",
        tagline: "أشهر مساعد ذكاء اصطناعي في العالم من OpenAI",
        descriptionAr:
          "ChatGPT من OpenAI هو الأكثر استخداماً عالمياً. يجيب على الأسئلة، يكتب، يبرمج، ويحلل — كل ذلك في محادثة طبيعية.",
        website: "https://chat.openai.com",
        logoUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg",
        toolCategory: "llm",
        category: "llm",
        pricing: "freemium",
        monthlyPrice: 20,
        pros: ["الأشهر والأوسع دعماً", "يبحث في الإنترنت", "يحلل صور وملفات", "متجر GPTs ضخم"],
        cons: ["أحياناً يخترع معلومات", "الخصوصية مثيرة للقلق"],
        useCases: ["الكتابة والتلخيص", "البرمجة", "التعليم", "تحليل البيانات"],
        arabicSupport: true,
        hasApi: true,
        tags: ["LLM", "OpenAI", "دردشة", "GPT-4"],
        featured: true,
        published: true,
        seoTitle: "ChatGPT — أشهر مساعد ذكاء اصطناعي في العالم",
        seoDescription: "ChatGPT من OpenAI: المساعد الذكي الأكثر استخداماً عالمياً للكتابة والبرمجة والتحليل.",
      },
    });
    console.log("✅ ChatGPT أُضيف");
  } else {
    console.log("⏭️  ChatGPT موجود بالفعل");
  }

  // أضف ChatGPT للمقارنة
  const comp = await prisma.comparison.findUnique({
    where: { slug: "chatgpt-vs-claude" },
    include: { sides: true },
  });
  const chatgpt = await prisma.aITool.findUnique({ where: { slug: "chatgpt" } });

  if (comp && chatgpt) {
    const alreadyAdded = comp.sides.find((s) => s.toolId === chatgpt.id);
    if (!alreadyAdded) {
      await prisma.comparisonSide.create({
        data: {
          comparisonId: comp.id,
          toolId: chatgpt.id,
          score: 90,
          bestFor: "الاستخدام اليومي المتنوع والمهام السريعة",
          notes: "الأشهر والأوسع انتشاراً مع مزايا بحث الإنترنت",
          strengths: ["يبحث في الإنترنت", "يحلل صور وملفات", "متجر GPTs ضخم", "واجهة سهلة"],
          weaknesses: ["أحياناً يخترع معلومات", "الخصوصية مثيرة للقلق"],
        },
      });
      console.log("✅ ChatGPT أُضيف للمقارنة ChatGPT vs Claude");
    } else {
      console.log("⏭️  ChatGPT موجود في المقارنة");
    }
  }

  // اعرض المقارنات الحالية
  const allComps = await prisma.comparison.findMany({
    include: { sides: { include: { tool: { select: { name: true } } } } },
  });
  console.log("\n📊 المقارنات الحالية:");
  allComps.forEach((c) => {
    const toolNames = c.sides.map((s) => s.tool.name).join(" vs ");
    console.log(`   ${c.published ? "✅" : "📝"} ${c.title}`);
    console.log(`      الأدوات: ${toolNames}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
