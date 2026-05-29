import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ALLOWED = ["fetch-news", "cluster-news", "process-review", "publish-review", "social-queue"];

export async function POST(req: NextRequest) {
  // רק admin מחובר יכול להפעיל
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { cronKey } = await req.json();
  if (!ALLOWED.includes(cronKey)) {
    return NextResponse.json({ error: "Invalid cron key" }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.lumiq.news";
  const secret = process.env.CRON_SECRET;

  const headers: Record<string, string> = {};
  if (secret) headers["authorization"] = `Bearer ${secret}`;

  try {
    const res = await fetch(`${baseUrl}/api/cron/${cronKey}`, { headers });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
