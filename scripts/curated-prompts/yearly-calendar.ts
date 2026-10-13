/**
 * Curated prompt — watercolor illustrated yearly calendar poster (2027).
 * Body = female character; variations: male, single-month (higher quality).
 */
import type { CuratedPrompt } from "../add-curated-prompt";

const FEMALE = `Create a hand-drawn watercolor-style illustrated YEARLY CALENDAR POSTER for the year 2027, featuring a stylish young woman with long wavy brown hair, warm skin tone, and elegant casual-chic fashion. Keep her face, hairstyle, and identity perfectly consistent across all 12 monthly panels.
Layout: a clean vertical 3×4 grid (12 panels), portrait poster, aspect ratio 2:3. Each panel contains: the illustrated monthly scene, the month name in elegant handwritten typography, a small calendar date grid beneath it with the CORRECT dates and weekday alignment for the year 2027, plus minimal seasonal doodles and a short handwritten motivational quote.
Monthly scenes (same woman, different seasonal lifestyle): Jan: winter outfit holding coffee, snowy. Feb: holding flowers, romantic pastel. Mar: carrying books/plants, growth. Apr: camera in hand, spring blossoms. May: relaxed café with greenery. Jun: mountain traveler/adventure. Jul: beach vacation casual. Aug: sunshine + iced drink. Sep: work mode with tablet/notebook. Oct: explorer travel jacket. Nov: cozy scarf + autumn leaves. Dec: festive cozy Christmas with gifts/lights.
Style: watercolor fashion illustration, sketchbook journal art, Pinterest aesthetic planner page, soft muted earthy palette with warm highlights, ink splashes, pencil outlines, organic brush strokes, subtle paper grain. Delicate hand-drawn doodles (stars, leaves, hearts, airplanes, snowflakes, coffee steam, travel icons) around each scene.
Ultra detailed, cohesive, print-ready, whimsical but sophisticated, balanced negative space, expressive ink linework, soft natural shadows, 2:3.
Negative: garbled text, misspelled months, wrong dates, inconsistent faces, face drift, extra limbs, duplicated features, blurry text, messy layout, oversaturated, low resolution.`;

const MALE = `Create a hand-drawn watercolor-style illustrated YEARLY CALENDAR POSTER for the year 2027, featuring a stylish young man with short tidy dark hair, light stubble, and elegant casual-chic fashion (layered jackets). Keep his face, hairstyle, and identity perfectly consistent across all 12 monthly panels.
Layout: a clean vertical 3×4 grid (12 panels), portrait poster, aspect ratio 2:3. Each panel: the illustrated monthly scene, the month name in handwritten typography, a small calendar date grid beneath it with the CORRECT dates and weekday alignment for 2027, minimal seasonal doodles, and a short handwritten motivational quote.
Monthly scenes (same man, different seasonal lifestyle): Jan: winter coat holding coffee, snowy. Feb: holding a gift, warm pastel. Mar: carrying books/plants. Apr: camera in hand, spring blossoms. May: relaxed café. Jun: mountain hiking/adventure. Jul: beach casual. Aug: sunshine + iced drink. Sep: work mode with laptop. Oct: explorer travel jacket. Nov: cozy scarf + autumn leaves. Dec: festive cozy Christmas.
Style: watercolor fashion illustration, sketchbook journal art, Pinterest planner aesthetic, soft muted earthy palette, ink splashes, pencil outlines, paper grain, delicate doodles. Ultra detailed, cohesive, print-ready, balanced negative space, soft shadows, 2:3.
Negative: garbled text, misspelled months, wrong dates, inconsistent faces, face drift, extra limbs, duplicated features, blurry text, messy layout, oversaturated, low resolution.`;

const SINGLE_MONTH = `Create ONE hand-drawn watercolor illustrated calendar panel for [MONTH] 2027, featuring [YOUR CHARACTER — keep identity consistent]. Show the character in a seasonal lifestyle scene that fits the month, with the month name in elegant handwritten typography, a small calendar date grid beneath it with the CORRECT dates and weekday alignment for [MONTH] 2027, a short handwritten motivational quote, and delicate seasonal doodles. Style: watercolor fashion illustration, sketchbook journal art, soft muted earthy palette, ink splashes, pencil outlines, paper grain, aspect ratio 4:5. Generate each month separately for higher quality and consistent faces, then assemble the 12 panels into a grid. Negative: garbled text, wrong dates, inconsistent faces, extra limbs, blurry text, low resolution.`;

