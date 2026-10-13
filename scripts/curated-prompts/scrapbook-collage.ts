/**
 * Curated prompt — vintage scrapbook memory collage (same person, many poses).
 * Reference-based: upload your photo(s); modular palette/poses/aesthetic.
 */
import type { CuratedPrompt } from "../add-curated-prompt";

const BASE = `Create one beautiful, high-quality photorealistic scrapbook-style collage by combining the visual style and elements of both reference images. Use the woman's face and overall appearance consistently throughout the entire collage. Create multiple artistic photo frames showing the same woman in different natural poses and expressions: smiling, making a peace sign, gently touching her cheeks, making a heart shape with her hands, taking a selfie, sitting casually, and looking confidently at the camera.
Use a warm vintage beige background with layered paper textures, torn newspaper pieces, wooden and Polaroid-style photo frames, handwritten-style decorative elements, small hearts, stars, flowers, film strips, vintage cameras, books, and cute scrapbook stickers. Arrange the photos creatively at different angles, with one larger main portrait in the center and several smaller surrounding photographs.
Keep the woman's face, hairstyle, skin tone, facial features, and identity consistent in every photograph. Give her a stylish coordinated outfit inspired by both references, with beautiful green and cream tones, realistic fabric texture, elegant casual fashion, and white sneakers where visible. Use warm cinematic lighting, soft shadows, realistic photography, detailed hair strands, natural skin texture, sharp facial details, professional editorial photography, aesthetically pleasing composition, cozy youthful atmosphere, premium Pinterest-style scrapbook aesthetic.
Make the final image look like a real handmade memory board mixed with professional photography. High resolution, ultra-detailed, photorealistic, natural expressions, realistic hands and fingers, consistent proportions, beautiful depth, balanced composition, no distorted faces, no extra limbs, no duplicate body parts, no watermark.`;

const AUTUMN = `Photorealistic, warm cinematic lighting. A vintage scrapbook-style collage of the same woman (keep her face, hairstyle and identity consistent) in many natural poses — smiling, peace sign, heart hands, selfie, sitting casually. Warm beige layered-paper background with torn newsprint, Polaroid and wooden frames, handwritten doodles, film strips and stickers; one large central portrait with smaller surrounding photos. Outfit in monochromatic autumn knits (rust, camel, cream), realistic fabric texture, elegant casual. Golden-hour soft shadows, sharp faces, 4:5. Negative: distorted hands, extra limbs, watermark, blurry text, low resolution.`;

const DENIM = `Photorealistic, warm cinematic lighting. A scrapbook-style collage of the same woman (consistent facial structure and identity) in varied candid poses. Warm beige layered-paper background with Polaroids, torn newspaper, doodles, hearts and stickers; large central portrait with smaller frames around. Outfit in denim and soft pastel layers, realistic fabric texture, youthful casual fashion, white sneakers. Natural skin texture, detailed hair strands, soft shadows, 4:5. Negative: distorted hands, extra limbs, watermark, blurry text, low resolution.`;

const ZINE = `Photorealistic, warm cinematic lighting. A modern minimalist digital-zine collage of the same woman (keep identity consistent across frames) in several natural poses. Clean off-white background with subtle grain, thin frames, minimal sans-serif captions and small accent shapes instead of heavy vintage clutter; one large central portrait with a tidy grid of smaller photos. Coordinated green-and-cream outfit, realistic fabric, elegant casual. Sharp editorial detail, soft shadows, 4:5. Negative: distorted hands, extra limbs, watermark, blurry text, low resolution.`;

const BODY_AR = `أنشئ كولاجًا واحدًا عالي الجودة وواقعيًا بأسلوب السكرابوك بدمج العناصر والأسلوب البصري من الصورتين المرجعيتين. حافظ على وجه المرأة ومظهرها العام ثابتًا في كامل الكولاج. أنشئ عدّة إطارات صور فنية تُظهر المرأة نفسها بوضعيات وتعبيرات طبيعية مختلفة: ابتسامة، إشارة السلام، لمس الخدّين برفق، تشكيل قلب باليدين، سيلفي، جلسة عفوية، ونظرة واثقة إلى الكاميرا.
استخدم خلفية بيج فينتج دافئة بطبقات ورقية، قصاصات جرائد ممزّقة، إطارات خشبية وبولارويد، عناصر زخرفية بخطّ اليد، قلوب ونجوم وزهور صغيرة، أشرطة فيلم، كاميرات قديمة، كتب، وملصقات سكرابوك لطيفة. رتّب الصور بزوايا مختلفة بإبداع، مع بورتريه رئيسي أكبر في المركز وعدّة صور أصغر حوله.
أبقِ وجه المرأة وتسريحتها ولون بشرتها وملامحها وهويّتها ثابتة في كل صورة. امنحها إطلالة أنيقة منسّقة مستوحاة من المرجعين بدرجات أخضر وكريمي جميلة، ملمس قماش واقعي، أزياء كاجوال أنيقة، وحذاء أبيض حيث يظهر. إضاءة سينمائية دافئة، ظلال ناعمة، تصوير واقعي، خصلات شعر مفصّلة، ملمس بشرة طبيعي، تفاصيل وجه حادّة، تصوير تحريري احترافي، تكوين متناسق، أجواء شبابية دافئة، جماليّة سكرابوك راقية بأسلوب Pinterest.
اجعل النتيجة تبدو كلوحة ذكريات يدوية حقيقية ممزوجة بتصوير احترافي. دقة عالية، تفاصيل فائقة، واقعي، تعبيرات طبيعية، أيدٍ وأصابع واقعية، نسب ثابتة، عمق جميل، تكوين متوازن، بلا وجوه مشوّهة، بلا أطراف زائدة، بلا أجزاء مكرّرة، بلا علامة مائية.`;

const prompt: CuratedPrompt = {
  slug: "scrapbook-memory-collage",
  title: "Vintage Scrapbook Memory Collage",
  titleAr: "كولاج ذكريات بأسلوب السكرابوك الفينتج",
  category: "image",
  modelHint: "Gemini · ChatGPT · Midjourney · Flux (مع صور مرجعية)",
  description:
    "برومبت لإنشاء لوحة ذكريات (سكرابوك) واقعية تجمع الشخص نفسه بعدّة وضعيات وتعبيرات، على خلفية بيج فينتج بطبقات ورقية وإطارات بولارويد وملصقات. ارفع صورتك المرجعية للحفاظ على الهوية. مثالي للسوشال والألبومات، وقابل للتخصيص (الألوان، الوضعيات، الأسلوب).",
  body: BASE,
  bodyAr: BODY_AR,
  variations: [
    { label: "ألوان خريفية (كنزات)", text: AUTUMN },
    { label: "دنيم وطبقات باستيل", text: DENIM },
    { label: "زين رقمي مينيمال", text: ZINE },
  ],
  tips: [
    "ضع 'photorealistic' و'warm cinematic lighting' في بداية البرومبت لأهميتهما.",
    "استخدم عدسة 50mm أو 85mm مع bokeh في الخلفية وإبقاء البورتريه الرئيسي حادًّا.",
    "للحفاظ على ثبات الوجه عبر الإطارات شدّد على 'consistent facial structure' أو استخدم seed/in-painting.",
    "نسبة 4:5 للسكرابوك أو 9:16 للستوري؛ وأضف سلبيات: distorted hands, extra limbs, watermark, blurry text, low resolution.",
  ],
  useCases: ["لوحة ذكريات", "منشورات سوشال", "ألبومات", "هدايا", "بورتفوليو"],
  imagePrompt: BASE,
};

export default prompt;
