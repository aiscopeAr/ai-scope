import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_PROMPTS = [
  {
    title: "Professional Email Writer",
    titleAr: "كاتب الإيميلات المحترف",
    body: `You are a professional email writer. Write a clear, concise, and professional email based on the following details:\n\nPurpose: [describe the purpose]\nTone: [formal/semi-formal/friendly]\nKey points to include: [list your points]\nCall to action: [what you want the recipient to do]\n\nKeep the email under 200 words, use a clear subject line, and end with a professional closing.`,
    description: "اكتب إيميلات احترافية بسرعة — فقط أخبر الـ AI بالغرض والنبرة والنقاط الرئيسية",
    category: "writing",
    tags: ["email", "business", "writing", "professional"],
    slug: "professional-email-writer",
    featured: true,
  },
  {
    title: "Midjourney Prompt Master",
    titleAr: "مولّد برومبتس Midjourney",
    body: `Create a detailed Midjourney prompt for the following image concept:\n\nSubject: [describe what you want]\nStyle: [photorealistic/illustration/anime/oil painting/etc.]\nMood: [bright/dark/dramatic/peaceful/etc.]\nAdditional details: [lighting, colors, composition]\n\nFormat the output as: /imagine prompt: [detailed description], [style], [mood], [technical specs like --ar 16:9 --v 6]`,
    description: "حوّل فكرتك البسيطة إلى برومبت احترافي لـ Midjourney ينتج صوراً مذهلة",
    category: "image",
    tags: ["midjourney", "image-generation", "art", "design"],
    slug: "midjourney-prompt-master",
    featured: true,
  },
  {
    title: "Code Reviewer & Debugger",
    titleAr: "مراجع الكود ومصلح الأخطاء",
    body: `You are an expert code reviewer. Review the following code and provide:\n\n1. **Bugs found**: List any bugs or errors with line numbers\n2. **Security issues**: Any security vulnerabilities\n3. **Performance**: Suggestions to improve performance\n4. **Best practices**: What could be written better\n5. **Fixed code**: Provide the corrected version\n\nCode to review:\n\`\`\`\n[paste your code here]\n\`\`\`\n\nBe specific, concise, and explain WHY each change is needed.`,
    description: "راجع كودك واكتشف الأخطاء والثغرات الأمنية — يعطيك الكود المصحح مع شرح كل تغيير",
    category: "code",
    tags: ["code", "debugging", "review", "programming"],
    slug: "code-reviewer-debugger",
    featured: true,
  },
  {
    title: "Social Media Content Calendar",
    titleAr: "خطة محتوى وسائل التواصل الاجتماعي",
    body: `Create a 1-week social media content calendar for:\n\nBusiness/Brand: [your business name]\nIndustry: [your industry]\nTarget audience: [describe your audience]\nPlatforms: [Instagram/Twitter/LinkedIn/TikTok]\nGoal: [brand awareness/leads/engagement/sales]\n\nFor each day provide:\n- Post topic\n- Caption (with emojis)\n- Hashtags (10-15 relevant ones)\n- Best posting time\n- Content type (image/video/carousel/story)\n\nMake the content engaging, authentic, and aligned with current trends.`,
    description: "احصل على خطة محتوى كاملة لأسبوع كامل على وسائل التواصل — مع الكابشن والهاشتاق وأفضل وقت للنشر",
    category: "marketing",
    tags: ["social-media", "content", "marketing", "instagram"],
    slug: "social-media-content-calendar",
    featured: true,
  },
  {
    title: "ChatGPT System Prompt Optimizer",
    titleAr: "محسّن الـ System Prompt لـ ChatGPT",
    body: `Transform my basic prompt into a highly optimized system prompt:\n\nMy original prompt: [paste your prompt here]\nMy use case: [what do you want to achieve]\nDesired output format: [list/paragraphs/JSON/markdown/etc.]\nTone: [formal/casual/technical/creative]\nConstraints: [any limitations or rules]\n\nOptimize it by:\n1. Adding clear role definition\n2. Setting specific output format\n3. Adding examples if helpful\n4. Removing ambiguity\n5. Adding quality controls\n\nProvide the optimized prompt ready to use.`,
    description: "حوّل برومبتك البسيط إلى برومبت احترافي محسّن يعطي نتائج أفضل بكثير",
    category: "general",
    tags: ["chatgpt", "prompt-engineering", "optimization", "ai"],
    slug: "chatgpt-system-prompt-optimizer",
    featured: false,
  },
  {
    title: "Business Plan Generator",
    titleAr: "مولّد خطط الأعمال",
    body: `Create a comprehensive business plan outline for:\n\nBusiness idea: [describe your business]\nTarget market: [who are your customers]\nLocation: [city/country or online]\nBudget: [your starting budget]\nTimeline: [when do you want to launch]\n\nInclude:\n1. Executive Summary\n2. Problem & Solution\n3. Target Market Analysis\n4. Revenue Model\n5. Marketing Strategy\n6. Competitive Advantage\n7. Financial Projections (Year 1)\n8. Next Steps\n\nBe realistic and specific with numbers.`,
    description: "احصل على خطة عمل متكاملة لفكرتك — تشمل التحليل والاستراتيجية والتوقعات المالية",
    category: "marketing",
    tags: ["business", "startup", "planning", "entrepreneurship"],
    slug: "business-plan-generator",
    featured: false,
  },
  {
    title: "DALL-E 3 Photorealistic Portrait",
    titleAr: "بورتريه واقعي بـ DALL-E 3",
    body: `Create a photorealistic portrait with DALL-E 3:\n\n"A photorealistic portrait of [subject description], [age range], [distinctive features]. Shot with a [camera type] using an [lens] lens. [Lighting setup]. Background: [describe background]. Mood: [emotion/atmosphere]. Ultra-sharp details, 8K resolution, professional photography."\n\nReplace the brackets with your specific details for best results.`,
    description: "برومبت جاهز لإنشاء صور بورتريه فوتوغرافية واقعية جداً باستخدام DALL-E 3",
    category: "image",
    tags: ["dall-e", "portrait", "photorealistic", "image-generation"],
    slug: "dalle3-photorealistic-portrait",
    featured: false,
  },
  {
    title: "YouTube Script Writer",
    titleAr: "كاتب سكريبت يوتيوب",
    body: `Write an engaging YouTube video script for:\n\nTopic: [your video topic]\nTarget audience: [who will watch this]\nVideo length: [5 min / 10 min / 15 min]\nStyle: [educational/entertaining/tutorial/documentary]\nChannel niche: [your channel topic]\n\nStructure:\n- Hook (first 15 seconds)\n- Introduction (30 seconds)\n- Main content (with timestamps)\n- Call to action\n- Outro\n\nInclude [PAUSE], [B-ROLL], [GRAPHICS] cues. Write in a conversational tone.`,
    description: "اكتب سكريبت يوتيوب كامل ومنظم مع هوك جذاب وهيكل واضح — جاهز للتصوير مباشرة",
    category: "writing",
    tags: ["youtube", "script", "video", "content-creation"],
    slug: "youtube-script-writer",
    featured: false,
  },
  {
    title: "React Component Builder",
    titleAr: "مولّد مكوّنات React",
    body: `Build a React component with the following specifications:\n\nComponent name: [ComponentName]\nPurpose: [what this component does]\nProps needed: [list the props with types]\nState management: [useState/useReducer/Zustand/Redux]\nStyling: [Tailwind CSS/CSS Modules/Styled Components]\nInteractions: [clicks, inputs, animations]\n\nRequirements:\n- TypeScript types for all props\n- Proper error handling\n- Loading states if async\n- Responsive design\n- Clean code\n\nAlso provide example usage.`,
    description: "احصل على مكوّن React كامل مع TypeScript وTailwind — فقط اشرح ما تحتاج",
    category: "code",
    tags: ["react", "typescript", "frontend", "component"],
    slug: "react-component-builder",
    featured: false,
  },
  {
    title: "SEO Blog Post Writer",
    titleAr: "كاتب مقالات SEO",
    body: `Write an SEO-optimized blog post about:\n\nTopic: [your topic]\nTarget keyword: [main keyword]\nSecondary keywords: [2-3 related keywords]\nWord count: [1000/1500/2000 words]\nAudience level: [beginner/intermediate/expert]\nTone: [informative/conversational/authoritative]\n\nStructure:\n1. SEO title (under 60 chars)\n2. Meta description (under 160 chars)\n3. Introduction with hook\n4. Body with H2/H3 headers\n5. FAQ section (5 questions)\n6. Conclusion with CTA\n\nInclude the keyword naturally 3-5 times.`,
    description: "اكتب مقالات SEO احترافية تتصدر نتائج البحث — مع العنوان والميتا والهيكل الكامل",
    category: "writing",
    tags: ["seo", "blog", "content", "writing"],
    slug: "seo-blog-post-writer",
    featured: false,
  },
  {
    title: "Stable Diffusion Character Design",
    titleAr: "تصميم شخصيات بـ Stable Diffusion",
    body: `Generate a character design prompt for Stable Diffusion:\n\n(masterpiece, best quality, highly detailed), [character description: age, gender, features], wearing [clothing description], [hair style and color], [eye color], [expression/mood], [pose], [setting/background], [art style: anime/realistic/fantasy/sci-fi], [lighting: soft/dramatic/neon/natural], [color palette], --neg (low quality, blurry, bad anatomy, extra limbs, watermark)`,
    description: "برومبت متكامل لتصميم شخصيات احترافية بـ Stable Diffusion مع negative prompts",
    category: "image",
    tags: ["stable-diffusion", "character", "design", "art"],
    slug: "stable-diffusion-character-design",
    featured: false,
  },
  {
    title: "SQL Query Optimizer",
    titleAr: "محسّن استعلامات SQL",
    body: `Analyze and optimize this SQL query:\n\n\`\`\`sql\n[paste your SQL query here]\n\`\`\`\n\nDatabase: [MySQL/PostgreSQL/SQLite/MSSQL]\nTable size: [approximate number of rows]\nCurrent execution time: [if known]\n\nProvide:\n1. Issues found in the current query\n2. Optimized version with explanation\n3. Recommended indexes to add\n4. Execution plan analysis\n5. Alternative approaches if applicable\n\nExplain each optimization in simple terms.`,
    description: "حسّن استعلامات SQL البطيئة — يحلل الكود ويقترح indexes وتحسينات موثّقة",
    category: "code",
    tags: ["sql", "database", "optimization", "backend"],
    slug: "sql-query-optimizer",
    featured: false,
  },
];

async function main() {
  console.log("Seeding prompts...");

  const existing = await prisma.prompt.count();
  if (existing > 0) {
    console.log(`Already have ${existing} prompts. Skipping.`);
    return;
  }

  const result = await prisma.prompt.createMany({
    data: SEED_PROMPTS,
    skipDuplicates: true,
  });

  console.log(`✅ Created ${result.count} prompts`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
