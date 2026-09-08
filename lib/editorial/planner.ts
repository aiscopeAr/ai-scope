/**
 * lib/editorial/planner.ts
 *
 * Editorial V2-A — the lightweight Editorial Planner (ONE extra gpt-4o-mini
 * structured call) plus a deterministic story-type hint, a conservative
 * fallback, and shadow-diagnostics helpers.
 *
 * SHADOW-ONLY in A1/A2: this produces an EditorialPlan that is validated and
 * logged but NEVER consumed by the writer and NEVER persisted to the DB. It
 * does not change the main gpt-4o writer, buildUserPrompt, or any published
 * output. It performs NO Prisma query and NO DB write — it operates only on
 * the source data process-review has already loaded in memory.
 */

import OpenAI from "openai";
import type { AuthorSlug } from "@/lib/authors";
import {
  type EditorialPlan,
  type StoryType,
  type Depth,
  validateEditorialPlan,
  isLegacySkeleton,
} from "@/lib/editorial/plan-types";

export type PlannerSource = { title: string; content: string; url: string; name: string };

export type PlannerStatus = "success" | "retry_success" | "fallback" | "failed_nonblocking";

export interface PlannerOutcome {
  status: PlannerStatus;
  plan: EditorialPlan;
  hint: StoryType;
  fallbackUsed: boolean;
  fallbackReason?: string;
  latencyMs?: number;
}

/** Injectable completion seam — production uses OpenAI; tests inject a fake. */
export type CreateCompletion = (args: { system: string; user: string }) => Promise<string>;

// ─── Deterministic story-type hint (hybrid: seeds the AI, drives fallback) ───

/** A cheap keyword hint. NOT authoritative — the planner may override it, and
 *  it is the safety net when the planner fails. Purpose-built for story TYPE
 *  (distinct from the category heuristic in review-openai.ts, which is left
 *  untouched by design). */
export function deterministicStoryTypeHint(topic: string, sources: PlannerSource[]): StoryType {
  const hay = [topic, ...sources.map((s) => `${s.title} ${s.name}`)].join(" ").toLowerCase();
  const has = (re: RegExp) => re.test(hay);

  if (has(/\b(paper|arxiv|study|preprint|researchers?|university|lab)\b|دراسة|بحث|ورقة بحثية/)) return "RESEARCH_PAPER";
  if (has(/\b(law|regulation|regulat|policy|\beu\b|\bact\b|\bban\b|court|lawsuit|gdpr|antitrust|sanction)\b|تشريع|قانون|تنظيم|محكمة|دعوى/)) return "POLICY_REGULATION";
  if (has(/\b(launch|launches|release|releases|unveil|introduc|announc|rolls? out|available|pricing|price|now available)\b|تطلق|تكشف|تُطلق|إطلاق|إصدار|السعر|متاح/)) return "PRODUCT_LAUNCH";
  if (has(/\b(funding|raise[sd]?|acqui|acquisition|partnership|deal|invest|valuation|ipo|merger|round)\b|تمويل|استحواذ|شراكة|صفقة|استثمار/)) return "COMPANY_BUSINESS";
  if (has(/\b(how to|what is|guide|tutorial|explainer|beginner|step.by.step)\b|دليل|شرح|كيف\s|للمبتدئين|خطوة بخطوة/)) return "EXPLAINER";
  return "STANDARD_NEWS";
}

// ─── Prompt ──────────────────────────────────────────────────────────────────

const MAX_SNIPPET = 300;

