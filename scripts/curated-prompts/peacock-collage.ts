/**
 * Curated prompt — romantic peacock-green digital photo collage (scrapbook style).
 * Modular: swap outfit / pose / decorative elements / text (see variations).
 */
import type { CuratedPrompt } from "../add-curated-prompt";

const BASE = `A creative romantic digital photo collage featuring a woman in a peacock green frock. The main subject is a full-body cutout placed slightly left, turned back and smiling over her shoulder, wearing a peacock green embellished rich frock. Behind and around her is a semi-circular collage of multiple black-and-white portrait shots of the same woman, each in different expressions and poses, arranged in curved segments. The background is a soft light grey textured surface with a minimal aesthetic. Decorative elements include pink butterflies, a floral daisy near the center, red heart balloons, and cute love-themed stickers. Handwritten-style text elements like "Queen of Beauty", "I Love you", and "Capture the moment" are scattered around. A small heartbeat line with a heart icon is included. Soft shadows, smooth cutout blending, high-end Photoshop manipulation, photorealistic, high-end retouching, romantic mood, pastel tones, 4:5. No anatomy errors. Negative: distorted limbs, messy background, low resolution, clashing colors, blurry faces, over-saturated, cartoonish.`;

const BLUE_GOWN = `A creative romantic digital photo collage of a woman in a sequined midnight blue gown. Full-body cutout slightly left, looking directly at the camera. Around her, a semi-circular arrangement of black-and-white portraits of the same woman in varied expressions, in curved segments. Soft light grey textured minimal background. Decorative pink butterflies, floral daisy, red heart balloons and love stickers; handwritten-style quotes scattered. Soft shadows, smooth cutout blending, photorealistic high-end retouching, romantic pastel mood, 4:5. Negative: distorted limbs, messy background, low resolution, clashing colors, blurry faces, over-saturated, cartoonish.`;

const ROSE_ELEGANT = `A creative romantic digital photo collage of a woman in a boho-chic floral maxi dress, full-body cutout slightly left, laughing while walking. Semi-circular collage of black-and-white portraits of the same woman around her, curved segments. Soft light grey textured minimal background. Instead of butterflies, floating rose petals and delicate floral accents; subtle handwritten-style quotes. Soft shadows, smooth cutout blending, photorealistic high-end retouching, elegant romantic mood, pastel tones, 4:5. Negative: distorted limbs, messy background, low resolution, clashing colors, blurry faces, over-saturated, cartoonish.`;

const VINTAGE_FILM = `A creative digital photo collage of a woman in a peacock green embellished frock, full-body cutout slightly left, turned back over her shoulder. Semi-circular arrangement of black-and-white portraits of the same woman in curved segments. Soft light grey textured minimal background framed with vintage film borders and sprocket strips. Muted retro stickers and handwritten-style quotes. Soft shadows, smooth cutout blending, photorealistic high-end retouching, nostalgic romantic mood, 4:5. Negative: distorted limbs, messy background, low resolution, clashing colors, blurry faces, over-saturated, cartoonish.`;

const BODY_AR = `كولاج صور رقمي رومانسي إبداعي لامرأة بفستان أخضر طاووسي. الشخصية الرئيسية قصاصة (cutout) لكامل الجسم موضوعة إلى اليسار قليلًا، ملتفتة إلى الخلف تبتسم فوق كتفها، بفستان أخضر طاووسي غني مزخرف. خلفها وحولها كولاج نصف دائري من عدّة لقطات بورتريه بالأبيض والأسود للمرأة نفسها، كلّ بتعبير ووضعية مختلفة، مرتّبة في مقاطع منحنية. الخلفية سطح رمادي فاتح بملمس ناعم وجماليّة بسيطة. عناصر زخرفية: فراشات وردية، زهرة أقحوان قرب المركز، بالونات قلوب حمراء، وملصقات حبّ لطيفة. نصوص بخطّ اليد مثل "Queen of Beauty" و"I Love you" و"Capture the moment" منثورة حولها، مع خطّ نبضات قلب صغير وأيقونة قلب. ظلال ناعمة، مزج قصاصات سلس، معالجة فوتوشوب راقية، واقعي، مزاج رومانسي، ألوان باستيل، نسبة 4:5. بلا أخطاء تشريحية. سلبي: أطراف مشوّهة، خلفية فوضوية، دقة منخفضة، ألوان متنافرة، وجوه ضبابية، تشبّع مفرط، كرتوني.`;

const prompt: CuratedPrompt = {
  slug: "peacock-green-photo-collage",
  title: "Romantic Peacock Green Photo Collage",
  titleAr: "كولاج صور رومانسي باللون الأخضر الطاووسي",
  category: "image",
  modelHint: "DALL·E 3 (ChatGPT) · Midjourney · Flux",
  description:
    "برومبت لإنشاء كولاج صور رقمي رومانسي بأسلوب السكرابوك — قصاصة ملوّنة لكامل الجسم محاطة بلقطات بورتريه بالأبيض والأسود في ترتيب نصف دائري، مع فراشات وبالونات قلوب ونصوص بخطّ اليد. مثالي للسوشال ميديا والألبومات، وقابل للتخصيص (الفستان، الوضعية، الزخارف، النصوص).",
  body: BASE,
  bodyAr: BODY_AR,
  variations: [
    { label: "فستان أزرق ليلي بالترتر", text: BLUE_GOWN },
    { label: "بتلات ورد (أناقة)", text: ROSE_ELEGANT },
    { label: "إطارات فيلم عتيقة", text: VINTAGE_FILM },
  ],
  tips: [
    "استخدم عدسة 85mm وفتحة f/2.8 لعزل الخلفية وإبراز الشخصية.",
    "نسبة 4:5 لمنشورات السوشال، و9:16 للستوري على الجوال.",
    "حافظ على اتساق درجة الأخضر الطاووسي عبر كل طبقات الصورة.",
    "لأي خطأ في اليدين أو الوجوه استخدم in-painting أو vary region لإصلاح الجزء فقط، وزِد وزن 'minimalist background' لمنع الفوضى.",
  ],
  useCases: ["منشورات رومانسية", "سكرابوك رقمي", "ألبومات", "هدايا", "ستوري سوشال"],
  imagePrompt: BASE,
};

export default prompt;
