/**
 * Curated prompt — hyper-realistic craft portrait: a silver-haired sculptor in
 * his dusty atelier, hands on a half-finished marble bust, lit by hard window
 * shafts full of drifting marble dust. Reference-based (upload a face photo).
 */
import type { CuratedPrompt } from "../add-curated-prompt";

const BODY = `Transform the person in the uploaded reference photo into a hyper-realistic 8k portrait, precisely preserving their facial likeness, features, and expression. A silver-haired sculptor in his sixties stands in his dusty atelier, both hands resting on a half-finished marble bust, leaning in to study the stone with a craftsman's patient gaze, marble dust whitening his apron and the lines of his hands. He wears a worn linen shirt with rolled sleeves, a heavy canvas apron, and dark trousers, a pencil tucked behind one ear. Slanted window light pours through tall dusty panes in hard shafts, catching the drifting marble dust in the air and modeling the planes of his weathered face, while unfinished sculptures and plaster casts crowd the shadowed shelves behind him. Shot on an 85mm lens at f/1.4 with shallow depth of field, fine film grain, age-appropriate skin with pores and fine wrinkles, tactile stone and fabric detail, photorealistic, no text, no watermarks, no extra fingers, no distorted hands, a masterwork of craft and patience.`;

const WOODCARVER = `Transform the person in the uploaded reference photo into a hyper-realistic 8k portrait, precisely preserving their facial likeness, features, and expression. A silver-haired woodcarver in his sixties stands in his dusty workshop, both hands resting on a half-shaped oak figure, leaning in to study the grain with a craftsman's patient gaze, fine wood shavings and sawdust clinging to his apron and the lines of his hands. Worn linen shirt with rolled sleeves, a heavy leather apron, a pencil behind one ear. Slanted window light pours through tall dusty panes in hard shafts, catching the drifting sawdust in the air and modeling his weathered face, while unfinished carvings crowd the shadowed shelves behind him. 85mm at f/1.4, shallow depth of field, fine film grain, age-appropriate skin with pores and wrinkles, tactile wood and fabric detail, photorealistic, no text, no watermarks, no extra fingers, no distorted hands, a masterwork of craft and patience.`;

const POTTER = `Transform the person in the uploaded reference photo into a hyper-realistic 8k portrait, precisely preserving their facial likeness, features, and expression. A silver-haired potter in his sixties sits at a spinning wheel, both hands cradling a rising vessel of wet clay, leaning in with a craftsman's patient gaze, wet clay streaking his apron and the lines of his hands. Worn linen shirt with rolled sleeves, a heavy canvas apron. Slanted window light pours through tall dusty panes in hard shafts, catching fine clay dust in the air and modeling his weathered face, while finished pots crowd the shadowed shelves behind him. 85mm at f/1.4, shallow depth of field, fine film grain, age-appropriate skin with pores and wrinkles, tactile clay and fabric detail, photorealistic, no text, no watermarks, no extra fingers, no distorted hands, a masterwork of craft and patience.`;

const YOUNGER = `Transform the person in the uploaded reference photo into a hyper-realistic 8k portrait, precisely preserving their facial likeness, features, and expression. A sculptor in his forties with dark hair and a short beard stands in his dusty atelier, both hands resting on a half-finished marble bust, leaning in to study the stone with a craftsman's patient gaze, marble dust whitening his apron and the lines of his hands. Worn linen shirt with rolled sleeves, a heavy canvas apron, a pencil behind one ear. Slanted window light pours through tall dusty panes in hard shafts, catching the drifting marble dust in the air and modeling his face, while unfinished sculptures and plaster casts crowd the shadowed shelves behind him. 85mm at f/1.4, shallow depth of field, fine film grain, skin with pores, tactile stone and fabric detail, photorealistic, no text, no watermarks, no extra fingers, no distorted hands, a masterwork of craft and patience.`;

