/**
 * seed-tools.mjs
 * ─────────────────────────────────────────────────────────────
 * Seeds 50 core AI tools into the DB.
 * Each tool has an English rawDescription — GPT-4o-mini writes
 * the full Arabic review (desc, pros, cons, use-cases, FAQ…).
 *
 * Run:
 *   node scripts/seed-tools.mjs
 *
 * Env required: DATABASE_URL, DIRECT_URL, OPENAI_API_KEY
 * ─────────────────────────────────────────────────────────────
 */

import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";

process.loadEnvFile?.(".env");

const prisma = new PrismaClient();
const openai  = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Tool list ────────────────────────────────────────────────────────────────

const TOOLS = [
  // ── LLMs & Chat ──
  {
    name: "ChatGPT",
    website: "https://chat.openai.com",
    tagline: "The world's most popular AI chatbot",
    pricing: "freemium", monthlyPrice: 20,
    rawDescription: "ChatGPT by OpenAI is a conversational AI assistant that can write, code, analyse, and answer questions. GPT-4o is the default model for Plus subscribers. Used by over 180 million people worldwide.",
    tags: ["chatgpt", "openai", "llm", "chatbot"],
  },
  {
    name: "Claude",
    website: "https://claude.ai",
    tagline: "Anthropic's safe and capable AI assistant",
    pricing: "freemium", monthlyPrice: 20,
    rawDescription: "Claude by Anthropic is an AI assistant focused on safety and helpfulness. Claude 3.5 Sonnet leads benchmarks in coding and reasoning. Supports 200k token context window, ideal for long documents.",
    tags: ["claude", "anthropic", "llm", "assistant"],
  },
  {
    name: "Gemini",
    website: "https://gemini.google.com",
    tagline: "Google's multimodal AI assistant",
    pricing: "freemium", monthlyPrice: 20,
    rawDescription: "Gemini (formerly Bard) is Google's AI assistant powered by the Gemini family of models. Integrates with Google Workspace. Gemini Ultra leads on multimodal tasks including images, audio, and video.",
    tags: ["gemini", "google", "llm", "multimodal"],
  },
  {
    name: "Copilot",
    website: "https://copilot.microsoft.com",
    tagline: "Microsoft's AI companion powered by GPT-4",
    pricing: "freemium", monthlyPrice: 20,
    rawDescription: "Microsoft Copilot integrates GPT-4 into Windows, Edge, and Microsoft 365. Summarises documents, generates images with DALL-E, and assists with everyday tasks directly inside Microsoft products.",
    tags: ["copilot", "microsoft", "gpt-4", "assistant"],
  },
  {
    name: "Perplexity AI",
    website: "https://perplexity.ai",
    tagline: "AI-powered search engine with cited answers",
    pricing: "freemium", monthlyPrice: 20,
    rawDescription: "Perplexity is an AI search engine that gives direct answers with cited sources. Unlike traditional search, it understands natural language questions and provides concise summaries with references.",
    tags: ["search", "perplexity", "research", "citations"],
  },
  {
    name: "Grok",
    website: "https://grok.com",
    tagline: "xAI's real-time AI with access to X posts",
    pricing: "freemium", monthlyPrice: 16,
    rawDescription: "Grok by xAI (Elon Musk) is an AI assistant with real-time access to X (Twitter) data. Features a personality with humor, and access to the latest news through the platform. Available to X Premium subscribers.",
    tags: ["grok", "xai", "llm", "x-twitter"],
  },
  {
    name: "Mistral AI",
    website: "https://mistral.ai",
    tagline: "European open-source LLMs with API access",
    pricing: "freemium",
    rawDescription: "Mistral AI is a French company offering powerful open-source language models. Mistral Large and Mixtral 8x7B are used by developers worldwide for their efficiency and cost-effectiveness. Offers an API and free tier.",
    tags: ["mistral", "open-source", "llm", "api"],
  },
  {
    name: "Meta AI",
    website: "https://meta.ai",
    tagline: "Meta's free AI assistant across its apps",
    pricing: "free",
    rawDescription: "Meta AI is a free AI assistant integrated into WhatsApp, Messenger, Instagram, and Facebook. Powered by Llama 3, it can generate images, answer questions, and assist with tasks directly in your favourite social apps.",
    tags: ["meta", "llama", "whatsapp", "free"],
  },
  // ── Image generation ──
  {
    name: "Midjourney",
    website: "https://midjourney.com",
    tagline: "The most popular AI image generation platform",
    pricing: "paid", monthlyPrice: 10,
    rawDescription: "Midjourney is an AI image generator known for its stunning artistic quality. Operates through Discord. Used by millions of artists, designers, and creators worldwide. Version 6 produces near-photorealistic images.",
    tags: ["midjourney", "image-generation", "art", "creative"],
  },
  {
    name: "DALL-E 3",
    website: "https://openai.com/dall-e-3",
    tagline: "OpenAI's text-to-image model inside ChatGPT",
    pricing: "freemium",
    rawDescription: "DALL-E 3 by OpenAI generates high-quality images from text descriptions. Integrated into ChatGPT Plus, it understands complex prompts and maintains character consistency. Best for precise, instruction-following image creation.",
    tags: ["dall-e", "openai", "image-generation", "text-to-image"],
  },
  {
    name: "Stable Diffusion",
    website: "https://stability.ai",
    tagline: "Open-source image generation you can run locally",
    pricing: "free",
    rawDescription: "Stable Diffusion by Stability AI is an open-source image generation model. Can run on local hardware, giving complete control and privacy. The foundation for thousands of customised models on Civitai and Hugging Face.",
    tags: ["stable-diffusion", "open-source", "image", "local"],
  },
  {
    name: "Adobe Firefly",
    website: "https://firefly.adobe.com",
    tagline: "Adobe's generative AI built for creative professionals",
    pricing: "freemium",
    rawDescription: "Adobe Firefly is a generative AI integrated into Creative Cloud (Photoshop, Illustrator, Premiere). Trained on licensed content, making it safe for commercial use. Excels at text effects, inpainting, and style generation.",
    tags: ["adobe", "firefly", "creative", "photoshop"],
  },
  {
    name: "Leonardo AI",
    website: "https://leonardo.ai",
    tagline: "AI image platform for game assets and concept art",
    pricing: "freemium", monthlyPrice: 12,
    rawDescription: "Leonardo AI specialises in generating consistent characters, game assets, and concept art. Offers fine-tuned models, canvas editor, and API access. Favoured by game developers and concept artists.",
    tags: ["leonardo", "game-assets", "concept-art", "image"],
  },
  {
    name: "Canva AI",
    website: "https://canva.com",
    tagline: "Design platform with built-in AI magic tools",
    pricing: "freemium", monthlyPrice: 15,
    rawDescription: "Canva is a leading design platform with powerful AI features including Magic Write (text generation), Magic Design (auto-layout), background remover, and text-to-image. Used by 150+ million people worldwide.",
    tags: ["canva", "design", "magic-write", "no-code"],
  },
  // ── Video ──
  {
    name: "Sora",
    website: "https://sora.com",
    tagline: "OpenAI's text-to-video model",
    pricing: "paid", monthlyPrice: 20,
    rawDescription: "Sora by OpenAI generates realistic videos up to 60 seconds from text prompts. Creates cinematic content with complex camera movements and consistent physics. Available to ChatGPT Plus and Pro subscribers.",
    tags: ["sora", "openai", "text-to-video", "video"],
  },
  {
    name: "RunwayML",
    website: "https://runwayml.com",
    tagline: "Professional AI video creation and editing",
    pricing: "freemium", monthlyPrice: 15,
    rawDescription: "RunwayML is a creative AI platform focused on video. Gen-3 Alpha produces high-quality video from text or images. Used by Hollywood studios for VFX. Includes video-to-video, inpainting, and motion brush tools.",
    tags: ["runway", "video-generation", "vfx", "creative"],
  },
  {
    name: "HeyGen",
    website: "https://heygen.com",
    tagline: "Create AI avatar videos for business",
    pricing: "freemium", monthlyPrice: 29,
    rawDescription: "HeyGen creates professional talking-head videos using AI avatars. Simply paste a script and choose an avatar — the system lip-syncs in 40+ languages. Perfect for corporate training, marketing, and personalised outreach.",
    tags: ["heygen", "avatar", "video", "marketing"],
  },
  {
    name: "Synthesia",
    website: "https://synthesia.io",
    tagline: "AI video platform with 230+ avatars",
    pricing: "paid", monthlyPrice: 29,
    rawDescription: "Synthesia generates professional training and explainer videos from text using AI avatars in 130+ languages. Used by Heineken, Xerox, and Zoom for scalable video content without cameras or studios.",
    tags: ["synthesia", "avatar", "training-videos", "multilingual"],
  },
  // ── Voice & Music ──
  {
    name: "ElevenLabs",
    website: "https://elevenlabs.io",
    tagline: "The most realistic AI voice generator",
    pricing: "freemium", monthlyPrice: 5,
    rawDescription: "ElevenLabs produces ultra-realistic text-to-speech in 29 languages. Features voice cloning (clone any voice from a 1-minute sample), dubbing, and sound effects. Used by major publishers and content creators.",
    tags: ["elevenlabs", "tts", "voice-clone", "audio"],
  },
  {
    name: "Suno",
    website: "https://suno.com",
    tagline: "Create full songs from text prompts",
    pricing: "freemium", monthlyPrice: 8,
    rawDescription: "Suno AI generates complete songs with vocals, melody, and instruments from a text description. Select genre, mood, and style. Produces 2-minute tracks and allows custom lyrics. Free tier gives 50 credits/day.",
    tags: ["suno", "music", "song-generation", "audio"],
  },
  {
    name: "Udio",
    website: "https://udio.com",
    tagline: "AI music generator with studio quality",
    pricing: "freemium",
    rawDescription: "Udio creates studio-quality music from text prompts. Supports custom lyrics, style mixing, and long-form track extension. Produces music in any genre with remarkable audio fidelity.",
    tags: ["udio", "music-generation", "audio", "creative"],
  },
  // ── Coding ──
  {
    name: "GitHub Copilot",
    website: "https://github.com/features/copilot",
    tagline: "AI pair programmer inside your IDE",
    pricing: "freemium", monthlyPrice: 10,
    rawDescription: "GitHub Copilot is an AI coding assistant by GitHub and OpenAI. Suggests code completions, entire functions, and documentation in real time. Integrates with VS Code, JetBrains, and Neovim. Processes 46%+ of developer code.",
    tags: ["copilot", "coding", "github", "vscode"],
  },
  {
    name: "Cursor",
    website: "https://cursor.sh",
    tagline: "AI-first code editor built on VS Code",
    pricing: "freemium", monthlyPrice: 20,
    rawDescription: "Cursor is an AI code editor that lets you chat with your codebase, generate full files, and edit multiple files simultaneously with natural language. Built on VS Code with Claude and GPT-4 under the hood.",
    tags: ["cursor", "coding", "ai-editor", "vscode"],
  },
  {
    name: "Replit",
    website: "https://replit.com",
    tagline: "Build and deploy apps with AI in the browser",
    pricing: "freemium", monthlyPrice: 7,
    rawDescription: "Replit is a browser-based IDE with AI that helps you build and deploy full apps. Ghostwriter AI writes code, fixes bugs, and explains errors. Supports 50+ languages and includes hosting and database.",
    tags: ["replit", "coding", "browser-ide", "deploy"],
  },
  {
    name: "Tabnine",
    website: "https://tabnine.com",
    tagline: "Privacy-focused AI code completion",
    pricing: "freemium", monthlyPrice: 12,
    rawDescription: "Tabnine is an AI code completion tool that runs locally, ensuring code privacy. Supports 80+ languages and integrates with all major IDEs. Popular with enterprise teams that need GDPR-compliant AI coding assistance.",
    tags: ["tabnine", "coding", "privacy", "code-completion"],
  },
  // ── Writing ──
  {
    name: "Jasper",
    website: "https://jasper.ai",
    tagline: "AI writing platform for marketing teams",
    pricing: "paid", monthlyPrice: 39,
    rawDescription: "Jasper is an AI writing assistant designed for marketing teams. Creates blog posts, ads, emails, and social content. Features brand voice settings, team collaboration, and 50+ content templates. Used by 100k+ businesses.",
    tags: ["jasper", "writing", "marketing", "content"],
  },
  {
    name: "Copy.ai",
    website: "https://copy.ai",
    tagline: "AI copywriter for sales and marketing content",
    pricing: "freemium", monthlyPrice: 49,
    rawDescription: "Copy.ai automates sales and marketing copywriting. Generates cold emails, LinkedIn messages, product descriptions, and ad copy. Features a GTM AI platform for workflow automation. Free plan allows 2,000 words/month.",
    tags: ["copyai", "copywriting", "sales", "marketing"],
  },
  {
    name: "Grammarly",
    website: "https://grammarly.com",
    tagline: "AI writing assistant for grammar and clarity",
    pricing: "freemium", monthlyPrice: 12,
    rawDescription: "Grammarly checks grammar, spelling, punctuation, clarity, and tone in real time. The AI writing assistant suggests rewrites and improvements. Works across browsers, Word, Google Docs, and desktop apps.",
    tags: ["grammarly", "writing", "grammar", "editing"],
  },
  {
    name: "Notion AI",
    website: "https://notion.so/product/ai",
    tagline: "AI built into your workspace and notes",
    pricing: "freemium", monthlyPrice: 10,
    rawDescription: "Notion AI is integrated into Notion workspace. Summarises meeting notes, drafts content, translates, and answers questions about your docs. The AI has full context of your workspace for relevant, personalised responses.",
    tags: ["notion", "productivity", "writing", "workspace"],
  },
  // ── Productivity & Automation ──
  {
    name: "Zapier",
    website: "https://zapier.com",
    tagline: "Automate workflows between 6,000+ apps",
    pricing: "freemium", monthlyPrice: 20,
    rawDescription: "Zapier connects 6,000+ apps to automate workflows without code. AI features include natural language automation builder and Copilot that suggests workflows. Used by 2.2 million businesses for no-code automation.",
    tags: ["zapier", "automation", "no-code", "workflow"],
  },
  {
    name: "Make",
    website: "https://make.com",
    tagline: "Visual automation platform (formerly Integromat)",
    pricing: "freemium", monthlyPrice: 9,
    rawDescription: "Make (formerly Integromat) is a visual automation platform that connects apps and automates workflows. More powerful than Zapier for complex scenarios. Supports HTTP, JSON, data manipulation, and AI module integrations.",
    tags: ["make", "automation", "workflow", "integromat"],
  },
  {
    name: "Otter.ai",
    website: "https://otter.ai",
    tagline: "AI meeting assistant that transcribes and summarises",
    pricing: "freemium", monthlyPrice: 10,
    rawDescription: "Otter.ai automatically transcribes and summarises meetings from Zoom, Google Meet, and Microsoft Teams. Identifies speakers, generates action items, and lets you ask AI questions about meeting content.",
    tags: ["otter", "transcription", "meetings", "productivity"],
  },
  {
    name: "Reclaim AI",
    website: "https://reclaim.ai",
    tagline: "AI calendar assistant that protects focus time",
    pricing: "freemium", monthlyPrice: 8,
    rawDescription: "Reclaim AI automatically schedules tasks, habits, and focus time in your Google Calendar. Learns your working style and defends your priorities against meeting overload. Integrates with Slack, Asana, and Linear.",
    tags: ["reclaim", "calendar", "productivity", "scheduling"],
  },
  // ── Marketing ──
  {
    name: "Surfer SEO",
    website: "https://surferseo.com",
    tagline: "AI content optimisation for higher rankings",
    pricing: "paid", monthlyPrice: 89,
    rawDescription: "Surfer SEO analyses top-ranking pages and tells you exactly what to include in your content to rank higher. The AI Content Editor scores your article in real time, suggests keywords, and structures the content for maximum SEO impact.",
    tags: ["surfer", "seo", "content", "ranking"],
  },
  {
    name: "Semrush AI",
    website: "https://semrush.com",
    tagline: "All-in-one SEO and content marketing platform",
    pricing: "paid", monthlyPrice: 120,
    rawDescription: "Semrush is the leading SEO platform with AI features for keyword research, competitor analysis, and content generation. AI Writing Assistant creates optimised articles, while ContentShake suggests trending topics to rank for.",
    tags: ["semrush", "seo", "marketing", "keywords"],
  },
  {
    name: "AdCreative.ai",
    website: "https://adcreative.ai",
    tagline: "AI-generated ad creatives that convert",
    pricing: "paid", monthlyPrice: 29,
    rawDescription: "AdCreative.ai uses AI to generate high-converting ad images and copy for Google, Facebook, Instagram, and LinkedIn. Analyses millions of successful ads to predict performance before you spend a budget.",
    tags: ["adcreative", "ads", "marketing", "creative"],
  },
  // ── Education ──
  {
    name: "Khanmigo",
    website: "https://khanacademy.org/khan-labs",
    tagline: "Khan Academy's AI tutor for students",
    pricing: "freemium", monthlyPrice: 4,
    rawDescription: "Khanmigo is Khan Academy's AI tutor powered by GPT-4. Guides students through problems with Socratic questioning rather than giving direct answers. Available in maths, science, history, and coding. Trusted by schools worldwide.",
    tags: ["khanmigo", "education", "tutoring", "students"],
  },
  {
    name: "Duolingo Max",
    website: "https://duolingo.com",
    tagline: "Language learning with AI-powered conversation",
    pricing: "freemium", monthlyPrice: 7,
    rawDescription: "Duolingo Max adds GPT-4 powered features including Roleplay (practice real conversations) and Explain My Answer. Available for Spanish and French learners. Combines gamification with personalised AI tutoring.",
    tags: ["duolingo", "language-learning", "education", "ai-tutor"],
  },
  // ── Customer Support ──
  {
    name: "Intercom AI",
    website: "https://intercom.com",
    tagline: "AI customer service platform with Fin chatbot",
    pricing: "paid", monthlyPrice: 39,
    rawDescription: "Intercom's Fin AI resolves 50%+ of customer queries instantly using your knowledge base. Integrates with help docs, URLs, and PDFs. Seamlessly hands off complex issues to human agents with full conversation context.",
    tags: ["intercom", "customer-support", "chatbot", "fin"],
  },
  {
    name: "Tidio",
    website: "https://tidio.com",
    tagline: "AI chatbot for small business customer support",
    pricing: "freemium", monthlyPrice: 29,
    rawDescription: "Tidio combines live chat, AI chatbot (Lyro), and email marketing for small businesses. Lyro AI answers up to 70% of customer questions automatically in natural language, 24/7, without human intervention.",
    tags: ["tidio", "chatbot", "ecommerce", "live-chat"],
  },
  // ── No-code & Startups ──
  {
    name: "Bubble",
    website: "https://bubble.io",
    tagline: "Build full-stack web apps without code",
    pricing: "freemium", monthlyPrice: 29,
    rawDescription: "Bubble is the leading no-code platform for building complex web applications. AI features auto-generate app logic and help debug workflows. Companies like Comet and Qoins have built investor-funded startups on Bubble.",
    tags: ["bubble", "no-code", "web-app", "startup"],
  },
  {
    name: "Webflow AI",
    website: "https://webflow.com",
    tagline: "Visual web design with AI-powered tools",
    pricing: "freemium", monthlyPrice: 14,
    rawDescription: "Webflow is a visual website builder that generates clean HTML/CSS/JS. AI features include text generation and layout suggestions. Favoured by designers wanting code-quality output without writing code.",
    tags: ["webflow", "no-code", "web-design", "cms"],
  },
  // ── Presentations ──
  {
    name: "Gamma",
    website: "https://gamma.app",
    tagline: "Create presentations and docs with AI in seconds",
    pricing: "freemium", monthlyPrice: 10,
    rawDescription: "Gamma uses AI to generate beautiful presentations, documents, and websites from a text prompt. Unlike PowerPoint, Gamma creates responsive, shareable content. Import from Google Slides or start from scratch in seconds.",
    tags: ["gamma", "presentations", "slides", "ai-design"],
  },
  {
    name: "Beautiful.ai",
    website: "https://beautiful.ai",
    tagline: "Smart presentation software that designs itself",
    pricing: "freemium", monthlyPrice: 12,
    rawDescription: "Beautiful.ai uses AI to automatically layout and design presentation slides. Smart Slides adapt as you add content, maintaining professional design principles. Ideal for business presentations without a design team.",
    tags: ["beautiful-ai", "presentations", "design", "slides"],
  },
  // ── Finance ──
  {
    name: "Bloomberg GPT",
    website: "https://bloomberg.com/company/press/bloomberg-gpt",
    tagline: "Large language model trained on financial data",
    pricing: "paid",
    rawDescription: "BloombergGPT is a 50-billion parameter LLM trained on Bloomberg's financial data corpus. Outperforms general LLMs on financial NLP tasks like sentiment analysis, named entity recognition, and financial QA.",
    tags: ["bloomberg", "finance", "llm", "trading"],
  },
  {
    name: "Kensho",
    website: "https://kensho.com",
    tagline: "S&P Global AI for financial intelligence",
    pricing: "paid",
    rawDescription: "Kensho (owned by S&P Global) provides AI-powered financial analysis tools. Features include natural language search over financial documents, earnings call transcription, and M&A analysis. Used by major investment banks.",
    tags: ["kensho", "finance", "s&p", "analytics"],
  },
  // ── Healthcare ──
  {
    name: "Suki AI",
    website: "https://suki.ai",
    tagline: "AI assistant for doctors and clinical documentation",
    pricing: "paid",
    rawDescription: "Suki is an AI clinical documentation assistant that listens to patient visits and writes structured notes in real time, saving doctors 72 minutes per day. Integrates with Epic, Cerner, and major EHR systems.",
    tags: ["suki", "healthcare", "doctors", "ehr"],
  },
  {
    name: "Nabla Copilot",
    website: "https://nabla.com",
    tagline: "AI clinical note-taking that joins your visits",
    pricing: "freemium",
    rawDescription: "Nabla Copilot listens to patient consultations and automatically generates SOAP notes, summaries, and follow-up plans. Available across iOS, Android, and web. HIPAA compliant and works in 12 languages.",
    tags: ["nabla", "healthcare", "clinical-notes", "hipaa"],
  },
  // ── Legal ──
  {
    name: "Harvey AI",
    website: "https://harvey.ai",
    tagline: "AI for legal research and contract review",
    pricing: "paid",
    rawDescription: "Harvey is an AI built for law firms, providing legal research, contract analysis, due diligence, and litigation support. Trained on legal data. Used by Allen & Overy, PwC, and other top-tier firms.",
    tags: ["harvey", "legal", "contracts", "law"],
  },
  {
    name: "Ironclad AI",
    website: "https://ironcladapp.com",
    tagline: "AI-powered contract lifecycle management",
    pricing: "paid",
    rawDescription: "Ironclad AI automates contract review, negotiation, and lifecycle management for in-house legal teams. AI highlights risky clauses, suggests standard language, and tracks obligations. Used by Dropbox and Reddit.",
    tags: ["ironclad", "contracts", "legal", "enterprise"],
  },
];

