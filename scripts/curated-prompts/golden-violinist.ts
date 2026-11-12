/**
 * Curated prompt — hyper-realistic cinematic portrait: a violinist lit by a
 * single golden beam against pure black. Reference-based (upload a face photo).
 */
import type { CuratedPrompt } from "../add-curated-prompt";

const BODY = `Transform the person in the uploaded reference photo into a hyper-realistic 8k cinematic portrait, precisely preserving their facial likeness, features, and expression. A graceful woman in her late 20s holds a violin beneath her chin, bow raised mid-phrase, her eyes closed in total surrender to the music, her face dominant in a clean cover framing. She wears a flowing black silk gown with an open back, a thin gold chain at her throat, her dark hair swept into a low bun, fine rosin dust on her fingertips and the violin's varnish showing hairline craquelure. A single warm beam of light falls from above, gilding her face, the violin's varnish and her bare shoulders while the space around her dissolves into absolute black, dust drifting like gold in the shaft, her skin showing visible pores in the beam. Behind her nothing but darkness and the faint glow of the beam's edge, shallow depth of field keeping her and the violin razor sharp against the void. Shot on 85mm lens at f/1.4, 35mm film grain, photorealistic, sharp focus, no text distortions, no watermarks, no extra fingers, masterwork.`;

const MALE = `Transform the person in the uploaded reference photo into a hyper-realistic 8k cinematic portrait, precisely preserving their facial likeness and expression. A poised man in his early 30s holds a violin beneath his chin, bow raised mid-phrase, his eyes closed in total surrender to the music, face dominant in a clean cover framing. He wears a tailored black silk shirt open at the collar, dark hair neatly swept back, light stubble, fine rosin dust on his fingertips and the violin's varnish showing hairline craquelure. A single warm beam of light falls from above, gilding his face, the violin and his shoulders while the space around him dissolves into absolute black, gold dust drifting in the shaft, skin showing visible pores in the beam. Shallow depth of field keeps him and the violin razor sharp against the void. Shot on 85mm at f/1.4, 35mm film grain, photorealistic, sharp focus, no extra fingers, no watermarks, masterwork.`;

const PIANO = `Transform the person in the uploaded reference photo into a hyper-realistic 8k cinematic portrait, precisely preserving their facial likeness and expression. The subject sits at a grand piano, hands resting on the keys mid-phrase, eyes closed in surrender to the music, face dominant in a clean framing. Elegant black attire, a thin gold chain, hair swept back. A single warm beam of light falls from above, gilding the face, the lacquered piano and the hands, while everything around dissolves into absolute black, gold dust drifting in the shaft, skin showing visible pores. Shallow depth of field, subject razor sharp against the void. Shot on 85mm at f/1.4, 35mm film grain, photorealistic, no extra fingers, no watermarks, masterwork.`;

const SILVER = `Transform the person in the uploaded reference photo into a hyper-realistic 8k cinematic portrait, precisely preserving their facial likeness and expression. A violinist mid-phrase, eyes closed, face dominant in a clean cover framing, in a flowing deep-navy silk gown. Instead of gold, a single COOL moonlit-silver beam falls from above, rimming the face, the violin's varnish and the bare shoulders in cold blue-white light, the space around dissolving into absolute black, fine dust drifting like silver in the shaft, visible skin pores in the beam. Shallow depth of field, razor-sharp subject against the void. Shot on 85mm at f/1.4, 35mm film grain, photorealistic, no extra fingers, no watermarks, masterwork.`;

const BODY_AR = `حوّل الشخص في الصورة المرجعية المرفوعة إلى بورتريه سينمائي فائق الواقعية بدقة 8k، مع الحفاظ الدقيق على ملامح الوجه والتعبير. امرأة أنيقة في أواخر العشرينيات تضع كمانًا تحت ذقنها، والقوس مرفوع في منتصف العزف، وعيناها مغمضتان في استسلام تام للموسيقى، ووجهها هو العنصر المهيمن في تأطير نظيف يشبه الغلاف. ترتدي فستانًا حريريًا أسود انسيابيًا مفتوح الظهر، وسلسلة ذهبية رفيعة حول رقبتها، وشعرها الداكن مجموع في كعكة منخفضة، مع غبار راتنج دقيق على أطراف أصابعها وطلاء الكمان يُظهر تشققات شعرية دقيقة. شعاع دافئ واحد يسقط من الأعلى، يُذهّب وجهها وطلاء الكمان وكتفيها العاريتين، بينما يذوب المحيط في سواد مطلق، والغبار يتطاير كالذهب داخل الشعاع، ومسام بشرتها ظاهرة في الضوء. خلفها لا شيء سوى الظلام ووهج خافت على حافة الشعاع، وعمق ميدان ضحل يبقيها هي والكمان حادّين تمامًا أمام الفراغ. مُصوَّر بعدسة 85mm عند f/1.4، حُبيبات فيلم 35mm، واقعي فوتوغرافيًا، تركيز حاد، بلا تشوّهات نصّية، بلا علامات مائية، بلا أصابع زائدة، تحفة فنية.`;

const prompt: CuratedPrompt = {
  slug: "golden-violinist-beam",
  title: "The Golden Violinist in a Single Beam of Light",
  titleAr: "عازفة الكمان في شعاع ضوء ذهبي",
  category: "image",
  modelHint: "Gemini · ChatGPT (GPT-4o) · Midjourney · Flux — مع صورة مرجعية للوجه",
  description:
    "برومبت لتحويل صورتك إلى بورتريه سينمائي فائق الواقعية: عازفة كمان يغمر وجهها شعاع ذهبي واحد وسط سواد مطلق، مع غبار ذهبي وعمق ميدان ضحل. يحافظ على ملامح وجهك عبر رفع صورة مرجعية. متوفّر بنسخ رجل/بيانو/إضاءة فضية باردة — مثالي لأغلفة الألبومات والبوسترات والسوشال.",
  body: BODY,
  bodyAr: BODY_AR,
  variations: [
    { label: "نسخة الرجل", text: MALE },
    { label: "بيانو بدل الكمان", text: PIANO },
    { label: "إضاءة فضية باردة", text: SILVER },
  ],
  tips: [
    "ارفع صورة مرجعية واضحة للوجه (إضاءة جيدة، مواجهة للكاميرا) للحفاظ على التشابه، وشدّد على 'preserve facial likeness'.",
    "للحصول على واقعية سينمائية، أبقِ 'Shot on 85mm at f/1.4' و'35mm film grain' و'visible pores' في البرومبت.",
    "لأيدٍ وأصابع سليمة أضف 'realistic hands, correct number of fingers' وأعد التوليد إن ظهر خلل.",
    "نسبة 4:5 عمودية مثالية للسوشال، أو 2:3 للطباعة؛ وأبقِ الخلفية 'absolute black' للحصول على تأثير الشعاع المنفرد.",
    "بدّل الآلة أو اللون (ذهبي/فضي) حسب المزاج — استخدم التنويعات الجاهزة كنقطة انطلاق.",
  ],
  useCases: ["بورتريه فني", "غلاف ألبوم/بوستر", "منشورات سوشال", "بورتفوليو موسيقي", "هدية"],
  imagePrompt: BODY,
};

export default prompt;
