import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const position = searchParams.get("position");

  const ads = await prisma.adSlot.findMany({
    where: {
      enabled: true,
      ...(position ? { position } : {}),
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(ads);
}