const BODY_AR = `حوّل الشخص في الصورة المرجعية المرفوعة إلى بورتريه فائق الواقعية بدقة 8k، مع الحفاظ الدقيق على ملامح الوجه والتعبير. نحّات فضّي الشعر في الستينيات يقف في مرسمه المغبرّ، يداه كلتاهما مستقرّتان على تمثال نصفي رخامي نصف مكتمل، مائلًا ليتفحّص الحجر بنظرة الحرفيّ الصبور، وغبار الرخام يُبيّض مئزره وتجاعيد يديه. يرتدي قميصًا كتانيًا باليًا بأكمام مطويّة، ومئزرًا ثقيلًا من القماش الخشن، وبنطالًا داكنًا، وقلم رصاص خلف أذنه. ضوء مائل يتدفّق من نافذة بألواح زجاج عالية مغبرّة في أشعّة حادّة، يلتقط غبار الرخام المتطاير في الهواء ويُبرز مستويات وجهه المُجعّد، بينما تزدحم تماثيل غير مكتملة وقوالب جبسية على الرفوف المُظلّلة خلفه. مُصوَّر بعدسة 85mm عند f/1.4 بعمق ميدان ضحل، حُبيبات فيلم دقيقة، بشرة مناسبة للعمر بمسام وتجاعيد رقيقة، تفاصيل ملموسة للحجر والقماش، واقعي فوتوغرافيًا، بلا نصّ، بلا علامات مائية، بلا أصابع زائدة، بلا أيدٍ مشوّهة، تحفة من الحِرفة والصبر.`;

const prompt: CuratedPrompt = {
  slug: "master-sculptor-atelier",
  title: "Master Sculptor and Marble Muse",
  titleAr: "النحّات وتمثاله الرخامي",
  category: "image",
  modelHint: "ChatGPT (GPT-4o) · Gemini · Midjourney · Flux — مع صورة مرجعية للوجه",
  description:
    "برومبت لتحويل صورتك إلى بورتريه حِرَفي فائق الواقعية: نحّات مُسنّ في مرسمه المغبرّ، يداه على تمثال رخامي نصف مكتمل، تخترقه أشعّة ضوء النافذة المليئة بغبار الرخام. يحافظ على ملامح وجهك عبر رفع صورة مرجعية. متوفّر بنسخ نحّات خشب / خزّاف / أصغر سنًا — صورة تحكي قصة إتقان اكتُسب ببطء.",
  body: BODY,
  bodyAr: BODY_AR,
  variations: [
    { label: "نحّات خشب", text: WOODCARVER },
    { label: "خزّاف على العجلة", text: POTTER },
    { label: "نسخة أصغر سنًا (الأربعينيات)", text: YOUNGER },
  ],
  tips: [
    "ارفع صورة مرجعية واضحة وجيدة الإضاءة للوجه، وشدّد على 'preserve facial likeness' — التشابه يظهر فقط حين ينجو من ضوء النافذة الحادّ.",
    "برومبت حسّاس لليدين: دقّق أن هناك يدين فقط وعشرة أصابع على التمثال، بلا أصابع زائدة أو ملتحمة أو يد ثالثة بين القوالب.",
    "حافظ على 3 عبارات أساسية في أي إعادة صياغة: وضعية اليدين والنظرة، أشعّة ضوء النافذة بالغبار، وغبار الرخام على المئزر واليدين.",
    "ولّد بنسبة عمودية (4:5 أو 2:3) — نسبة أعرض تقصّ النافذة وتُضعف سقوط الأشعّة؛ وإضاءة أمامية ناعمة تُفسد وهم المرسم المغبرّ.",
    "بدّل الحِرفة (رخام/خشب/فخّار) أو العمر كرافعة تخصيص واحدة في كل مرة، واستخدم التنويعات كنقطة انطلاق.",
  ],
  useCases: ["بورتريه فني", "بوستر/غلاف", "سرد حِرَفي", "منشورات سوشال", "بورتفوليو", "هدية"],
  imagePrompt: BODY,
};

export default prompt;
