/**
 * scripts/seed-ai-tools.ts
 * מכניס כלי AI לדוגמה לבסיס הנתונים
 * הרצה: npx tsx scripts/seed-ai-tools.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const tools = [
  // ══════════════════════════════════════════════
  // 🖼️  כלי תמונות
  // ══════════════════════════════════════════════
  {
    name: "Midjourney",
    slug: "midjourney",
    tagline: "توليد صور فنية احترافية بالذكاء الاصطناعي",
    descriptionAr:
      "ميدجورني هو نظام ذكاء اصطناعي متخصص في توليد صور فنية عالية الجودة من النصوص. يعمل عبر Discord ويُنتج صوراً بأسلوب فني مذهل يصعب تمييزه عن الأعمال البشرية.",
    contentAr:
      "## ما هو Midjourney؟\nميدجورني أداة توليد صور بالذكاء الاصطناعي تعمل عبر Discord. تُدخل وصفاً نصياً وتحصل على 4 خيارات في ثوانٍ.\n\n## المميزات الرئيسية\n- جودة فنية استثنائية تفوق معظم المنافسين\n- أساليب فنية متعددة: فوتوغرافي، رسم، أنيمي، واقعي\n- نسب أبعاد مرنة\n- مجتمع ضخم ومصدر إلهام\n\n## كيف تبدأ؟\n1. انضم لسيرفر Discord الرسمي\n2. استخدم أمر /imagine\n3. أدخل وصفك بالإنجليزية\n4. اختر من 4 نتائج وحسّن ما يعجبك",
    website: "https://midjourney.com",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e6/Midjourney_Emblem.png",
    toolCategory: "image-generation",
    category: "image-generation",
    pricing: "paid",
    monthlyPrice: 10,
    pricingDetails: "الخطة الأساسية 10$/شهر — 200 صورة. Pro 60$/شهر — صور غير محدودة.",
    pros: [
      "أعلى جودة فنية في السوق",
      "أسلوب فريد لا يضاهيه أحد",
      "مجتمع نشط ومصادر إلهام",
      "تحديثات مستمرة",
    ],
    cons: [
      "لا يوجد تطبيق مستقل — يعمل فقط عبر Discord",
      "لا تحكم دقيق في التفاصيل",
      "لا نسخة مجانية",
      "الأوامر تحتاج تعلم",
    ],
    useCases: ["التصميم الجرافيكي", "إنشاء محتوى تسويقي", "إلهام الفنانين", "تصور المنتجات"],
    arabicSupport: false,
    hasApi: false,
    tags: ["توليد صور", "فن رقمي", "Discord", "إبداع"],
    relatedTopics: ["DALL-E", "Stable Diffusion", "Adobe Firefly"],
    featured: true,
    editorPick: true,
    published: true,
    seoTitle: "Midjourney — أفضل أداة لتوليد الصور بالذكاء الاصطناعي",
    seoDescription: "اكتشف Midjourney، الأداة الرائدة في توليد صور فنية احترافية باستخدام الذكاء الاصطناعي عبر Discord.",
  },
  {
    name: "DALL-E 3",
    slug: "dall-e-3",
    tagline: "توليد صور دقيقة من OpenAI مدمج في ChatGPT",
    descriptionAr:
      "DALL-E 3 هو أحدث نموذج توليد صور من OpenAI، مدمج مباشرة في ChatGPT Plus. يتميز بفهم النصوص بدقة عالية وإنتاج صور تتبع الوصف بشكل مذهل.",
    contentAr:
      "## ما هو DALL-E 3؟\nDALL-E 3 نموذج توليد صور من OpenAI، يُستخدم عبر ChatGPT Plus أو API مباشرة.\n\n## المميزات\n- فهم ممتاز للتعليمات العربية والإنجليزية\n- مدمج في ChatGPT — لا تحتاج أدوات خارجية\n- يستطيع كتابة نص داخل الصورة (بدقة معقولة)\n- آمن ومُصمَّم لتجنب المحتوى الضار\n\n## الاستخدام\nافتح ChatGPT Plus وقل: 'ارسم لي صورة لـ...' — بسيط!",
    website: "https://openai.com/dall-e-3",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg",
    toolCategory: "image-generation",
    category: "image-generation",
    pricing: "freemium",
    monthlyPrice: 20,
    pricingDetails: "متاح ضمن ChatGPT Plus (20$/شهر). أو عبر API بالسعر لكل صورة.",
    pros: [
      "مدمج في ChatGPT — سهل الاستخدام",
      "فهم ممتاز للوصف النصي",
      "يدعم النص العربي في الطلبات",
      "يكتب نصاً داخل الصور",
    ],
    cons: [
      "أسلوب فني أقل تميزاً من Midjourney",
      "لا يمكن ضبط النمط بدقة كبيرة",
      "حدود على عدد الصور المجانية",
    ],
    useCases: ["إنشاء تصاميم سريعة", "توضيح الأفكار", "محتوى المدونات", "العروض التقديمية"],
    arabicSupport: true,
    hasApi: true,
    tags: ["OpenAI", "توليد صور", "ChatGPT", "نص إلى صورة"],
    relatedTopics: ["Midjourney", "Stable Diffusion", "ChatGPT"],
    featured: true,
    editorPick: false,
    published: true,
    seoTitle: "DALL-E 3 — توليد صور من OpenAI مدمج في ChatGPT",
    seoDescription: "DALL-E 3 من OpenAI: أداة توليد صور بالذكاء الاصطناعي مدمجة في ChatGPT بفهم نصي دقيق.",
  },

  // ══════════════════════════════════════════════
  // 🔍  كلي بحث
  // ══════════════════════════════════════════════
  {
    name: "Perplexity AI",
    slug: "perplexity-ai",
    tagline: "محرك بحث ذكي يجيب بمصادر موثوقة في الوقت الفعلي",
    descriptionAr:
      "Perplexity AI محرك بحث من الجيل التالي يجمع بين قوة نماذج اللغة الكبيرة وبيانات الإنترنت الحية. يُقدم إجابات مباشرة مع مصادر قابلة للتحقق.",
    contentAr:
      "## ما هو Perplexity AI؟\nPerplexity AI هو محرك بحث يعمل بالذكاء الاصطناعي، يبحث في الإنترنت ويلخص المعلومات مع ذكر المصادر.\n\n## المميزات الرئيسية\n- بحث في الوقت الفعلي (Real-time web search)\n- مصادر موثوقة مرفقة مع كل إجابة\n- وضع التركيز: أكاديمي، يوتيوب، Reddit، الأخبار\n- تاريخ المحادثات والمشاركة\n\n## متى تستخدمه؟\nعندما تحتاج معلومات حديثة ودقيقة مع مصادر — لا تثق بـ ChatGPT في الأحداث الجارية.",
    website: "https://perplexity.ai",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/1/10/Perplexity_AI_logo.svg",
    toolCategory: "search",
    category: "search",
    pricing: "freemium",
    monthlyPrice: 20,
    pricingDetails: "مجاني مع حدود. Pro بـ 20$/شهر يتيح GPT-4o وClaude وبحثاً غير محدود.",
    pros: [
      "بيانات حية من الإنترنت",
      "مصادر موثوقة مع كل إجابة",
      "مجاني للاستخدام الأساسي",
      "واجهة نظيفة وسريعة",
    ],
    cons: [
      "دعم العربية متوسط",
      "أحياناً يُخطئ في تلخيص المصادر",
      "لا يحفظ المحادثات طويلاً في النسخة المجانية",
    ],
    useCases: ["البحث الأكاديمي", "متابعة الأخبار", "البحث عن منتجات", "التحقق من المعلومات"],
    arabicSupport: false,
    hasApi: true,
    tags: ["بحث", "ويب", "مصادر", "معلومات حديثة"],
    relatedTopics: ["ChatGPT", "Google Bard", "You.com"],
    featured: true,
    editorPick: false,
    published: true,
    seoTitle: "Perplexity AI — محرك البحث الذكي بمصادر موثوقة",
    seoDescription: "Perplexity AI: محرك بحث يعمل بالذكاء الاصطناعي يجيب على أسئلتك بمصادر موثوقة من الإنترنت الحي.",
  },
  {
    name: "You.com",
    slug: "you-com",
    tagline: "محرك بحث خصوصي بالذكاء الاصطناعي بدون إعلانات",
    descriptionAr:
      "You.com محرك بحث يركز على الخصوصية ويدمج الذكاء الاصطناعي لتقديم إجابات مخصصة. يتيح التحكم الكامل في مصادر البحث ويدعم نماذج لغوية متعددة.",
    contentAr:
      "## ما هو You.com؟\nمحرك بحث بديل يجمع بين البحث التقليدي والذكاء الاصطناعي مع تركيز شديد على الخصوصية.\n\n## المميزات\n- لا تتبع — خصوصية كاملة\n- YouChat: محادثة ذكية مدمجة\n- YouCode: مساعد برمجة مدمج\n- YouWrite: مساعد كتابة\n- نماذج متعددة: GPT-4، Claude، Gemini\n\n## من يستخدمه؟\nكل من يريد بديلاً لـ Google مع ذكاء اصطناعي وخصوصية.",
    website: "https://you.com",
    logoUrl: "https://you.com/favicon.ico",
    toolCategory: "search",
    category: "search",
    pricing: "freemium",
    monthlyPrice: 15,
    pricingDetails: "مجاني. YouPro بـ 15$/شهر للنماذج المتقدمة والاستخدام غير المحدود.",
    pros: [
      "خصوصية تامة بدون تتبع",
      "نماذج AI متعددة في مكان واحد",
      "مجاني ومفيد",
      "أدوات متكاملة: كود، كتابة، بحث",
    ],
    cons: [
      "نتائج البحث أقل دقة من Google أحياناً",
      "الواجهة مكتظة نسبياً",
      "دعم العربية محدود",
    ],
    useCases: ["البحث بخصوصية", "المقارنة بين نماذج AI", "البرمجة", "الكتابة"],
    arabicSupport: false,
    hasApi: false,
    tags: ["بحث", "خصوصية", "AI متعدد", "بديل Google"],
    relatedTopics: ["Perplexity AI", "Brave Search", "DuckDuckGo"],
    featured: false,
    editorPick: false,
    published: true,
    seoTitle: "You.com — محرك البحث الذكي الخاص بدون إعلانات",
    seoDescription: "You.com محرك بحث يعتمد الخصوصية الكاملة مع ذكاء اصطناعي متكامل يدعم GPT-4 وClaude.",
  },

  // ══════════════════════════════════════════════
  // 💻  كلي برمجة
  // ══════════════════════════════════════════════
  {
    name: "GitHub Copilot",
    slug: "github-copilot",
    tagline: "مساعد البرمجة الأول بالذكاء الاصطناعي من GitHub وOpenAI",
    descriptionAr:
      "GitHub Copilot هو مساعد برمجة يعمل بالذكاء الاصطناعي مدمج في محررات الكود. يقترح أسطر كاملة وكتل كود ووظائف بالكامل بناءً على السياق.",
    contentAr:
      "## ما هو GitHub Copilot؟\nCopilot مساعد برمجة من GitHub وOpenAI، يعمل مباشرة داخل VS Code وJetBrains وVim وغيرها.\n\n## كيف يعمل؟\nيقرأ الكود الذي كتبته والتعليقات، ويقترح إكمالاً ذكياً في الوقت الفعلي.\n\n## المميزات\n- إكمال كود في كل اللغات البرمجية\n- Copilot Chat: محادثة للشرح وإيجاد الأخطاء\n- يعمل مع جميع المحررات الشائعة\n- يتعلم من أسلوبك\n\n## الأداء\nيُنهي 30-50% من الكود تلقائياً لدى كثير من المطورين.",
    website: "https://github.com/features/copilot",
    logoUrl: "https://github.githubassets.com/images/modules/site/copilot/copilot.png",
    toolCategory: "coding",
    category: "coding",
    pricing: "paid",
    monthlyPrice: 10,
    pricingDetails: "10$/شهر للأفراد. مجاني لطلاب GitHub Education. 19$/شهر Business.",
    pros: [
      "مدمج في VS Code بسلاسة تامة",
      "يدعم جميع لغات البرمجة",
      "يوفر وقتاً هائلاً في كود متكرر",
      "Copilot Chat لشرح الكود وإيجاد البغز",
    ],
    cons: [
      "لا يوجد نسخة مجانية كاملة",
      "أحياناً يقترح كود خاطئ يبدو صحيحاً",
      "يحتاج مراجعة دائمة",
      "قد يُستخدم كوداً من مصادر مفتوحة بدون إسناد",
    ],
    useCases: ["تسريع كتابة الكود", "اقتراح دوال", "كتابة الاختبارات", "توثيق الكود"],
    arabicSupport: false,
    hasApi: false,
    tags: ["برمجة", "VS Code", "GitHub", "إكمال تلقائي"],
    relatedTopics: ["Cursor", "Tabnine", "Amazon CodeWhisperer"],
    featured: true,
    editorPick: true,
    published: true,
    seoTitle: "GitHub Copilot — أفضل مساعد برمجة بالذكاء الاصطناعي",
    seoDescription: "GitHub Copilot يكمل الكود تلقائياً داخل VS Code ويوفر Copilot Chat لشرح الكود وإيجاد الأخطاء.",
  },
  {
    name: "Cursor",
    slug: "cursor",
    tagline: "محرر كود ذكي مبني على VS Code مع AI في قلبه",
    descriptionAr:
      "Cursor محرر أكواد من الجيل التالي يبني على VS Code ويضع الذكاء الاصطناعي في مركز تجربة البرمجة. يتيح التحدث مع قاعدة الكود بأكملها وتعديل ملفات متعددة دفعة واحدة.",
    contentAr:
      "## ما هو Cursor؟\nCursor محرر كود يشبه VS Code لكن مع AI مدمج بعمق — لا مجرد إضافة.\n\n## المميزات الفريدة\n- Composer: يعدّل ملفات متعددة بأمر واحد\n- تحدث مع قاعدة كودك كاملة (Codebase Chat)\n- يفهم السياق من المشروع كله\n- يدعم GPT-4o وClaude Sonnet وGemini\n- Rules: تعليمات دائمة لكل مشروع\n\n## الفرق عن Copilot\nCopilot إضافة، Cursor محرر متكامل — الفرق كبير في العمق.",
    website: "https://cursor.sh",
    logoUrl: "https://cursor.sh/brand/icon.svg",
    toolCategory: "coding",
    category: "coding",
    pricing: "freemium",
    monthlyPrice: 20,
    pricingDetails: "Hobby مجاني مع حدود. Pro 20$/شهر. Business 40$/مستخدم/شهر.",
    pros: [
      "أقوى تجربة AI للمطورين حالياً",
      "Composer يعدّل ملفات متعددة بكلمات",
      "يفهم مشروعك بالكامل",
      "مبني على VS Code — تبديل سهل",
    ],
    cons: [
      "يستهلك رسائل AI بسرعة في الخطة المجانية",
      "تثبيت محرر جديد بدلاً من إضافة",
      "ثقيل نسبياً على الأجهزة القديمة",
    ],
    useCases: ["بناء مشاريع كاملة", "إعادة هيكلة الكود", "اكتشاف الأخطاء", "تعلم قواعد الكود"],
    arabicSupport: false,
    hasApi: false,
    tags: ["برمجة", "محرر كود", "VS Code", "AI مدمج"],
    relatedTopics: ["GitHub Copilot", "VS Code", "Windsurf"],
    featured: true,
    editorPick: false,
    published: true,
    seoTitle: "Cursor — محرر الكود الذكي الذي يفهم مشروعك بالكامل",
    seoDescription: "Cursor محرر كود مبني على VS Code يضع الذكاء الاصطناعي في مركز تجربة البرمجة مع Composer وCodebase Chat.",
  },

  // ══════════════════════════════════════════════
  // ✍️  كتابة
  // ══════════════════════════════════════════════
  {
    name: "Jasper AI",
    slug: "jasper-ai",
    tagline: "منصة الكتابة التسويقية بالذكاء الاصطناعي للفرق",
    descriptionAr:
      "Jasper AI منصة كتابة متكاملة مصممة للفرق التسويقية. تُنتج محتوى تسويقياً احترافياً بالحجم الكبير مع الحفاظ على هوية العلامة التجارية.",
    contentAr:
      "## ما هو Jasper؟\nJasper منصة كتابة AI للشركات والفرق التسويقية — ليس للأفراد فقط.\n\n## المميزات\n- Brand Voice: يتعلم صوت علامتك التجارية\n- قوالب لأكثر من 50 نوع محتوى\n- SEO mode مع Surfer SEO\n- تعاون الفريق في نفس الوثيقة\n- يدعم 30+ لغة\n\n## مناسب لـ\nالفرق التسويقية التي تنتج محتوى بكميات كبيرة.",
    website: "https://jasper.ai",
    logoUrl: "https://assets-global.website-files.com/60e5f2de011b86acebc30db7/60e5f2de011b8678dbc30dce_jasper-logo.svg",
    toolCategory: "writing",
    category: "writing",
    pricing: "paid",
    monthlyPrice: 39,
    pricingDetails: "Creator 39$/شهر. Pro 59$/شهر. Business سعر مخصص.",
    pros: [
      "يتعلم هوية العلامة التجارية",
      "تعاون الفريق في الوقت الفعلي",
      "قوالب جاهزة لكل نوع محتوى",
      "مدمج مع Surfer SEO",
    ],
    cons: [
      "مكلف مقارنة بالبدائل",
      "لا نسخة مجانية حقيقية",
      "الجودة العربية أقل من الإنجليزية",
    ],
    useCases: ["التسويق بالمحتوى", "إعلانات Google وFacebook", "البريد الإلكتروني", "المدونات"],
    arabicSupport: false,
    hasApi: true,
    tags: ["كتابة", "تسويق", "محتوى", "فرق"],
    relatedTopics: ["Copy.ai", "Writesonic", "ChatGPT"],
    featured: false,
    editorPick: false,
    published: true,
    seoTitle: "Jasper AI — منصة الكتابة التسويقية للفرق",
    seoDescription: "Jasper AI منصة كتابة AI للفرق التسويقية تتعلم صوت علامتك التجارية وتنتج محتوى احترافياً بالحجم.",
  },

  // ══════════════════════════════════════════════
  // 🎙️  صوت
  // ══════════════════════════════════════════════
  {
    name: "ElevenLabs",
    slug: "elevenlabs",
    tagline: "توليد أصوات بشرية واقعية بالذكاء الاصطناعي",
    descriptionAr:
      "ElevenLabs الرائد العالمي في تقنية تحويل النص إلى كلام. يُنتج أصواتاً بشرية لا تكاد تتميز عن الحقيقية، ويستنسخ أي صوت من عينة قصيرة.",
    contentAr:
      "## ما هو ElevenLabs؟\nElevenLabs منصة توليد صوت AI تحول النص إلى كلام بشري واقعي بجودة استثنائية.\n\n## المميزات\n- جودة صوتية تفوق كل المنافسين\n- استنساخ الصوت: اعطِهِ 30 ثانية وسيُقلّد صوتك\n- 30+ لغة بما فيها العربية\n- Voice Library: مكتبة أصوات جاهزة\n- API قوي للمطورين\n\n## الاستخدامات\nالبودكاست، الكتب الصوتية، شخصيات الألعاب، الإعلانات.",
    website: "https://elevenlabs.io",
    logoUrl: "https://elevenlabs.io/favicon.ico",
    toolCategory: "audio",
    category: "audio",
    pricing: "freemium",
    monthlyPrice: 5,
    pricingDetails: "مجاني 10,000 حرف/شهر. Starter 5$/شهر. Creator 22$/شهر.",
    pros: [
      "أعلى جودة صوتية في السوق",
      "استنساخ الصوت من عينة قصيرة",
      "يدعم العربية بجودة جيدة",
      "API متاح للمطورين",
    ],
    cons: [
      "النسخة المجانية محدودة جداً",
      "العربية أقل جودة من الإنجليزية",
      "قد تُستخدم لأغراض ضارة (Deepfake صوتي)",
    ],
    useCases: ["البودكاست", "الكتب الصوتية", "ألعاب الفيديو", "مساعدين افتراضيين"],
    arabicSupport: true,
    hasApi: true,
    tags: ["صوت", "TTS", "استنساخ صوت", "بودكاست"],
    relatedTopics: ["Murf AI", "Resemble AI", "Play.ht"],
    featured: false,
    editorPick: false,
    published: true,
    seoTitle: "ElevenLabs — توليد أصوات بشرية واقعية بالذكاء الاصطناعي",
    seoDescription: "ElevenLabs يحول النص إلى كلام بشري واقعي بجودة استثنائية ويستنسخ أي صوت من عينة قصيرة.",
  },

  // ══════════════════════════════════════════════
  // 🤖  نماذج لغوية / دردشة
  // ══════════════════════════════════════════════
  {
    name: "Claude",
    slug: "claude-anthropic",
    tagline: "نموذج لغوي من Anthropic يتفوق في التحليل والكتابة الطويلة",
    descriptionAr:
      "Claude من Anthropic نموذج لغوي متقدم يتميز بقدرته على تحليل المستندات الطويلة، الكتابة الأدبية العالية الجودة، والبرمجة الذكية. يُصمَّم بمبادئ أمان صارمة.",
    contentAr:
      "## ما هو Claude؟\nClaude نموذج لغوي من Anthropic، صُمِّم ليكون آمناً وصادقاً وذا قيمة حقيقية.\n\n## النماذج المتاحة\n- Claude Haiku: سريع وخفيف\n- Claude Sonnet: توازن مثالي\n- Claude Opus: الأقوى والأعمق\n\n## ما يتميز به\n- سياق 200,000 رمز (يقرأ كتباً كاملة)\n- كتابة إبداعية وأكاديمية ممتازة\n- تحليل PDF ومستندات طويلة\n- برمجة احترافية بشرح واضح\n\n## من يستخدمه؟\nالباحثون، الكتّاب، المطورون — من يحتاج تحليلاً عميقاً.",
    website: "https://claude.ai",
    logoUrl: "https://claude.ai/favicon.ico",
    toolCategory: "llm",
    category: "llm",
    pricing: "freemium",
    monthlyPrice: 20,
    pricingDetails: "مجاني مع حدود. Claude Pro 20$/شهر. API بالاستخدام.",
    pros: [
      "سياق ضخم 200K رمز",
      "كتابة إبداعية ممتازة",
      "أكثر أماناً وصدقاً",
      "تحليل مستندات طويلة",
    ],
    cons: [
      "لا يتصل بالإنترنت (بدون أدوات)",
      "أبطأ من GPT-4o أحياناً",
      "دعم العربية متوسط",
    ],
    useCases: ["تحليل المستندات", "الكتابة الأكاديمية", "البرمجة", "البحث والتلخيص"],
    arabicSupport: false,
    hasApi: true,
    tags: ["LLM", "Anthropic", "كتابة", "تحليل"],
    relatedTopics: ["ChatGPT", "Gemini", "Llama"],
    featured: false,
    editorPick: false,
    published: true,
    seoTitle: "Claude من Anthropic — النموذج اللغوي الأمثل للتحليل والكتابة",
    seoDescription: "Claude من Anthropic نموذج ذكاء اصطناعي يتفوق في تحليل المستندات الطويلة والكتابة الإبداعية بسياق 200K رمز.",
  },
];

async function main() {
  console.log(`\n🚀 بدء إدخال ${tools.length} كلي AI...\n`);
  let added = 0;
  let skipped = 0;

  for (const tool of tools) {
    const existing = await prisma.aITool.findUnique({ where: { slug: tool.slug } });
    if (existing) {
      console.log(`  ⏭️  موجود بالفعل: ${tool.name}`);
      skipped++;
      continue;
    }

    await prisma.aITool.create({ data: tool as Parameters<typeof prisma.aITool.create>[0]["data"] });
    console.log(`  ✅ أُضيف: ${tool.name} (${tool.toolCategory})`);
    added++;
  }

  console.log(`\n📊 النتيجة:`);
  console.log(`   ✅ أُضيف: ${added} كلي`);
  console.log(`   ⏭️  موجود مسبقاً: ${skipped} كلي`);
  console.log(`\n🎉 تم! افتح /admin/ai-tools لتراهم\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
