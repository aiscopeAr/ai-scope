/**
 * Curated prompt — delicate watercolor portrait illustration.
 * Modular: swap subject / palette / clothing (see variations).
 */
import type { CuratedPrompt } from "../add-curated-prompt";

const BASE = `A delicate watercolor portrait of a young woman with long, voluminous, wavy copper-red hair flowing loosely and windswept around her face. She has fair skin with soft freckles across her nose and cheeks, gentle grey-blue eyes with a dreamy, faraway gaze looking slightly upward, and soft rosy lips in a calm, thoughtful expression. She rests her cheek against her hand, fingers lightly touching her face. She wears a loose, flowing white blouse with full puffed sleeves and gathered cuffs, fully covered and modest, painted with soft grey and warm beige shadow washes. Behind her, loose watercolor splashes and ink splatters in coral, peach, salmon pink and charcoal grey bleed outward from her hair. Fine pencil linework is visible under the transparent washes, with wet-on-wet blending, visible cold-press paper texture, and a clean off-white paper background. Soft, airy, romantic, editorial illustration mood, warm earthy palette, high detail, vertical 4:5 portrait composition. Negative: photograph, 3d render, plastic skin, oversaturated, messy lines.`;

const COOL = `A delicate watercolor portrait of a young woman with long wavy auburn hair, fair freckled skin and dreamy grey-blue eyes, resting her cheek on her hand. Loose flowing white blouse, modest and fully covered. Behind her, watercolor splashes and ink splatters in cerulean, soft mint, powder blue and charcoal grey bleed from her hair. Fine pencil linework under transparent wet-on-wet washes, cold-press paper texture, off-white background. Serene, cool, airy editorial illustration, vertical 4:5. Negative: photograph, 3d render, plastic skin, oversaturated, messy lines.`;

const VINTAGE = `A delicate watercolor portrait of a young woman with wavy hair and soft freckles, dreamy gaze, cheek resting on her hand, in a loose modest high-neck blouse. Behind her, watercolor splashes and ink splatters in sepia, ochre, warm brown and faded grey bleed from her hair. Fine pencil linework under transparent wet-on-wet washes, cold-press paper texture, aged off-white background. Nostalgic, vintage, melancholic editorial illustration mood, vertical 4:5. Negative: photograph, 3d render, plastic skin, oversaturated, messy lines.`;

const YOUNG_MAN = `A delicate watercolor portrait of a young man with short tousled copper hair, fair freckled skin and calm thoughtful grey-blue eyes, hand lightly touching his jaw. He wears a loose linen shirt with rolled sleeves, modest. Behind him, watercolor splashes and ink splatters in coral, peach and charcoal grey bleed outward. Fine pencil linework under transparent wet-on-wet washes, cold-press paper texture, off-white background. Soft, romantic, editorial illustration, warm earthy palette, high detail, vertical 4:5. Negative: photograph, 3d render, plastic skin, oversaturated, messy lines.`;

const BODY_AR = `بورتريه بألوان مائية ناعمة لفتاة بشعر نحاسي-أحمر طويل كثيف ومموّج ينساب حول وجهها كأنّ الريح تداعبه. بشرة فاتحة بنمش خفيف على الأنف والخدّين، عينان رماديتان-زرقاوان حالمتان تنظران إلى الأعلى قليلًا، وشفتان ورديتان بتعبير هادئ متأمّل. تسند خدّها إلى يدها وأناملها تلامس وجهها برفق. ترتدي بلوزة بيضاء فضفاضة محتشمة بأكمام منفوخة واسعة، مرسومة بظلال رمادية وبيج دافئة. خلفها تنتشر رشّات ألوان مائية وبقع حبر بألوان مرجانية وخوخية ووردية ورمادية فحمية تنزف من شعرها. خطوط رصاص رفيعة تظهر تحت الطبقات الشفافة، مع مزج wet-on-wet وملمس ورق cold-press وخلفية ورقية بيضاء مائلة للعاج. أجواء ناعمة رومانسية تحريرية، لوحة ألوان ترابية دافئة، تفاصيل عالية، تكوين عمودي 4:5. سلبي: صورة فوتوغرافية، رندر ثلاثي الأبعاد، بشرة بلاستيكية، تشبّع مفرط، خطوط فوضوية.`;

const prompt: CuratedPrompt = {
  slug: "watercolor-portrait-illustration",
  title: "Delicate Watercolor Portrait Illustration",
  titleAr: "بورتريه بألوان مائية (رسم تحريري ناعم)",
  category: "image",
  modelHint: "DALL·E 3 (ChatGPT) · Midjourney · Flux",
  description:
    "برومبت فني لإنشاء بورتريه بألوان مائية ناعمة بأسلوب تحريري رومانسي — شعر منساب، نمش رقيق، رشّات حبر ومزج wet-on-wet، وملمس ورق cold-press. مثالي لأغلفة المجلات ورسوم الكتب والمطبوعات الفنية، وقابل للتخصيص (الشخصية، لوحة الألوان، الملابس).",
  body: BASE,
  bodyAr: BODY_AR,
  variations: [
    { label: "لوحة ألوان باردة (أزرق ونعناعي)", text: COOL },
    { label: "نسخة عتيقة (سيبيا وأوكر)", text: VINTAGE },
    { label: "بورتريه شاب", text: YOUNG_MAN },
  ],
  tips: [
    "استخدم نسبة 4:5 أو 9:16 لإبراز البورتريه العمودي.",
    "لعمق مجال ناعم (خلفية ضبابية) اطلب إحساس f/1.8–f/2.8 وإضاءة نافذة شمالية ناعمة.",
    "إن بدت النتيجة رقمية جدًا أضِف سلبيات: photograph, 3d render, plastic skin, oversaturated, messy lines.",
    "في Midjourney جرّب ‎--stylize 250‎، وشدّد على 'cold-press paper texture' و'ink splashes' إذا خفتت اللمسة المائية.",
  ],
  useCases: ["أغلفة مجلات", "رسوم كتب", "مطبوعات فنية", "بورتريه فني", "بطاقات"],
  imagePrompt: BASE,
};

export default prompt;