// ─── TOOL_CATEGORIES list (must match schema) ─────────────────────────────────

const VALID_CATEGORIES = [
  "writing", "coding", "image", "video", "voice", "marketing", "education",
  "startups", "ecommerce", "automation", "customer-support", "productivity",
  "legal", "finance", "healthcare", "students", "no-code", "presentations", "other",
];

const SYSTEM_PROMPT = `You are an expert Arabic tech journalist specialising in AI tools.
Write authentic, high-quality Arabic content — not a literal translation but a well-crafted Arabic review.
Return ONLY valid JSON, no markdown or backticks.`;

function buildPrompt(tool) {
  return `Generate a comprehensive Arabic review for this AI tool:

Tool: ${tool.name}
Website: ${tool.website}
Tagline: ${tool.tagline ?? ""}
Description: ${tool.rawDescription}
Pricing: ${tool.pricing ?? "freemium"}${tool.monthlyPrice ? `, starts at $${tool.monthlyPrice}/month` : ""}
Tags: ${(tool.tags ?? []).join(", ")}

Return ONLY this JSON (no markdown):
{
  "descriptionAr": "short Arabic description (2-3 sentences, 80-120 words) — compelling, mentions what makes it unique",
  "contentAr": "comprehensive Arabic review (700+ words) — what it is, how it works, who benefits, real-world impact, Arabic-market angle",
  "pros": ["advantage 1 in Arabic", "advantage 2", "advantage 3", "advantage 4", "advantage 5"],
  "cons": ["disadvantage 1 in Arabic", "disadvantage 2", "disadvantage 3"],
  "useCases": ["use case 1 in Arabic", "use case 2", "use case 3", "use case 4", "use case 5"],
  "tags": ["arabic-tag-1", "arabic-tag-2", "arabic-tag-3", "arabic-tag-4", "arabic-tag-5"],
  "toolCategory": "one of: ${VALID_CATEGORIES.join(" | ")}",
  "seoTitle": "Arabic SEO title (50-60 chars) — include tool name and main use",
  "seoDescription": "Arabic SEO description (140-160 chars) — includes name, main benefit, call to action",
  "imageAlt": "Arabic image alt text",
  "faq": [
    {"question": "practical Arabic question about this tool?", "answer": "helpful 2-3 sentence Arabic answer"},
    {"question": "second Arabic question?", "answer": "answer"},
    {"question": "third Arabic question?", "answer": "answer"},
    {"question": "fourth Arabic question?", "answer": "answer"}
  ],
  "slug": "tool-name-lowercase-hyphenated-max-4-words",
  "relatedTopics": ["related Arabic topic 1", "related topic 2", "related topic 3"],
  "arabicSupport": true or false,
  "hasApi": true or false
}`;
}

