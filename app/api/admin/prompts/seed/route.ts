import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const SEED_PROMPTS = [
  {
    title: "Professional Email Writer",
    titleAr: "كاتب الإيميلات المحترف",
    body: `You are a professional email writer. Write a clear, concise, and professional email based on the following details:

Purpose: [describe the purpose]
Tone: [formal/semi-formal/friendly]
Key points to include: [list your points]
Call to action: [what you want the recipient to do]

Keep the email under 200 words, use a clear subject line, and end with a professional closing.`,
    description: "اكتب إيميلات احترافية بسرعة — فقط أخبر الـ AI بالغرض والنبرة والنقاط الرئيسية",
    category: "writing",
    tags: ["email", "business", "writing", "professional"],
    slug: "professional-email-writer",
    featured: true,
  },
  {
    title: "Midjourney Prompt Master",
    titleAr: "مولّد برومبتس Midjourney",
    body: `Create a detailed Midjourney prompt for the following image concept:

Subject: [describe what you want]
Style: [photorealistic/illustration/anime/oil painting/etc.]
Mood: [bright/dark/dramatic/peaceful/etc.]
Additional details: [lighting, colors, composition]

Format the output as: /imagine prompt: [detailed description], [style], [mood], [technical specs like --ar 16:9 --v 6]`,
    description: "حوّل فكرتك البسيطة إلى برومبت احترافي لـ Midjourney ينتج صوراً مذهلة",
    category: "image",
    tags: ["midjourney", "image-generation", "art", "design"],
    slug: "midjourney-prompt-master",
    featured: true,
  },
  {
    title: "Code Reviewer & Debugger",
    titleAr: "مراجع الكود ومصلح الأخطاء",
    body: `You are an expert code reviewer. Review the following code and provide:

1. **Bugs found**: List any bugs or errors with line numbers
2. **Security issues**: Any security vulnerabilities
3. **Performance**: Suggestions to improve performance
4. **Best practices**: What could be written better
5. **Fixed code**: Provide the corrected version

Code to review:
\`\`\`
[paste your code here]
\`\`\`

Be specific, concise, and explain WHY each change is needed.`,
    description: "راجع كودك واكتشف الأخطاء والثغرات الأمنية — يعطيك الكود المصحح مع شرح كل تغيير",
    category: "code",
    tags: ["code", "debugging", "review", "programming"],
    slug: "code-reviewer-debugger",
    featured: true,
  },
  {
    title: "Social Media Content Calendar",
    titleAr: "خطة محتوى وسائل التواصل الاجتماعي",
    body: `Create a 1-week social media content calendar for:

Business/Brand: [your business name]
Industry: [your industry]
Target audience: [describe your audience]
Platforms: [Instagram/Twitter/LinkedIn/TikTok]
Goal: [brand awareness/leads/engagement/sales]

For each day provide:
- Post topic
- Caption (with emojis)
- Hashtags (10-15 relevant ones)
- Best posting time
- Content type (image/video/carousel/story)

Make the content engaging, authentic, and aligned with current trends.`,
    description: "احصل على خطة محتوى كاملة لأسبوع كامل على وسائل التواصل — مع الكابشن والهاشتاق وأفضل وقت للنشر",
    category: "marketing",
    tags: ["social-media", "content", "marketing", "instagram"],
    slug: "social-media-content-calendar",
    featured: true,
  },
  {
    title: "ChatGPT System Prompt Optimizer",
    titleAr: "محسّن الـ System Prompt لـ ChatGPT",
    body: `Transform my basic prompt into a highly optimized system prompt:

My original prompt: [paste your prompt here]
My use case: [what do you want to achieve]
Desired output format: [list/paragraphs/JSON/markdown/etc.]
Tone: [formal/casual/technical/creative]
Constraints: [any limitations or rules]

Optimize it by:
1. Adding clear role definition
2. Setting specific output format
3. Adding examples if helpful
4. Removing ambiguity
5. Adding quality controls

Provide the optimized prompt ready to use.`,
    description: "حوّل برومبتك البسيط إلى برومبت احترافي محسّن يعطي نتائج أفضل بكثير",
    category: "general",
    tags: ["chatgpt", "prompt-engineering", "optimization", "ai"],
    slug: "chatgpt-system-prompt-optimizer",
    featured: false,
  },
  {
    title: "Business Plan Generator",
    titleAr: "مولّد خطط الأعمال",
    body: `Create a comprehensive business plan outline for:

Business idea: [describe your business]
Target market: [who are your customers]
Location: [city/country or online]
Budget: [your starting budget]
Timeline: [when do you want to launch]

Include:
1. Executive Summary
2. Problem & Solution
3. Target Market Analysis
4. Revenue Model (how will you make money)
5. Marketing Strategy
6. Competitive Advantage
7. Financial Projections (Year 1)
8. Next Steps

Be realistic and specific with numbers.`,
    description: "احصل على خطة عمل متكاملة لفكرتك — تشمل التحليل والاستراتيجية والتوقعات المالية",
    category: "marketing",
    tags: ["business", "startup", "planning", "entrepreneurship"],
    slug: "business-plan-generator",
    featured: false,
  },
  {
    title: "DALL-E 3 Photorealistic Portrait",
    titleAr: "بورتريه واقعي بـ DALL-E 3",
    body: `Create a photorealistic portrait with DALL-E 3:

"A photorealistic portrait of [subject description], [age range], [distinctive features].
Shot with a [camera type, e.g., Canon EOS R5] using an [lens, e.g., 85mm f/1.4] lens.
[Lighting setup, e.g., soft studio lighting with a rim light].
Background: [describe background].
Mood: [emotion/atmosphere].
Ultra-sharp details, 8K resolution, professional photography."

Replace the brackets with your specific details for best results.`,
    description: "برومبت جاهز لإنشاء صور بورتريه فوتوغرافية واقعية جداً باستخدام DALL-E 3",
    category: "image",
    tags: ["dall-e", "portrait", "photorealistic", "image-generation"],
    slug: "dalle3-photorealistic-portrait",
    featured: false,
  },
  {
    title: "YouTube Script Writer",
    titleAr: "كاتب سكريبت يوتيوب",
    body: `Write an engaging YouTube video script for:

Topic: [your video topic]
Target audience: [who will watch this]
Video length: [5 min / 10 min / 15 min]
Style: [educational/entertaining/tutorial/documentary]
Channel niche: [your channel topic]

Structure the script with:
- Hook (first 15 seconds — make it compelling)
- Introduction (30 seconds)
- Main content (broken into clear sections with timestamps)
- Call to action (subscribe, like, comment)
- Outro

Include [PAUSE], [B-ROLL], [GRAPHICS] cues where appropriate. Write in a conversational tone that sounds natural when spoken.`,
    description: "اكتب سكريبت يوتيوب كامل ومنظم مع هوك جذاب وهيكل واضح — جاهز للتصوير مباشرة",
    category: "writing",
    tags: ["youtube", "script", "video", "content-creation"],
    slug: "youtube-script-writer",
    featured: false,
  },
  {
    title: "React Component Builder",
    titleAr: "مولّد مكوّنات React",
    body: `Build a React component with the following specifications:

Component name: [ComponentName]
Purpose: [what this component does]
Props needed: [list the props with types]
State management: [useState/useReducer/Zustand/Redux]
Styling: [Tailwind CSS/CSS Modules/Styled Components]
Interactions: [clicks, inputs, animations]
Accessibility: Include ARIA labels and keyboard navigation

Requirements:
- TypeScript types for all props
- Proper error handling
- Loading states if async
- Responsive design
- Clean, commented code

Also provide example usage of the component.`,
    description: "احصل على مكوّن React كامل مع TypeScript وTailwind — فقط اشرح ما تحتاج",
    category: "code",
    tags: ["react", "typescript", "frontend", "component"],
    slug: "react-component-builder",
    featured: false,
  },
  {
    title: "SEO Blog Post Writer",
    titleAr: "كاتب مقالات SEO",
    body: `Write an SEO-optimized blog post about:

Topic: [your topic]
Target keyword: [main keyword to rank for]
Secondary keywords: [2-3 related keywords]
Word count: [1000/1500/2000 words]
Audience expertise level: [beginner/intermediate/expert]
Tone: [informative/conversational/authoritative]

Structure:
1. SEO title (under 60 characters, includes keyword)
2. Meta description (under 160 characters)
3. Introduction with hook
4. [Use H2/H3 headers throughout]
5. Include statistics and examples
6. FAQ section (5 questions)
7. Conclusion with CTA

Naturally include the target keyword 3-5 times without keyword stuffing.`,
    description: "اكتب مقالات SEO احترافية تتصدر نتائج البحث — مع العنوان والميتا والهيكل الكامل",
    category: "writing",
    tags: ["seo", "blog", "content", "writing"],
    slug: "seo-blog-post-writer",
    featured: false,
  },
];

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.prompt.count();
  if (existing > 0) {
    return NextResponse.json({ message: `Already have ${existing} prompts, skipping seed` });
  }

  const created = await prisma.prompt.createMany({
    data: SEED_PROMPTS,
    skipDuplicates: true,
  });

  return NextResponse.json({ ok: true, created: created.count });
}
