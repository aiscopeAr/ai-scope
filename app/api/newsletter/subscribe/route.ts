import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email, source = "website" } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "البريد الإلكتروني مطلوب" }, { status: 400 });
    }

    const normalized = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalized)) {
      return NextResponse.json({ error: "البريد الإلكتروني غير صحيح" }, { status: 400 });
    }

    // Upsert — if already exists and unsubscribed, re-activate
    await prisma.newsletterSubscriber.upsert({
      where: { email: normalized },
      create: { email: normalized, source, status: "active" },
      update: { status: "active", updatedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[newsletter/subscribe]", err);
    return NextResponse.json({ error: "حدث خطأ، حاول مرة أخرى" }, { status: 500 });
  }
}