async function generateContent(tool) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user",   content: buildPrompt(tool) },
    ],
    temperature: 0.7,
    max_tokens: 3000,
  });

  const raw = (response.choices[0]?.message?.content ?? "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  return JSON.parse(raw);
}

async function ingestTool(tool) {
  // Dedup
  const existing = await prisma.aITool.findFirst({
    where: { OR: [{ website: tool.website }, { name: tool.name }] },
    select: { id: true, slug: true },
  });
  if (existing) {
    console.log(`  SKIP  ${tool.name} (already exists)`);
    return "duplicate";
  }

  const content = await generateContent(tool);

  let slug = content.slug ?? tool.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 50);
  const slugExists = await prisma.aITool.findUnique({ where: { slug }, select: { id: true } });
  if (slugExists) slug = `${slug}-${Date.now().toString(36)}`;

  const cat = VALID_CATEGORIES.includes(content.toolCategory) ? content.toolCategory : "other";

  await prisma.aITool.create({
    data: {
      name:           tool.name,
      slug,
      tagline:        tool.tagline ?? null,
      descriptionAr:  content.descriptionAr,
      contentAr:      content.contentAr,
      website:        tool.website,
      toolCategory:   cat,
      category:       cat,
      pricing:        tool.pricing ?? "freemium",
      monthlyPrice:   tool.monthlyPrice ?? null,
      pros:           Array.isArray(content.pros)  ? content.pros.slice(0, 8) : [],
      cons:           Array.isArray(content.cons)  ? content.cons.slice(0, 6) : [],
      useCases:       Array.isArray(content.useCases) ? content.useCases.slice(0, 8) : [],
      tags:           Array.isArray(content.tags)  ? content.tags.slice(0, 8) : [],
      arabicSupport:  content.arabicSupport ?? false,
      hasApi:         content.hasApi ?? false,
      faq:            Array.isArray(content.faq) && content.faq.length > 0 ? content.faq : undefined,
      seoTitle:       content.seoTitle ?? null,
      seoDescription: content.seoDescription ?? null,
      imageAlt:       content.imageAlt ?? null,
      relatedTopics:  Array.isArray(content.relatedTopics) ? content.relatedTopics.slice(0, 5) : [],
      sourceUrl:      tool.website,
      published:      true,
      editorPick:     false,
      featured:       false,
    },
  });

  return "created";
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🚀 Seeding ${TOOLS.length} AI tools...\n`);

  let created = 0, skipped = 0, failed = 0;

  for (let i = 0; i < TOOLS.length; i++) {
    const tool = TOOLS[i];
    process.stdout.write(`[${String(i + 1).padStart(2, "0")}/${TOOLS.length}] ${tool.name.padEnd(22)} `);

    try {
      const status = await ingestTool(tool);
      if (status === "created") {
        console.log("✅ created");
        created++;
      } else {
        skipped++;
      }
      // Rate limit: 2 req/s to stay within OpenAI free tier
      if (status === "created") await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.log(`❌ FAILED — ${err.message}`);
      failed++;
    }
  }

  console.log(`\n────────────────────────────────`);
  console.log(`✅ Created:  ${created}`);
  console.log(`⏭  Skipped:  ${skipped}`);
  console.log(`❌ Failed:   ${failed}`);
  console.log(`────────────────────────────────\n`);
}

main()
  .catch((err) => { console.error(err); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