export function buildPlannerSystemPrompt(): string {
  return `أنت "مخطِّط تحريري" لموقع Lumiq. مهمتك أن تُنتج خطة تحريرية (PLAN) لمقال واحد — لا أن تكتب المقال.

قواعد صارمة:
- نوع القصة (storyType) يوجّه التفكير التحريري، لا يفرض عناوين ثابتة.
- لا يوجد قالب H2 ثابت. عدد الأقسام يتراوح بين 2 و7 حسب القصة والأدلة.
- أسماء الأقسام يجب أن تكون خاصة بهذه القصة تحديداً، بالعربية، ولكل قسم غرض واضح.
- لا تُنشئ قسماً بلا سبب مدعوم بدليل من المصادر.
- ممنوع منعاً باتاً إعادة إنتاج القالب القديم: (السياق / التفاصيل / التحليل / المقارنة / التداعيات).
- FAQ اختياري: فعّله فقط عند وجود أسئلة بحث حقيقية (سعر، توفر، توافق، طرح، طريقة استخدام).
- المقارنة اختيارية: فعّلها فقط عند وجود مرجع/منافس محدد يُسمّى في comparisonTarget.
- زاوية الشرق الأوسط اختيارية ومبنية على دليل محدد (دعم العربية، توفر إقليمي، تسعير، تنظيم…) يُذكر في menaReason — لا فقرة عامة.
- عدم اليقين: سجّله؛ اجعله material فقط إن كان جوهرياً.
- العمق (depth) مبني على الأدلة: لا تختر "deep" ما لم تدعمه مصادر كافية. لا تحشُ لبلوغ عدد كلمات.
- ممنوع تماماً افتراض أن Lumiq جرّبت/استخدمت/اشتركت/قاست/التقطت لقطات شاشة لأي منتج. لا تفترض تجربة مباشرة إطلاقاً.
- أنت تُنتج الخطة فقط، لا نص المقال.

أعد JSON فقط (بدون markdown/backticks) بهذه البنية:
{
 "storyType":"BREAKING_NEWS|STANDARD_NEWS|DEEP_ANALYSIS|PRODUCT_LAUNCH|COMPANY_BUSINESS|POLICY_REGULATION|RESEARCH_PAPER|EXPLAINER",
 "depth":"breaking|standard|deep",
 "centralEvent":"الحدث المركزي الواحد",
 "primaryAngle":"WHAT_CHANGED|WHY_IT_MATTERS|COMPETITIVE_IMPACT|BUSINESS_IMPACT|TECHNICAL_SIGNIFICANCE|COST_PRICING|USER_IMPACT|POLICY_IMPACT|CLAIM_VS_EVIDENCE|RESEARCH_LIMITATION|MARKET_SHIFT|OTHER",
 "secondaryAngle":"(اختياري، من نفس القائمة)",
 "editorialThesis":"جملة واحدة يطرحها المقال",
 "readerValue":"ما الذي يفهمه/يفعله القارئ بعد القراءة",
 "openingStrategy":"FACT_FIRST|NUMBER_FIRST|CONSEQUENCE_FIRST|CONTRAST|CONTEXT|USER_IMPACT|TENSION|RESEARCH_RESULT",
 "headlineStrategy":"(اختياري) توجيه للعنوان مبني على أقوى دليل/رقم/اسم",
 "sections":[{"workingTitle":"عنوان خاص بالقصة","purpose":"غرض القسم","questionsToAnswer":["سؤال"],"evidenceNeeded":["دليل"],"approximateWeight":0.3}],
 "includeFaq":false,"faqIntent":[],
 "includeComparison":false,"comparisonTarget":"",
 "includeMena":false,"menaReason":"",
 "uncertainties":[{"kind":"rollout|pricing|availability|arabic-support|benchmark|research-limit|legal|demo-vs-prod|unverified-claim","note":"نص","material":false}],
 "evidenceRequirements":[],
 "depthDowngradedReason":""
}`.trim();
}

export function buildPlannerUserPrompt(
  topic: string,
  sources: PlannerSource[],
  authorSlug: AuthorSlug,
  hint: StoryType,
): string {
  const srcText = sources
    .map((s, i) => {
      const snippet = (s.content || "").replace(/\s+/g, " ").slice(0, MAX_SNIPPET);
      return `[${i + 1}] (${s.name}) ${s.title}\n${snippet}`;
    })
    .join("\n\n");
  return `الموضوع: ${topic}
عدد المصادر: ${sources.length}
الكاتب/العدسة التحريرية (authorLens): ${authorSlug}
تلميح مبدئي لنوع القصة (غير مُلزِم، يمكنك تجاوزه): ${hint}

المصادر (مقتطفات قصيرة):
${srcText}

أنتج خطة تحريرية واحدة بصيغة JSON فقط. اضبط authorLens = "${authorSlug}".`.trim();
}

