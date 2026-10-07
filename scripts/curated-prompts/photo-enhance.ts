/**
 * Curated prompt — professional AI photo enhancement (5 editing passes).
 * Reference-based: upload your photo + the prompt in a multimodal editor.
 */
import type { CuratedPrompt } from "../add-curated-prompt";

const CAMERA_LOOK = `Act as a high-end professional photo retoucher. Transform the uploaded photo to look as if it were captured with a full-frame professional camera and a fast premium lens. Refine depth of field, natural lens character, exposure, dynamic range, lighting, and color while preserving realistic detail. Keep the person's face, body, expression, clothing, proportions, and identity exactly unchanged. The final result should look premium, natural, and genuinely camera-shot — not AI-generated.`;

const BACKGROUND_CLEANUP = `Act as a professional portrait retoucher. Clean and simplify the background of the uploaded photo while keeping the subject completely untouched. Remove distracting objects, clutter, harsh visual elements, and unnecessary details without changing the original setting. Match the lighting, shadows, perspective, and edges naturally so the final image looks professionally photographed and realistically edited.`;

const LIGHT_COLOR = `Act as a professional colorist and photo editor. Correct the lighting and color of the uploaded photo for a polished, high-end result. Balance white balance, exposure, highlights, shadows, contrast, and skin tones while preserving natural texture and realistic colors. Create a clean, consistent cinematic grade that looks professional without appearing over-edited or artificial.`;

const GOLDEN_HOUR = `Act as a professional cinematic photo editor. Transform the lighting in the uploaded photo into a realistic golden-hour look. Add warm directional sunlight, soft long shadows, natural highlights, and a beautifully balanced warm color temperature. Preserve every person, object, pose, facial feature, and original composition exactly as they are. Make the lighting physically believable and seamless — as if the photo was actually captured at golden hour.`;

const PRINT_READY = `Act as a professional print-production specialist. Prepare the uploaded photo for high-quality printing at [SIZE]. Optimize the crop, resolution, sharpness, noise, contrast, and color reproduction while preserving natural details and skin texture. Create a print-ready result with the correct composition and professional finishing. Do not invent missing details or alter the subject's identity, face, body, or original content.`;

const BODY_AR = `تصرّف كمحترف تنقيح صور راقٍ. حوّل الصورة المرفوعة لتبدو وكأنها التُقطت بكاميرا احترافية فل-فريم (full-frame) وعدسة بريميوم سريعة. حسّن عمق المجال، وطابع العدسة الطبيعي، والتعريض، والمدى الديناميكي، والإضاءة، والألوان مع الحفاظ على التفاصيل الواقعية. أبقِ وجه الشخص وجسمه وتعبيره وملابسه ونسبه وهويته دون أي تغيير. يجب أن تبدو النتيجة فاخرة وطبيعية وكأنها ملتقطة بكاميرا حقيقية — لا مولّدة بالذكاء الاصطناعي.`;

const prompt: CuratedPrompt = {
  slug: "professional-photo-enhancement",
  title: "Professional AI Photo Enhancement",
  titleAr: "تحسين الصور الاحترافي بالذكاء الاصطناعي",
  category: "image",
  modelHint: "ChatGPT · Gemini (تحرير الصور برفعها)",
  description:
    "خمسة برومبتات احترافية لتحسين صورك برفعها إلى ChatGPT أو Gemini — مظهر الكاميرا الاحترافية، تنظيف الخلفية، تصحيح الإضاءة والألوان، لمسة الساعة الذهبية، والتجهيز للطباعة. تحافظ جميعها على هوية الشخص وملامحه دون تغيير.",
  body: CAMERA_LOOK,
  bodyAr: BODY_AR,
  variations: [
    { label: "تنظيف الخلفية", text: BACKGROUND_CLEANUP },
    { label: "تصحيح الإضاءة والألوان", text: LIGHT_COLOR },
    { label: "إضاءة الساعة الذهبية", text: GOLDEN_HOUR },
    { label: "تجهيز للطباعة", text: PRINT_READY },
  ],
  tips: [
    "هذه البرومبتات تُحسّن صورتك الحالية برفعها — لا تُنشئ صورة جديدة.",
    "لا تحذف عبارة الحفاظ على الهوية/الوجه — فهي ما يمنع تغيّر الملامح.",
    "استخدم التنويعات بالتتابع: نظّف الخلفية ثم صحّح الإضاءة ثم أضف اللمسة الذهبية.",
    "في برومبت الطباعة استبدل [SIZE] بالمقاس المطلوب (مثل A4 أو 30×40 سم).",
  ],
  useCases: ["تحسين صور الجوال", "صور المنتجات", "البورتريهات", "صور العقارات", "التجهيز للطباعة"],
  imagePrompt:
    "Professional high-end photo retouching result, full-frame camera look, balanced cinematic color grade, natural realistic detail, before-and-after enhancement, premium editorial quality",
};

export default prompt;
