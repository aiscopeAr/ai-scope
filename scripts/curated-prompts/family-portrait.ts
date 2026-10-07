/**
 * A curated prompt, added via scripts/add-curated-prompt.ts.
 * Five viral "family portrait" poses → one featured prompt whose main body is
 * pose #1 and whose variations are the other four.
 */
import type { CuratedPrompt } from "../add-curated-prompt";

const POSE_1 = `Scene:
Create a photorealistic black-and-white studio family portrait inspired by the reference, featuring a father, mother, and young son in a playful coordinated pose.
Composition:
Vertical 9:16. Three people arranged vertically and closely together. Dad stands behind, Mom in the middle, Son in front. Dad gently frames Mom's face with both hands, while Mom gently frames Son's face with both hands. Straight-on camera, centered symmetrical composition.
Subject:
A loving father, mother, and young son creating a fun and affectionate family portrait.
Expression:
Dad gives a confident playful smile. Mom gives a soft charming smile. Son makes a cute slightly puckered-lips expression while looking directly at the camera.
Hair & Face (Mandatory):
Preserve the original identity, facial structure, eyes, nose, lips, jawline, hairstyle and natural skin texture of every person exactly. No facial reshaping or beautification.
Outfit:
Dad wears a black formal suit with a white shirt. Mom wears an elegant dark traditional/formal outfit. Son wears a plain black T-shirt.
Background:
Minimal seamless black studio background.
Several People:
Exactly 3 people only: Dad, Mom, and Son.
Lighting:
Soft frontal studio lighting, subtle shadows, detailed faces and hands, realistic photographic depth.
Colour Grading:
Elegant pure black-and-white monochrome, rich blacks, smooth gray tones, realistic highlights, subtle cinematic film grain.
Negative Prompt:
No face alteration, no extra people, no duplicated faces, no extra fingers, distorted hands, bad anatomy, plastic skin, excessive retouching, CGI, cartoon, color, watermark, text, blur.
Output:
Ultra-realistic iPhone 15 Pro Max photography, high detail, natural skin texture, professional black-and-white studio portrait, vertical 9:16.`;

const POSE_2 = `Scene:
Create a timeless photorealistic black-and-white family studio portrait with a playful but elegant composition.
Composition:
Vertical 9:16. Dad stands directly behind Mom, placing both hands gently on her shoulders. Mom stands in front of Dad with her hands resting gently on Son's shoulders. Son stands in front of Mom. Tight symmetrical framing, straight-on camera, intimate family arrangement.
Expression:
Dad gives a subtle playful wink. Mom gives a warm gentle smile. Son makes a cute serious/playful expression with slightly pursed lips.
Hair & Face (Mandatory):
Keep every person's original face and identity completely unchanged. Preserve facial proportions, eyes, nose, lips, jawline, hairstyle, skin texture and natural age. No beautification or facial reconstruction.
Outfit:
Dad in a sophisticated black suit and white shirt. Mom in an elegant dark embroidered traditional/formal outfit. Son in a simple black T-shirt.
Background:
Plain dark seamless studio background.
Lighting:
Soft diffused studio lighting, subtle rim light around hair and shoulders, realistic shadows and natural facial detail.
Negative Prompt:
No face swap, no altered identity, no beauty filter, no skin smoothing, no extra fingers, malformed hands, extra limbs, duplicated people, CGI, cartoon, color, text, watermark.
Output:
Photorealistic iPhone 15 Pro Max look, high resolution, natural skin texture, realistic anatomy, cinematic monochrome studio photography, 9:16.`;

