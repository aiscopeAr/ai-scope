import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";

const prisma = new PrismaClient();

async function main() {
  const item = await prisma.articleQueue.findFirst({ where: { status: "pending" } });
  if (!item) { console.log("No pending items"); return; }
  console.log("Testing with:", item.rawTitle);
  console.log("Content length:", item.rawContent?.length);

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Return JSON only." },
        { role: "user", content: `Title: ${item.rawTitle}\nReturn: {"titleAr":"...", "slug":"test-slug"}` },
      ],
      max_tokens: 200,
    });
    console.log("OpenAI OK:", response.choices[0]?.message?.content);
  } catch (e) {
    console.error("OpenAI FAILED:", e instanceof Error ? e.message : e);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
