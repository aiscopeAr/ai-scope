/**
 * Curated prompt — cinematic film-noir black-and-white portrait.
 * Reference-based: upload your photo + this prompt for a realistic result.
 */
import type { CuratedPrompt } from "../add-curated-prompt";

const BODY = `Ultra-realistic cinematic black-and-white portrait of a person with tousled wavy dark hair and classic round black eyeglasses, seated in a luxurious dark leather armchair. They wear a perfectly tailored black blazer over a black turtleneck, with one hand resting naturally near the neck and a sophisticated metal luxury wristwatch visible on the wrist. Calm, confident, slightly mysterious expression, looking directly toward the camera.
Extremely low-key chiaroscuro lighting, a single narrow window light cutting diagonally across the scene and illuminating one side of the face while the other side falls into deep shadow. Strong geometric light and shadow patterns on the textured wall, deep blacks, crisp highlights, rich monochrome tonal range, subtle analog film grain, realistic skin pores, detailed hair strands, natural facial proportions, soft background falloff, dark elegant interior, intimate luxury editorial mood, timeless film-noir aesthetic. Shot on a professional camera with an 85mm lens, shallow depth of field, cinematic composition, high contrast, photorealistic, refined photographic texture, vertical 4:5 composition, no color, no text, no watermark.`;

const BODY_AR = `بورتريه سينمائي واقعي فائق بالأبيض والأسود لشخص بشعر داكن مموّج ومنكوش ونظارات طبية سوداء دائرية كلاسيكية، يجلس على كرسي جلدي داكن فاخر. يرتدي بليزر أسود مفصّلاً بإتقان فوق قميص برقبة عالية أسود، مع يد مستقرّة طبيعيًا قرب الرقبة وساعة معصم معدنية فاخرة ظاهرة. تعبير هادئ وواثق وغامض قليلًا، ينظر مباشرة إلى الكاميرا.
إضاءة منخفضة جدًا بأسلوب الكياروسكورو (chiaroscuro)، ضوء نافذة ضيّق واحد يقطع المشهد قطريًا فيضيء جانبًا من الوجه بينما يغرق الآخر في ظلّ عميق. أنماط ضوء وظلّ هندسية قوية على الجدار، أسود عميق، إبرازات حادة، تدرّج أحادي غني، حبيبات فيلم خفيفة، مسام بشرة واقعية، تفاصيل خصلات الشعر، نسب وجه طبيعية، خلفية داكنة أنيقة، مزاج تحريري فاخر وحميم، جمالية الفيلم نوار الخالدة. مصوّر بعدسة 85mm، عمق مجال ضحل، تكوين سينمائي، تباين عالٍ، واقعي، عمودي 4:5، بلا ألوان، بلا نص، بلا علامة مائية.`;

const prompt: CuratedPrompt = {
  slug: "cinematic-film-noir-portrait",
  title: "Cinematic Film-Noir Black & White Portrait",
  titleAr: "بورتريه سينمائي فاخر بالأبيض والأسود (فيلم نوار)",
  category: "image",
  modelHint: "Gemini · ChatGPT · Midjourney (مع صورة مرجعية)",
  description:
    "برومبت احترافي لإنشاء بورتريه سينمائي أنيق بالأبيض والأسود بأسلوب الفيلم نوار — إضاءة جانبية درامية (chiaroscuro)، عدسة 85mm، عمق مجال ضحل، ومزاج تحريري فاخر (عمودي 4:5). ارفع صورتك المرجعية مع البرومبت للحصول على نتيجة واقعية تحافظ على ملامحك.",
  body: BODY,
  bodyAr: BODY_AR,
  tips: [
    "ارفع صورة مرجعية واضحة للوجه حتى يحافظ النموذج على هويتك.",
    "الإضاءة الجانبية القوية (chiaroscuro) هي سرّ المظهر السينمائي — لا تخفّفها.",
    "صيغة 4:5 العمودية مثالية للبورتريه ولملفات التواصل المهنية.",
    "أبقِ على no color / no text — يضمنان الأبيض والأسود النقي بلا تشويش.",
  ],
  useCases: ["صورة شخصية احترافية", "لينكدإن", "بورتريه فني", "صورة الملف الشخصي", "هدية"],
  imagePrompt: BODY,
};

export default prompt;
