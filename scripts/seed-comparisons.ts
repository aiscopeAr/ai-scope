/**
 * scripts/seed-comparisons.ts
 * מכניס מקרות AI לדוגמה לבסיס הנתונים
 * הרצה: npx tsx scripts/seed-comparisons.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n🚀 מכניס מקרות...\n");

  // שלוף tool IDs
  const tools = await prisma.aITool.findMany({
    select: { id: true, slug: true, name: true },
  });

  const bySlug = Object.fromEntries(tools.map((t) => [t.slug, t]));

  const comparisons = [
    // ─────────────────────────────────────────────
    {
      slug: "chatgpt-vs-claude",
      title: "ChatGPT vs Claude — أيهما أفضل في 2025؟",
      summaryAr:
        "مقارنة شاملة بين أشهر نموذجين في عالم الذكاء الاصطناعي: ChatGPT من OpenAI وClaude من Anthropic. نستعرض الفروقات في الأداء والأمان والسعر وحالات الاستخدام المثالية لكل منهما.",
      verdict:
        "ChatGPT أفضل للاستخدام اليومي والمهام المتنوعة، بينما يتفوق Claude في تحليل المستندات الطويلة والكتابة الأكاديمية المعمّقة.",
      criteria: ["جودة الإجابات", "الأمان والصدق", "السعر", "سهولة الاستخدام", "دعم العربية"],
      published: true,
      sides: [
        {
          slug: "claude-anthropic",
          score: 88,
          bestFor: "تحليل المستندات والكتابة الأكاديمية",
          notes: "يتفوق في السياقات الطويلة والتحليل العميق",
          strengths: ["سياق 200K رمز", "كتابة إبداعية ممتازة", "أكثر أماناً وصدقاً"],
          weaknesses: ["لا يتصل بالإنترنت", "دعم عربية متوسط", "أبطأ أحياناً"],
        },
      ],
    },
    // ─────────────────────────────────────────────
    {
      slug: "midjourney-vs-dalle3",
      title: "Midjourney vs DALL-E 3 — أيهما يُنتج صوراً أجمل؟",
      summaryAr:
        "مقارنة مباشرة بين أقوى أداتين لتوليد الصور بالذكاء الاصطناعي. Midjourney شهير بجماليته الفنية الفريدة، بينما يتميز DALL-E 3 بدقة فهم الوصف النصي وسهولة الاستخدام.",
      verdict:
        "Midjourney للجودة الفنية الاستثنائية، DALL-E 3 للسهولة والدمج مع ChatGPT وحين تحتاج دقة عالية في تنفيذ الوصف.",
      criteria: ["جودة الصورة", "دقة الوصف", "سهولة الاستخدام", "السعر", "الأسلوب الفني"],
      published: true,
      sides: [
        {
          slug: "midjourney",
          score: 92,
          bestFor: "الفنانين والمصممين الباحثين عن جودة بصرية استثنائية",
          notes: "الأفضل فنياً على الإطلاق لكن يتطلب تعلم الأوامر",
          strengths: ["جودة فنية لا مثيل لها", "أسلوب بصري فريد", "مجتمع ضخم"],
          weaknesses: ["يعمل فقط عبر Discord", "لا نسخة مجانية", "أوامر تحتاج تعلم"],
        },
        {
          slug: "dall-e-3",
          score: 84,
          bestFor: "من يريد سهولة الاستخدام والدمج مع ChatGPT",
          notes: "مدمج في ChatGPT مما يجعله الأسهل استخداماً",
          strengths: ["مدمج في ChatGPT", "فهم ممتاز للوصف", "يكتب نصاً داخل الصور"],
          weaknesses: ["أسلوب فني أقل تميزاً", "حدود على الصور المجانية"],
        },
      ],
    },
    // ─────────────────────────────────────────────
    {
      slug: "github-copilot-vs-cursor",
      title: "GitHub Copilot vs Cursor — أي مساعد برمجة تختار؟",
      summaryAr:
        "مقارنة بين أكثر أداتين شعبية لمساعدة المطورين بالذكاء الاصطناعي. Copilot إضافة تعمل داخل محررك الحالي، بينما Cursor محرر كامل يضع AI في قلب تجربة البرمجة.",
      verdict:
        "Copilot إذا لم تريد تغيير محررك وتحتاج إكمالاً تلقائياً فقط. Cursor إذا تريد تجربة AI كاملة ومتكاملة وتعديل ملفات متعددة بأمر واحد.",
      criteria: ["عمق تكامل AI", "سهولة البداية", "السعر", "الأداء", "فهم المشروع"],
      published: true,
      sides: [
        {
          slug: "github-copilot",
          score: 85,
          bestFor: "المطورين الذين يريدون إكمالاً تلقائياً بدون تغيير محررهم",
          notes: "الخيار الأسلم لمن يستخدم VS Code أو JetBrains",
          strengths: ["مدمج في VS Code بسلاسة", "يدعم كل لغات البرمجة", "Copilot Chat قوي"],
          weaknesses: ["لا نسخة مجانية كاملة", "أحياناً يقترح كود خاطئ"],
        },
        {
          slug: "cursor",
          score: 91,
          bestFor: "المطورين الذين يريدون أقصى استفادة من AI في البرمجة",
          notes: "الأقوى للمشاريع الكبيرة التي تحتاج تعديل ملفات متعددة",
          strengths: ["Composer يعدل ملفات متعددة", "يفهم المشروع كاملاً", "نسخة مجانية معقولة"],
          weaknesses: ["تثبيت محرر جديد", "يستهلك رسائل AI بسرعة"],
        },
      ],
    },
    // ─────────────────────────────────────────────
    {
      slug: "perplexity-vs-you-com",
      title: "Perplexity AI vs You.com — أفضل محرك بحث ذكي؟",
      summaryAr:
        "كلاهما يجمع بين البحث على الإنترنت والذكاء الاصطناعي، لكنهما يختلفان في التركيز. Perplexity يُقدم إجابات موثوقة بمصادر واضحة، بينما يركز You.com على الخصوصية وتعدد النماذج.",
      verdict:
        "Perplexity للباحثين الذين يريدون إجابات موثوقة بمصادر. You.com لمن يهمه الخصوصية ويريد الوصول لنماذج متعددة في مكان واحد.",
      criteria: ["دقة المعلومات", "المصادر والتوثيق", "الخصوصية", "السعر", "سهولة الاستخدام"],
      published: true,
      sides: [
        {
          slug: "perplexity-ai",
          score: 89,
          bestFor: "البحث الأكاديمي والتحقق من المعلومات الحديثة",
          notes: "الأفضل حين تحتاج إجابات موثوقة مع مصادر قابلة للتحقق",
          strengths: ["مصادر موثوقة مع كل إجابة", "بيانات حية من الإنترنت", "واجهة نظيفة وسريعة"],
          weaknesses: ["دعم العربية متوسط", "النسخة المجانية محدودة"],
        },
        {
          slug: "you-com",
          score: 78,
          bestFor: "من يريد خصوصية كاملة ونماذج AI متعددة",
          notes: "بديل ممتاز لـ Google مع خصوصية وذكاء اصطناعي مدمج",
          strengths: ["خصوصية تامة بدون تتبع", "نماذج AI متعددة في مكان واحد", "مجاني ومفيد"],
          weaknesses: ["نتائج بحث أقل دقة أحياناً", "دعم العربية محدود"],
        },
      ],
    },
  ];

  let added = 0;
  let skipped = 0;

  for (const comp of comparisons) {
    const existing = await prisma.comparison.findUnique({ where: { slug: comp.slug } });
    if (existing) {
      console.log(`  ⏭️  موجود: ${comp.title}`);
      skipped++;
      continue;
    }

    // بنِ ال sides
    const sidesData = comp.sides
      .map((s) => {
        const tool = bySlug[s.slug];
        if (!tool) {
          console.warn(`  ⚠️  كلي غير موجود: ${s.slug}`);
          return null;
        }
        return {
          toolId: tool.id,
          score: s.score ?? null,
          bestFor: s.bestFor ?? null,
          notes: s.notes ?? null,
          strengths: s.strengths ?? [],
          weaknesses: s.weaknesses ?? [],
        };
      })
      .filter(Boolean) as {
        toolId: string; score: number | null; bestFor: string | null;
        notes: string | null; strengths: string[]; weaknesses: string[];
      }[];

    if (sidesData.length < 1) {
      console.log(`  ⚠️  דילגתי (אין כלים תקינים): ${comp.title}`);
      skipped++;
      continue;
    }

    await prisma.comparison.create({
      data: {
        slug: comp.slug,
        title: comp.title,
        summaryAr: comp.summaryAr,
        verdict: comp.verdict ?? null,
        criteria: comp.criteria,
        published: comp.published,
        sides: { create: sidesData },
      },
    });

    console.log(`  ✅ נוסף: ${comp.title} (${sidesData.length} כלים)`);
    added++;
  }

  console.log(`\n📊 תוצאה:`);
  console.log(`   ✅ נוסף: ${added}`);
  console.log(`   ⏭️  קיים: ${skipped}`);
  console.log(`\n🎉 נכנס ל /compare לראות!\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
