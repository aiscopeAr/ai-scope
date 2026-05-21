import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import OpenAI from "openai";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user?.role !== "admin") return null;
  return session;
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    topKeywords: { keyword: string; count: number }[];
    uncoveredKeywords: { keyword: string; count: number }[];
    categoryCoverage: { nameAr: string; slug: string; articleCount: number }[];
    overallScore: number;
  };

  const { topKeywords, uncoveredKeywords, categoryCoverage, overallScore } = body;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OPENAI_API_KEY not set" }, { status: 500 });

  const client = new OpenAI({ apiKey });

  const prompt = `أنت خبير SEO متخصص في المواقع العربية لمجال الذكاء الاصطناعي والتقنية.

بناءً على بيانات الموقع التالية، قدم تحليلاً وتوصيات SEO عملية باللغة العربية:

**نقاط SEO الإجمالية:** ${overallScore}/100

**أبرز الكلمات المفتاحية المستخدمة (Top ${topKeywords.length}):**
${topKeywords.map((k) => `- "${k.keyword}" (${k.count} مرة)`).join("\n")}

**كلمات مفتاحية شائعة غير مغطاة بتوكن (${uncoveredKeywords.length}):**
${uncoveredKeywords.map((k) => `- "${k.keyword}" (${k.count} بحث)`).join("\n")}

**تغطية التصنيفات:**
${categoryCoverage.map((c) => `- ${c.nameAr}: ${c.articleCount} مقال`).join("\n")}

أعد JSON فقط بهذا الشكل بدون markdown:
{
  "summary": "تقييم موجز لوضع SEO الحالي (2-3 جمل)",
  "strengths": ["نقطة قوة 1", "نقطة قوة 2", "نقطة قوة 3"],
  "gaps": ["فجوة 1", "فجوة 2", "فجوة 3"],
  "recommendations": [
    { "title": "عنوان التوصية", "description": "وصف تفصيلي وخطوات عملية", "priority": "high" },
    { "title": "عنوان التوصية", "description": "وصف تفصيلي", "priority": "medium" },
    { "title": "عنوان التوصية", "description": "وصف تفصيلي", "priority": "low" }
  ],
  "contentIdeas": [
    { "topic": "موضوع مقترح بالعربية", "keywords": ["كلمة1", "كلمة2"], "reason": "سبب الأهمية" },
    { "topic": "موضوع مقترح ثانٍ", "keywords": ["كلمة1", "كلمة2"], "reason": "سبب" },
    { "topic": "موضوع مقترح ثالث", "keywords": ["كلمة1", "كلمة2"], "reason": "سبب" },
    { "topic": "موضوع مقترح رابع", "keywords": ["كلمة1", "كلمة2"], "reason": "سبب" },
    { "topic": "موضوع مقترح خامس", "keywords": ["كلمة1", "كلمة2"], "reason": "سبب" }
  ]
}`;

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.5,
    max_tokens: 2000,
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  const jsonText = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

  try {
    const result = JSON.parse(jsonText);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response", raw }, { status: 500 });
  }
}
