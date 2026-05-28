/**
 * Author Memory — שכבת הלמידה של זיד ולינה
 *
 * כל כתבה שמתפרסמת מחלצת ממנה insights אוטומטיים:
 * - נושאי מומחיות (מה הכותב כיסה הכי הרבה)
 * - עמדות עבר (מה הכותב אמר על נושא X)
 * - העדפות מקורות (אילו מקורות שימשו הכי הרבה)
 * - הערות סגנון (מה עבד טוב לפי views)
 *
 * ה-memory הזה מוזרק ל-context לפני כל כתיבה חדשה,
 * ומשתפר אוטומטית ככל שהכותב מפרסם יותר.
 */

import { prisma } from "@/lib/db";

export type MemoryType = "topic_expertise" | "past_stance" | "source_preference" | "style_note";

// ─── שמירת זיכרון ─────────────────────────────────────────────────────────────

export async function saveMemory(
  authorSlug: string,
  type: MemoryType,
  content: string,
  sourceId?: string,
  weight = 1.0,
) {
  // בדוק אם כבר קיים זיכרון דומה (כדי לא להכפיל)
  const existing = await prisma.authorMemory.findFirst({
    where: { authorSlug, type, content: { contains: content.slice(0, 50) } },
  });

  if (existing) {
    // הגבר את המשקל במקום ליצור כפול
    await prisma.authorMemory.update({
      where: { id: existing.id },
      data: { weight: Math.min(5.0, existing.weight + 0.5), updatedAt: new Date() },
    });
    return existing.id;
  }

  const mem = await prisma.authorMemory.create({
    data: { authorSlug, type, content, sourceId, weight },
    select: { id: true },
  });
  return mem.id;
}

// ─── חילוץ זיכרון מכתבה שהתפרסמה ─────────────────────────────────────────────

export async function extractMemoryFromReview(reviewId: string) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      authorSlug: true,
      titleAr: true,
      tags: true,
      keywords: true,
      sources: true,
      viewCount: true,
      category: { select: { slug: true, nameAr: true } },
    },
  });

  if (!review) return;

  const memories: Array<{ type: MemoryType; content: string; weight: number }> = [];

  // 1. מומחיות נושאית — מכל תג ומילת מפתח
  for (const tag of review.tags.slice(0, 5)) {
    memories.push({
      type: "topic_expertise",
      content: `كتب عن "${tag}" في سياق: ${review.titleAr.slice(0, 60)}`,
      weight: 1.0,
    });
  }

  // 2. עמדת עבר — מהכותרת + קטגוריה
  memories.push({
    type: "past_stance",
    content: `غطّى موضوع "${review.category.nameAr}": ${review.titleAr}`,
    weight: 1.0,
  });

  // 3. העדפות מקורות
  try {
    const sources = JSON.parse(review.sources as string) as Array<{ name: string; url: string }>;
    const sourceNames = [...new Set(sources.map((s) => s.name))];
    if (sourceNames.length > 0) {
      memories.push({
        type: "source_preference",
        content: `استخدم المصادر: ${sourceNames.join("، ")}`,
        weight: 0.8,
      });
    }
  } catch {
    // sources parsing failed — skip
  }

  // 4. הערת סגנון — אם views גבוהים, שמור כ-positive example
  if (review.viewCount > 100) {
    memories.push({
      type: "style_note",
      content: `تقرير ناجح (${review.viewCount} مشاهدة): "${review.titleAr.slice(0, 70)}" — هذا العنوان والنهج حقق تفاعلاً عالياً`,
      weight: Math.min(3.0, 1.0 + review.viewCount / 200),
    });
  }

  // שמור הכל
  for (const mem of memories) {
    await saveMemory(review.authorSlug, mem.type, mem.content, review.id, mem.weight);
  }
}

// ─── שליפת זיכרון לפני כתיבה ──────────────────────────────────────────────────

export async function getAuthorMemoryBlock(
  authorSlug: string,
  topic: string,
): Promise<string> {
  // שלוף top memories לפי weight — מוגבל ל-8 כדי לא להאריך את ה-prompt
  const memories = await prisma.authorMemory.findMany({
    where: { authorSlug },
    orderBy: { weight: "desc" },
    take: 8,
  });

  if (memories.length === 0) return "";

  const byType: Record<string, string[]> = {};
  for (const m of memories) {
    if (!byType[m.type]) byType[m.type] = [];
    byType[m.type].push(m.content);
  }

  const lines: string[] = ["\n\n─── ذاكرة الكاتب المتراكمة ───"];

  if (byType.topic_expertise?.length) {
    lines.push(`📚 مجالات الخبرة:\n${byType.topic_expertise.slice(0, 3).map((c) => `  • ${c}`).join("\n")}`);
  }
  if (byType.past_stance?.length) {
    lines.push(`📰 تغطيات سابقة:\n${byType.past_stance.slice(0, 3).map((c) => `  • ${c}`).join("\n")}`);
  }
  if (byType.source_preference?.length) {
    lines.push(`🔗 مصادر مفضّلة:\n${byType.source_preference.slice(0, 2).map((c) => `  • ${c}`).join("\n")}`);
  }
  if (byType.style_note?.length) {
    lines.push(`✨ أنماط ناجحة:\n${byType.style_note.slice(0, 2).map((c) => `  • ${c}`).join("\n")}`);
  }

  lines.push("─────────────────────────────────\n");

  return lines.join("\n");
}

// ─── חיזוק ידני מה-Admin ──────────────────────────────────────────────────────

export async function boostMemory(memoryId: string, boost = 1.0) {
  await prisma.authorMemory.update({
    where: { id: memoryId },
    data: { weight: { increment: boost } },
  });
}

export async function getAuthorMemories(authorSlug: string) {
  return prisma.authorMemory.findMany({
    where: { authorSlug },
    orderBy: { weight: "desc" },
  });
}

export async function deleteMemory(id: string) {
  await prisma.authorMemory.delete({ where: { id } });
}
