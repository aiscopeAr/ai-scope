import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const secret = process.env.CRON_SECRET;

  const res = await fetch(`${baseUrl}/api/cron/weekly-report`, {
    headers: secret ? { authorization: `Bearer ${secret}` } : {},
  });

  const data = await res.json();
  return NextResponse.json(data);
}