const BODY_AR = `أنشئ بوستر تقويم سنوي مرسوم يدويًا بأسلوب الألوان المائية لعام 2027، يضمّ امرأة شابة أنيقة بشعر بني طويل مموّج ولون بشرة دافئ وأزياء كاجوال أنيقة. حافظ على وجهها وتسريحتها وهويّتها ثابتة تمامًا في جميع الأشهر الاثني عشر.
التخطيط: شبكة عمودية 3×4 (12 لوحة)، بوستر عمودي بنسبة 2:3. كل لوحة تحتوي: المشهد الشهري المرسوم، اسم الشهر بخطّ يد أنيق، وشبكة تواريخ صغيرة أسفله بالتواريخ الصحيحة ومحاذاة أيام الأسبوع لعام 2027، مع رسومات موسمية بسيطة وعبارة تحفيزية بخطّ اليد.
المشاهد الشهرية (المرأة نفسها بأجواء موسمية مختلفة): يناير: إطلالة شتوية بكوب قهوة وثلج. فبراير: تحمل زهورًا بأجواء رومانسية. مارس: تحمل كتبًا/نباتات. أبريل: كاميرا وأزهار ربيع. مايو: مقهى هادئ وخضرة. يونيو: مغامرة جبلية. يوليو: إجازة شاطئ. أغسطس: شمس ومشروب مثلّج. سبتمبر: وضع عمل مع تابلت. أكتوبر: جاكيت سفر واستكشاف. نوفمبر: وشاح دافئ وأوراق خريف. ديسمبر: أجواء عيد الميلاد الدافئة.
الأسلوب: رسم أزياء بالألوان المائية، فنّ دفتر الرسم، جماليّة بلانر على طراز Pinterest، لوحة ألوان ترابية هادئة بلمسات دافئة، رشّات حبر، خطوط رصاص، ملمس ورق، ورسومات صغيرة لطيفة. تفاصيل فائقة، تكوين متناسق، جاهز للطباعة، مساحات سلبية متوازنة، ظلال ناعمة، 2:3.
سلبي: نص مشوّه، أسماء أشهر خاطئة، تواريخ خاطئة، وجوه غير متّسقة، أطراف زائدة، تفاصيل مكرّرة، نص ضبابي، تخطيط فوضوي، تشبّع مفرط، دقة منخفضة.`;

const prompt: CuratedPrompt = {
  slug: "watercolor-yearly-calendar-2027",
  title: "Watercolor Yearly Calendar Poster (2027)",
  titleAr: "بوستر تقويم سنوي بالألوان المائية (2027)",
  category: "image",
  modelHint: "Gemini · ChatGPT (GPT-4o) · Ideogram — أفضل للنصوص",
  description:
    "برومبت لإنشاء بوستر تقويم سنوي 2027 مرسوم بالألوان المائية — شخصية واحدة ثابتة في 12 مشهدًا موسميًا، مع أسماء الأشهر وشبكات التواريخ والعبارات التحفيزية بخطّ اليد. متوفّر بنسختي امرأة/رجل، ومثالي للطباعة والبلانر والهدايا.",
  body: FEMALE,
  bodyAr: BODY_AR,
  variations: [
    { label: "نسخة الرجل", text: MALE },
    { label: "شهر واحد (جودة أعلى)", text: SINGLE_MONTH },
  ],
  tips: [
    "تحقّق من التواريخ قبل الطباعة — قد يخطئ النموذج في بعض الأشهر؛ صحّح الشبكات في Canva/Photoshop.",
    "لنصوص وتواريخ أدقّ استخدم Gemini أو GPT-4o أو Ideogram (أفضل من Midjourney/Flux في الكتابة).",
    "استبدل وصف الشخصية بوصفك الخاص أو ارفع صورة مرجعية للحفاظ على ثبات الوجه.",
    "لجودة أعلى وثبات أفضل، ولّد كل شهر على حدة (تنويعة 'شهر واحد') ثم اجمع الـ12 في شبكة.",
  ],
  useCases: ["تقويم سنوي", "بلانر", "ديكور حائط", "هدية", "مطبوعات فنية"],
  imagePrompt: FEMALE,
};

export default prompt;