const POSE_3 = `Scene:
Create a highly realistic black-and-white family portrait with a playful intimate studio atmosphere.
Composition:
Vertical 9:16. Dad positioned behind and slightly above Mom, Mom positioned behind Son, with all three faces aligned vertically. Dad gently rests his chin above Mom's head, while Mom gently rests her chin above Son's head. All faces clearly visible, centered composition.
Expression:
Dad gives a playful wink. Mom gives a soft puckered-lips expression. Son gives a cute exaggerated kiss-face expression.
Hair & Face (Mandatory):
Preserve the exact original identity and facial characteristics of all three people. Keep original eyes, nose, lips, jawline, facial proportions, hairstyle, skin texture and natural imperfections. Do not modify faces.
Outfit:
Dad wears a classic black suit and white shirt. Mom wears a sophisticated dark traditional/formal outfit. Son wears a plain black T-shirt.
Background:
Completely dark seamless studio background with a clean editorial appearance.
Lighting:
Soft frontal portrait lighting with gentle side shadows, realistic skin highlights and detailed facial texture.
Negative Prompt:
No altered faces, no face replacement, no artificial beauty, no plastic skin, no distorted anatomy, no extra fingers, no extra arms, no duplicated subjects, no color, no CGI, no cartoon, no text, no watermark.
Output:
Ultra-realistic professional studio photography, iPhone 15 Pro Max quality, sharp natural details, realistic skin and hair, vertical 9:16.`;

const POSE_4 = `Scene:
Create a photorealistic black-and-white family studio portrait with a creative circular hand-framing pose.
Composition:
Vertical 9:16. Dad stands behind Mom, Mom stands behind Son. Dad places both hands around the sides of Mom's face, while Mom places both hands around the sides of Son's face. Their faces form a clean vertical composition with overlapping hands creating natural framing.
Expression:
Dad gives a playful closed-mouth smile. Mom gives a gentle kiss-face expression. Son gives a cute playful smile with slightly pursed lips.
Hair & Face (Mandatory):
Preserve each person's exact facial identity. Keep original facial structure, eyes, nose, lips, jawline, hairstyle, skin texture and natural proportions unchanged. Absolutely no face reshaping or beautification.
Outfit:
Dad wears a black tailored formal suit with a white shirt. Mom wears an elegant dark traditional/formal outfit with subtle embroidery. Son wears a plain black T-shirt.
Background:
Dark matte black seamless studio backdrop.
Lighting:
Professional softbox lighting, soft highlights on faces and hands, controlled shadows, realistic skin texture and dimensionality.
Negative Prompt:
No facial changes, no face swap, no beauty filter, no excessive skin smoothing, no distorted hands, no extra fingers, no extra limbs, no duplicated subjects, no unnatural anatomy, no CGI, no cartoon, no color, no text, no watermark.
Output:
Ultra-realistic black-and-white family photography, iPhone 15 Pro Max camera look, high resolution, natural skin texture, realistic hands, cinematic studio lighting, vertical 9:16.`;

const POSE_5 = `Scene:
Create a photorealistic black-and-white studio family portrait matching the reference image as closely as possible, intimate and playful family photography.
Composition:
Vertical 9:16 portrait. Three people arranged in a centered vertical composition: Dad at the top, Mom in the middle, Son in front/bottom. Dad gently places both hands over Mom's head, while Mom places both hands over Son's head. Son rests his face between both hands. Symmetrical framing, medium close-up, camera straight-on, natural proportions.
Expression:
Dad winks with one eye and gives a subtle playful smile. Mom makes a cute puckered-lips expression. Son also makes a cute puckered-lips expression while resting his cheeks on his hands.
Hair & Face (Mandatory):
Preserve each person's original identity, facial structure, eyes, nose, lips, jawline, skin texture, hairstyle and natural facial proportions exactly. Do not beautify, reshape, or alter faces.
Outfit:
Dad wears an elegant black formal suit with a white dress shirt. Mom wears an elegant dark traditional/formal outfit with subtle embroidered details. Son wears a simple plain black T-shirt.
Background:
Dark black seamless studio background with no distractions.
Lighting:
Soft professional studio lighting from the front, gentle highlights on faces and hands, controlled shadows, high facial detail, realistic photographic depth.
Negative Prompt:
No face alteration, no face swap, no beautification, no plastic skin, no excessive smoothing, no distorted hands, no extra fingers, no missing fingers, no extra people, no duplicated body parts, no unnatural anatomy, no color, no cartoon, no CGI, no artificial-looking skin, no excessive HDR, no blur, no watermark, no text.
Output:
Ultra-realistic professional family photography, highly detailed, natural skin texture, realistic hands, precise facial identity preservation, iPhone 15 Pro Max photographic look, vertical 9:16, cinematic black-and-white portrait.`;

