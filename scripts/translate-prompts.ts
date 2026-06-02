import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function translatePrompt(body: string, titleAr: string): Promise<string | null> {
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `أنت مترجم متخصص في ترجمة وتكييف الـ prompts للذكاء الاصطناعي من الإنجليزية إلى العربية.
قواعد:
- لا تترجم ترجمة حرفية — كيّف الأسلوب ليناسب العربية
- احتفظ بنفس الهيكل والتعليمات
- الأقواس المربعة [كذا] تبقى كما هي
- اكتب فقط نص البرومبت المترجم، بدون أي إضافات`,
      },
      {
        role: "user",
        content: `ترجم وكيّف هذا الـ prompt للعربية:\n\n${body}`,
      },
    ],
  });
  return res.choices[0].message.content?.trim() ?? null;
}

async function main() {
  // Only translate prompts that don't have Arabic yet
  const prompts = await prisma.prompt.findMany({
    where: { bodyAr: null },
    select: { id: true, title: true, titleAr: true, body: true },
  });

  console.log(`Found ${prompts.length} prompts without Arabic translation`);

  for (const p of prompts) {
    try {
      process.stdout.write(`Translating: ${p.title}... `);
      const bodyAr = await translatePrompt(p.body, p.titleAr);
      if (bodyAr) {
        await prisma.prompt.update({ where: { id: p.id }, data: { bodyAr } });
        console.log("✅");
      } else {
        console.log("⚠️ empty result");
      }
    } catch (err) {
      console.log(`❌ ${err}`);
    }
  }

  console.log("Done.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
