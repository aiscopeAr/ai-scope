import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const accounts = await prisma.socialAccount.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, platform: true, name: true, enabled: true, createdAt: true },
  });
  return NextResponse.json(accounts);
}

export async function POST(request: Request) {
  const body = await request.json() as { platform: string; name: string; credentials: Record<string, string> };

  if (!body.platform || !body.name) {
    return NextResponse.json({ error: "platform and name are required" }, { status: 400 });
  }

  const account = await prisma.socialAccount.create({
    data: {
      platform: body.platform,
      name: body.name,
      credentials: JSON.stringify(body.credentials ?? {}),
      enabled: false,
    },
    select: { id: true, platform: true, name: true, enabled: true, createdAt: true },
  });

  return NextResponse.json(account, { status: 201 });
}