const BODY_AR = `المشهد: أنشئ بورتريه عائليًا استوديو واقعيًا بالأبيض والأسود مستوحى من الصورة المرجعية، يضم أبًا وأمًا وابنًا صغيرًا في وضعية منسّقة ومرحة.
التكوين: عمودي 9:16. ثلاثة أشخاص مرتّبون عموديًا ومتقاربون. الأب في الخلف، الأم في الوسط، الابن في الأمام. يؤطّر الأب وجه الأم بكلتا يديه، بينما تؤطّر الأم وجه الابن بكلتا يديها. الكاميرا من الأمام مباشرة، تكوين متماثل ومتمركز.
التعبيرات: الأب يبتسم بثقة ومرح، الأم بابتسامة لطيفة ساحرة، الابن يضمّ شفتيه قليلًا بتعبير لطيف وينظر مباشرة إلى الكاميرا.
الشعر والوجه (إلزامي): حافظ على الهوية الأصلية وبنية الوجه والعينين والأنف والشفاه وخط الفك وتسريحة الشعر وملمس البشرة لكل شخص بدقة. بلا إعادة تشكيل أو تجميل.
الملابس: الأب ببدلة رسمية سوداء وقميص أبيض، الأم بزيّ تقليدي/رسمي داكن أنيق، الابن بقميص أسود بسيط.
الخلفية: خلفية استوديو سوداء ناعمة بلا تشتيت.
الإضاءة: إضاءة أمامية ناعمة، ظلال خفيفة، تفاصيل دقيقة للوجوه والأيدي.
تدرّج الألوان: أبيض وأسود أحادي أنيق، أسود غني، تدرّجات رمادية ناعمة، حبيبات فيلم سينمائية خفيفة.
Negative Prompt: بلا تعديل للوجه، بلا أشخاص إضافيين، بلا وجوه مكرّرة، بلا أصابع زائدة، أيدٍ مشوّهة، تشريح سيئ، بشرة بلاستيكية، تنعيم مفرط، CGI، كرتون، ألوان، علامة مائية، نص، ضبابية.
الناتج: تصوير واقعي فائق بجودة iPhone 15 Pro Max، بورتريه استوديو احترافي بالأبيض والأسود، عمودي 9:16.`;

const prompt: CuratedPrompt = {
  slug: "black-white-family-portrait",
  title: "Professional Black & White Family Portrait",
  titleAr: "بورتريه عائلي احترافي بالأبيض والأسود",
  category: "image",
  modelHint: "Gemini · ChatGPT · Midjourney (مع صورة مرجعية)",
  description:
    "برومبت احترافي لإنشاء بورتريه عائلي أنيق بالأبيض والأسود بأسلوب استوديو سينمائي (عمودي 9:16، بجودة iPhone 15 Pro Max). ارفع صورة عائلتك المرجعية مع البرومبت ليحافظ على الملامح الأصلية مع وضعية إبداعية. يتضمّن خمس وضعيات جاهزة للاختيار.",
  body: POSE_1,
  bodyAr: BODY_AR,
  variations: [
    { label: "وضعية اليدين على الكتفين", text: POSE_2 },
    { label: "وضعية الذقن فوق الرأس", text: POSE_3 },
    { label: "تأطير الوجه بشكل دائري", text: POSE_4 },
    { label: "وضعية اليدين فوق الرأس", text: POSE_5 },
  ],
  tips: [
    "ارفع صورة مرجعية واضحة للوجوه حتى يحافظ النموذج على الهوية بدقة.",
    "لا تحذف قسم Negative Prompt — فهو ما يمنع تشوّه الأيدي والوجوه.",
    "صيغة 9:16 مثالية لقصص إنستغرام وواتساب.",
    "جرّب الوضعيات المختلفة من التنويعات واختر الأنسب لعائلتك.",
  ],
  useCases: ["صور عائلية", "هدايا", "قصص إنستغرام", "بطاقات تهنئة", "ألبومات"],
  imagePrompt:
    "Photorealistic black-and-white studio family portrait of a father, mother and young son, elegant monochrome, soft frontal studio lighting, dark seamless background, 9:16 vertical, cinematic editorial photography, high detail, realistic skin texture",
};

export default prompt;
