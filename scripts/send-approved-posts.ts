/**
 * Send all approved pending social posts directly (bypasses cron auth)
 * Run: npx tsx scripts/send-approved-posts.ts
 */
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.lumiq.news";

async function sendTelegram(
  text: string,
  credentials: { botToken: string; chatId: string }
): Promise<string> {
  const res = await fetch(
    `https://api.telegram.org/bot${credentials.botToken}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: credentials.chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: false,
      }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Telegram API: ${err}`);
  }
  const data = await res.json() as { result: { message_id: number } };
  return String(data.result.message_id);
}

async function main() {
  const posts = await p.socialPost.findMany({
    where: { status: "approved" },
    include: {
      account: true,
      review: { select: { slug: true, imageUrl: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 10, // max 10 at a time like cron
  });

  console.log(`\n📤 Found ${posts.length} approved posts to send\n`);

  let sent = 0, failed = 0;

  for (const post of posts) {
    const slug = post.review?.slug ?? "";
    const utmSource = post.platform === "telegram" ? "telegram" : post.platform;
    const articleUrl = `${BASE_URL}/reviews/${slug}?utm_source=${utmSource}&utm_medium=social&utm_campaign=daily_post`;

    // Strip URLs from caption, append tracked URL
    const cleanCaption = post.caption.replace(/https?:\/\/\S+/g, "").replace(/\n{3,}/g, "\n\n").trim();
    const text = `${cleanCaption}\n\n${articleUrl}`;

    try {
      const creds = JSON.parse(post.account.credentials as string) as Record<string, string>;

      if (post.platform === "telegram") {
        const msgId = await sendTelegram(text, {
          botToken: creds.botToken,
          chatId: creds.chatId,
        });
        await p.socialPost.update({
          where: { id: post.id },
          data: { status: "sent", sentAt: new Date() },
        });
        console.log(`✅ [telegram] sent msgId=${msgId} — ${post.review?.slug ?? "?"}`);
        sent++;
      } else {
        console.log(`⚠️  [${post.platform}] not implemented yet — skipping`);
      }

      // Small delay between messages
      await new Promise(r => setTimeout(r, 1500));

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await p.socialPost.update({
        where: { id: post.id },
        data: { status: "failed", errorMsg: msg },
      });
      console.log(`❌ [${post.platform}] FAILED: ${msg}`);
      failed++;
    }
  }

  console.log(`\n✅ Sent: ${sent}  ❌ Failed: ${failed}\n`);
}

main().catch(console.error).finally(() => p.$disconnect());
