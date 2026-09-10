/**
 * lib/editorial/plan-to-prompt.ts
 *
 * Editorial V2-A3 — pure translation of a VALIDATED EditorialPlan into writer
 * directives + a full plan-driven user prompt.
 *
 * This module is pure and side-effect-free: no I/O, no Prisma, no OpenAI, no
 * imports from review-openai (keeps the dependency direction review-openai →
 * plan-to-prompt, never the reverse). It is only ever called with a plan that
 * has already passed validateEditorialPlan() (the planner guarantees this, and
 * the route only uses non-fallback success plans), so it does NOT re-validate.
 *
 * Hard contract (mirrors the A3 spec):
 *  - Sections come from the plan, in the plan's exact order — nothing else.
 *  - The legacy skeleton (السياق/التفاصيل/التحليل/المقارنة/التداعيات) is never
 *    injected here; if such a heading appears it can only be because it was in a
 *    valid plan that passed isLegacySkeleton (which rejects ≥4 of the 5 stems).
 *  - FAQ / comparison / MENA instructions are emitted ONLY when the plan enables
 *    them, and carry the plan's own reason/target.
 *  - Depth is expressed as GUIDANCE, never a minimum word quota.
 *  - Explicit integrity bans: no invented facts/numbers/quotes, no first-hand
 *    testing/usage, no sections beyond the plan, no padding.
 */

import type { EditorialPlan, Depth } from "./plan-types";

const MAX_SOURCE_CHARS = 2000;

/** Human-readable, guidance-only depth ranges (NOT quotas). */
const DEPTH_GUIDANCE: Record<Depth, string> = {
  breaking: "نحو 300–550 كلمة تقريباً (استرشادي)",
  standard: "نحو 600–1000 كلمة تقريباً (استرشادي)",
  deep: "نحو 1100–1800+ كلمة تقريباً (استرشادي)",
};

/**
 * Build the plan directives block: EditorialPlan → writer directives (Arabic).
 * Pure. This is the core A3 function — fully testable without sources.
 */
export function buildPlanDirectives(plan: EditorialPlan): string {
  const lines: string[] = [];

  lines.push("─── الخطة التحريرية (التزم بها حرفياً) ───");
  lines.push(`الحدث المركزي: ${plan.centralEvent}`);
  lines.push(`الأطروحة التحريرية: ${plan.editorialThesis}`);
  lines.push(`قيمة القارئ: ${plan.readerValue}`);
  lines.push(`نوع القصة: ${plan.storyType}`);
  lines.push(`العدسة التحريرية (الكاتب): ${plan.authorLens}`);
  lines.push(`الزاوية الأساسية: ${plan.primaryAngle}${plan.secondaryAngle ? ` — زاوية ثانوية: ${plan.secondaryAngle}` : ""}`);
  lines.push(`استراتيجية الافتتاح: ${plan.openingStrategy}`);
  if (plan.headlineStrategy && plan.headlineStrategy.trim()) {
    lines.push(`توجيه العنوان: ${plan.headlineStrategy.trim()}`);
  }
  lines.push(`العمق المستهدف: ${DEPTH_GUIDANCE[plan.depth]} — هذا توجيه استرشادي وليس حداً أدنى؛ لا تُطِل لبلوغ عدد كلمات.`);
  if (plan.depthDowngradedReason && plan.depthDowngradedReason.trim()) {
    lines.push(`سبب خفض العمق: ${plan.depthDowngradedReason.trim()} — اكتب بما تدعمه الأدلة فقط.`);
  }

  // Sections — exact order, exact working titles, nothing else.
  lines.push("");
  lines.push("الأقسام المطلوبة (بهذا الترتيب الحرفي، وبهذه العناوين كـ H2 عربية — لا تُضِف ولا تحذف ولا تُعِد الترتيب):");
  plan.sections.forEach((s, i) => {
    lines.push(`${i + 1}. ## ${s.workingTitle}`);
    lines.push(`   - الغرض: ${s.purpose}`);
    if (Array.isArray(s.questionsToAnswer) && s.questionsToAnswer.length > 0) {
      lines.push(`   - أسئلة يجيب عنها القسم: ${s.questionsToAnswer.join(" / ")}`);
    }
    if (Array.isArray(s.evidenceNeeded) && s.evidenceNeeded.length > 0) {
      lines.push(`   - أدلة مطلوبة (من المصادر فقط): ${s.evidenceNeeded.join(" / ")}`);
    }
  });

  // Conditional: FAQ
  lines.push("");
  if (plan.includeFaq && Array.isArray(plan.faqIntent) && plan.faqIntent.length > 0) {
    lines.push(`الأسئلة الشائعة (FAQ): مطلوبة. غطِّ نيّات الأسئلة التالية فقط: ${plan.faqIntent.join(" / ")}.`);
  } else {
    lines.push("الأسئلة الشائعة (FAQ): غير مطلوبة — أعِد \"faq\": [] فارغة ولا تُنشئ قسم أسئلة شائعة.");
  }

  // Conditional: comparison
  if (plan.includeComparison && plan.comparisonTarget && plan.comparisonTarget.trim()) {
    lines.push(`المقارنة: مطلوبة، وفقط مع: ${plan.comparisonTarget.trim()}. لا تقارن بأي طرف آخر.`);
  } else {
    lines.push("المقارنة: غير مطلوبة — لا تُنشئ قسم مقارنة ولا تقارن بمنتج/جهة أخرى.");
  }

  // Conditional: MENA / Arab-reader relevance
  if (plan.includeMena && plan.menaReason && plan.menaReason.trim()) {
    lines.push(`الصلة بالمنطقة العربية/الشرق الأوسط: مطلوبة، ومبنية على هذا الدليل المحدد فقط: ${plan.menaReason.trim()}.`);
  } else {
    lines.push("الصلة بالمنطقة العربية/الشرق الأوسط: غير مطلوبة — لا تُضِف فقرة \"ماذا يعني هذا للمستخدم العربي\" ولا أي زاوية إقليمية عامة.");
  }

  // Uncertainties — only when present
  const material = plan.uncertainties?.filter((u) => u && u.note?.trim()) ?? [];
  if (material.length > 0) {
    lines.push("");
    lines.push("مواطن عدم اليقين (اذكرها بوضوح حيث تناسب، دون مبالغة):");
    material.forEach((u) => {
      lines.push(`   - [${u.kind}${u.material ? " — جوهري" : ""}] ${u.note.trim()}`);
    });
  }

  // Evidence requirements — only when present
  if (Array.isArray(plan.evidenceRequirements) && plan.evidenceRequirements.length > 0) {
    lines.push("");
    lines.push(`متطلبات الأدلة: ${plan.evidenceRequirements.join(" / ")}.`);
  }

  return lines.join("\n");
}