// ─── Real OpenAI completion (lazy client, mirrors review-openai.ts) ──────────

let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

const defaultCreateCompletion: CreateCompletion = async ({ system, user }) => {
  const client = getClient();
  const res = await client.chat.completions.create({
    model: process.env.OPENAI_PLANNER_MODEL ?? "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.4,
    max_tokens: 1200,
    response_format: { type: "json_object" },
  });
  return res.choices[0]?.message?.content ?? "";
};

function parsePlan(raw: string): EditorialPlan | null {
  try {
    const clean = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    return JSON.parse(clean) as EditorialPlan;
  } catch {
    return null;
  }
}

// ─── Conservative fallback (planner-failure ONLY; never the normal path) ─────

export function conservativeFallbackPlan(
  topic: string,
  sources: PlannerSource[],
  hint: StoryType,
  authorSlug: AuthorSlug,
): EditorialPlan {
  const centralEvent = (sources[0]?.title || topic || "تطور في الذكاء الاصطناعي").slice(0, 200);
  const depth: Depth = sources.length >= 4 ? "standard" : "breaking"; // never "deep" in fallback
  return {
    storyType: hint,
    depth,
    centralEvent,
    primaryAngle: "WHAT_CHANGED",
    editorialThesis: `تغطية موجزة لِ: ${centralEvent}`,
    readerValue: "فهم ما حدث وأهميته المباشرة.",
    openingStrategy: "FACT_FIRST",
    authorLens: authorSlug,
    sections: [
      { purpose: "ما الذي حدث بالضبط", workingTitle: "ما الذي حدث", questionsToAnswer: ["ما الحدث؟"] },
      { purpose: "لماذا يهم الآن", workingTitle: "لماذا يهم", questionsToAnswer: ["لماذا الآن؟"] },
      { purpose: "ما التالي وما الذي يجب متابعته", workingTitle: "ما التالي", questionsToAnswer: ["ماذا بعد؟"] },
    ],
    includeFaq: false,
    includeComparison: false,
    includeMena: false,
    uncertainties: [],
  };
}

// ─── Main planner entry ──────────────────────────────────────────────────────

export async function planEditorial(
  topic: string,
  sources: PlannerSource[],
  authorSlug: AuthorSlug,
  opts?: { createCompletion?: CreateCompletion },
): Promise<PlannerOutcome> {
  const hint = deterministicStoryTypeHint(topic, sources);
  const createCompletion = opts?.createCompletion ?? defaultCreateCompletion;
  const started = Date.now();

  const system = buildPlannerSystemPrompt();
  const user = buildPlannerUserPrompt(topic, sources, authorSlug, hint);

  const fallback = (status: PlannerStatus, reason: string): PlannerOutcome => ({
    status,
    plan: conservativeFallbackPlan(topic, sources, hint, authorSlug),
    hint,
    fallbackUsed: true,
    fallbackReason: reason,
    latencyMs: Date.now() - started,
  });

  let raw: string;
  try {
    raw = await createCompletion({ system, user });
  } catch (err) {
    return fallback("failed_nonblocking", `planner call threw: ${err instanceof Error ? err.message : String(err)}`);
  }

  const first = parsePlan(raw);
  if (first) {
    first.authorLens = authorSlug; // authorLens is authoritative from the pipeline, not the model
    const v = validateEditorialPlan(first);
    if (v.ok) return { status: "success", plan: first, hint, fallbackUsed: false, latencyMs: Date.now() - started };
  }

  // One repair/retry with the validation errors fed back.
  const firstErrors = first ? validateEditorialPlan(first).errors : ["invalid JSON"];
  let retryRaw: string;
  try {
    retryRaw = await createCompletion({
      system,
      user: `${user}\n\n(المحاولة السابقة كانت غير صالحة: ${firstErrors.join("; ")}. أعد JSON صالحاً يعالج هذه الأخطاء، والتزم بعدد أقسام 2–7 وأسماء أقسام غير القالب القديم.)`,
    });
  } catch (err) {
    return fallback("failed_nonblocking", `planner retry threw: ${err instanceof Error ? err.message : String(err)}`);
  }

  const second = parsePlan(retryRaw);
  if (second) {
    second.authorLens = authorSlug;
    const v2 = validateEditorialPlan(second);
    if (v2.ok) return { status: "retry_success", plan: second, hint, fallbackUsed: false, latencyMs: Date.now() - started };
    return fallback("fallback", `invalid after retry: ${v2.errors.join("; ")}`);
  }
  return fallback("fallback", "invalid JSON after retry");
}

