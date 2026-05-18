import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { scrapeAwesomePrompts } from "@/lib/prompts/scrapers/github";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prompts = await scrapeAwesomePrompts();
  let added = 0;

  for (const prompt of prompts) {
    const exists = await prisma.promptQueue.findFirst({
      where: { rawTitle: prompt.rawTitle, sourceName: prompt.sourceName },
    });
    if (!exists) {
      await prisma.promptQueue.create({ data: { ...prompt, status: "pending" } });
      added++;
    }
  }

  await prisma.promptSource.updateMany({
    where: { name: "Awesome ChatGPT Prompts" },
    data: { lastFetch: new Date() },
  });

  return NextResponse.json({ ok: true, scraped: prompts.length, added });
}