/** Integrity rules block — constant, always emitted on the plan path. */
export function buildIntegrityRules(): string {
  return [
    "─── قواعد النزاهة (إلزامية) ───",
    "- لا تختلق أي حقيقة غير موجودة في المصادر.",
    "- لا تخترع أرقاماً أو نسباً أو معايير مرجعية (benchmarks) غير واردة في المصادر.",
    "- لا تخترع اقتباسات أو تصريحات.",
    "- لا تدّعِ ولا تلمّح إلى أن لوميك جرّبت أو استخدمت أو اشتركت أو قاست أو التقطت لقطات شاشة لأي منتج.",
    "- ميّز بين الحقيقة (من المصادر)، وادعاء الجهة/الشركة (انسبه صراحةً: \"تقول الشركة…\"/\"وفق المصدر…\")، والتحليل (رأيك التحليلي)، وما يبقى مجهولاً (سمِّه ولا تملأه).",
    "- لا تُنشئ أي قسم غير مذكور في الخطة، ولا تُعِد إنتاج القالب القديم (السياق/التفاصيل/التحليل/المقارنة/التداعيات).",
    "- العمق توجيه استرشادي؛ لا تحشُ نصاً لبلوغ عدد كلمات.",
  ].join("\n");
}

function formatSources(
  sources: Array<{ title: string; content: string; url: string; name: string }>,
): string {
  return sources
    .map((s, i) => {
      const body = s.content.length > MAX_SOURCE_CHARS ? s.content.slice(0, MAX_SOURCE_CHARS) + "…" : s.content;
      return `## مصدر ${i + 1}: ${s.name}\nالعنوان: ${s.title}\nURL: ${s.url}\n\n${body}`;
    })
    .join("\n\n---\n\n");
}

/** JSON output schema for the plan path — SAME keys as the V1 ReviewDraft so the
 *  rest of the pipeline (markReviewProcessed) consumes it unchanged. */
function jsonSchemaBlock(): string {
  return `أعد JSON فقط (بدون markdown، بدون backticks):
{
  "titleAr": "عنوان تحليلي يعكس الأطروحة وأقوى دليل (أقل من 90 حرفاً)",
  "summaryAr": "3 جمل تضع القارئ في قلب الأهمية الحقيقية",
  "contentAr": "التقرير الكامل بتنسيق Markdown — بأقسام الخطة وعناوينها فقط، بحسب العمق الاسترشادي",
  "tags": ["وسم1", "وسم2", "وسم3"],
  "keywords": ["مصطلح تقني 1", "مصطلح 2", "مصطلح 3"],
  "seoTitle": "عنوان SEO (50-60 حرف)",
  "seoDescription": "وصف SEO يحفّز النقر (150-160 حرف)",
  "isAiRelated": true,
  "suggestedCategory": "ai-models | research | companies | tools | tools-analysis | productivity | policy | tutorials",
  "slug": "english-slug-max-6-words",
  "featuredImagePrompt": "Vivid English scene description for image generation (max 20 words)",
  "faq": [],
  "imageAlt": "وصف دقيق للصورة المقترحة"
}`;
}

/**
 * Assemble the full plan-driven user prompt (sources + memory + directives +
 * integrity + JSON schema). Pure. Used by review-openai.writeReview() only when
 * a validated non-fallback plan is available.
 */
export function buildPlanDrivenUserPrompt(
  sources: Array<{ title: string; content: string; url: string; name: string }>,
  memoryBlock: string,
  plan: EditorialPlan,
): string {
  return `إليك ${sources.length} مصدر حول نفس الموضوع، مع خطة تحريرية مُلزِمة. مهمتك: اكتب تقريراً عربياً أصيلاً يتبع الخطة حرفياً — لا تلخيصاً، بل تحليلاً حقيقياً بصوت الكاتب.${memoryBlock}

─── المصادر ───
${formatSources(sources)}
───────────────

${buildPlanDirectives(plan)}

${buildIntegrityRules()}

تعليمات العنوان: استخدم الأطروحة وأقوى دليل/رقم/اسم لصياغة عنوان تحليلي؛ تجنّب صيغة السؤال "هل/كيف" ما لم تكن استراتيجية الافتتاح تقتضيها، وتجنّب المبالغة أو اليقين غير المدعوم.

${jsonSchemaBlock()}`.trim();
}
