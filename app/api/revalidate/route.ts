import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { CACHE_TAGS, revalidateNow } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const path = searchParams.get("path");
  const tag = searchParams.get("tag");

  if (secret !== process.env.CRON_SECRET && process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  // Tag flush (e.g. ?tag=prompts) — invalidates every page cached under that
  // cache tag at once (hub + all detail pages). Accepts a CACHE_TAGS key
  // ("prompts") or its raw value ("prompts"/"ai-tools").
  if (tag) {
    const resolved = (CACHE_TAGS as Record<string, string>)[tag] ?? tag;
    const allowed = Object.values(CACHE_TAGS) as string[];
    if (!allowed.includes(resolved)) {
      return NextResponse.json({ error: "unknown tag", allowed }, { status: 400 });
    }
    revalidateNow(resolved);
    return NextResponse.json({ revalidated: true, tag: resolved });
  }

  if (!path) {
    return NextResponse.json({ error: "path or tag required" }, { status: 400 });
  }

  revalidatePath(path);
  return NextResponse.json({ revalidated: true, path });
}
