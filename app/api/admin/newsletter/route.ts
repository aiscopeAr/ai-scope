import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [subscribers, total, active, unsubscribed, fromWebsite, fromPopup] = await Promise.all([
    prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.newsletterSubscriber.count(),
    prisma.newsletterSubscriber.count({ where: { status: "active" } }),
    prisma.newsletterSubscriber.count({ where: { status: "unsubscribed" } }),
    prisma.newsletterSubscriber.count({ where: { source: "website" } }),
    prisma.newsletterSubscriber.count({ where: { source: "popup" } }),
  ]);

  return NextResponse.json({
    subscribers,
    stats: { total, active, unsubscribed, fromWebsite, fromPopup },
  });
}