// ─── Shadow diagnostics (comparison vs the V1 draft — diagnostics ONLY) ───────

/** Extract H2 headings from Markdown (lines starting with "## "). */
export function extractH2Headings(markdown: string): string[] {
  return (markdown || "")
    .split(/\n/)
    .filter((l) => /^##\s+/.test(l))
    .map((l) => l.replace(/^##\s+/, "").trim());
}

export interface ShadowDiagnostics {
  reviewQueueId: string;
  topic: string;
  plannerStatus: PlannerStatus;
  storyType: StoryType;
  depth: Depth;
  centralEvent: string;
  primaryAngle: string;
  editorialThesis: string;
  openingStrategy: string;
  v2SectionTitles: string[];
  v2SectionCount: number;
  includeFaq: boolean;
  faqIntentCount: number;
  includeComparison: boolean;
  comparisonTarget?: string;
  includeMena: boolean;
  menaReason?: string;
  materialUncertaintyCount: number;
  fallbackUsed: boolean;
  fallbackReason?: string;
  plannerLatencyMs?: number;
  // V1 comparison (diagnostics only — no second writer is ever run)
  v1H2Headings: string[];
  v1MatchesLegacySkeleton: boolean;
  headingOverlapCount: number;
  structurallyDifferent: boolean;
}

function trunc(s: string | undefined, n: number): string {
  return (s ?? "").slice(0, n);
}

/** Build a bounded, structured diagnostics event comparing the shadow plan to
 *  the V1 draft that was actually generated. Does NOT run a second writer and
 *  does NOT persist anything. */
export function buildShadowDiagnostics(
  reviewQueueId: string,
  topic: string,
  outcome: PlannerOutcome,
  v1ContentAr: string,
): ShadowDiagnostics {
  const plan = outcome.plan;
  const v1H2 = extractH2Headings(v1ContentAr);
  const v2Titles = plan.sections.map((s) => s.workingTitle);
  const v1Norm = new Set(v1H2.map((h) => h.replace(/[—–:،.؟?()]/g, " ").replace(/\s+/g, " ").trim()));
  const overlap = v2Titles.filter((t) => v1Norm.has(t.replace(/[—–:،.؟?()]/g, " ").replace(/\s+/g, " ").trim())).length;
  return {
    reviewQueueId,
    topic: trunc(topic, 120),
    plannerStatus: outcome.status,
    storyType: plan.storyType,
    depth: plan.depth,
    centralEvent: trunc(plan.centralEvent, 160),
    primaryAngle: plan.primaryAngle,
    editorialThesis: trunc(plan.editorialThesis, 200),
    openingStrategy: plan.openingStrategy,
    v2SectionTitles: v2Titles,
    v2SectionCount: v2Titles.length,
    includeFaq: plan.includeFaq,
    faqIntentCount: plan.faqIntent?.length ?? 0,
    includeComparison: plan.includeComparison,
    comparisonTarget: plan.comparisonTarget || undefined,
    includeMena: plan.includeMena,
    menaReason: plan.menaReason ? trunc(plan.menaReason, 160) : undefined,
    materialUncertaintyCount: plan.uncertainties.filter((u) => u.material).length,
    fallbackUsed: outcome.fallbackUsed,
    fallbackReason: outcome.fallbackReason,
    plannerLatencyMs: outcome.latencyMs,
    v1H2Headings: v1H2,
    v1MatchesLegacySkeleton: isLegacySkeleton(v1H2),
    headingOverlapCount: overlap,
    structurallyDifferent: overlap < Math.min(v1H2.length, v2Titles.length),
  };
}
