# 🧠 Lumiq — מפת הדרכים לעצמאות הסוכנים

> מטרה: להפוך את זיד ולינה מ"עטיפות לـ GPT-4o" לסוכנים עצמאיים בעלי ידע, סגנון, וזיכרון שצמח מתוך הכתיבה עצמה — ובשלב מתקדם, למכור את הידע שלהם.

---

## המצב היום (Baseline)

```
RSS → fetch-news → cluster-news (GPT-4o-mini) → process-review (GPT-4o) → publish
                                                        ↑
                                               memory context (pgvector)
```

### תלויות חיצוניות כרגע:
| שירות | שימוש | עלות משוערת |
|-------|-------|-------------|
| OpenAI GPT-4o | כתיבת כתבות | ~$0.08–0.15 לכתבה |
| OpenAI GPT-4o-mini | clustering | ~$0.001 לריצה |
| OpenAI text-embedding-3-small | embeddings | ~$0.0001 לכתבה |
| Replicate / Cloudinary | תמונות | משתנה |

### חוזקות קיימות שנבנה עליהן:
- ✅ pgvector בפרודקשן — כל כתבה מפורסמת מקבלת embedding
- ✅ Memory context — זיד ולינה "זוכרים" כתבות קודמות רלוונטיות
- ✅ System prompts מפורטים עם אישיות ייחודית לכל כותב
- ✅ Pipeline מלא עם queue, clustering, review, publish
- ✅ כל כתבה שמורה עם metadata עשיר (tags, keywords, category, FAQ, sources)

---

## עקרון מנחה: Gradual Decoupling

**לא מחליפים בבת אחת. מוסיפים שכבה מתחת לקיים, בודקים, ומעבירים בהדרגה.**

```
שנה 1: צבירה + fine-tuning
שנה 2: מודל היברידי (מקומי + API לגיבוי)
שנה 3: עצמאות + מוצר
```

---

## שלב 0 — תשתית נתונים (עכשיו, לפני הכל)

**מטרה:** לוודא שכל נתח ידע נשמר נכון מהיום — כי הוא חומר הגלם לאימון עתידי.

### 0.1 — וידוא embeddings נשמרים
בדוק ש-`embedReview()` נקרא אחרי כל פרסום:
```typescript
// בתוך approveReview() ב-lib/review-queue.ts
// חייב להיות:
await embedReview(reviewId);
```

אם לא קיים — להוסיף. זה קריטי.

### 0.2 — טבלת AuthorMemory
כרגע הזיכרון הוא runtime בלבד. צריך טבלה שמאגדת "מה זיד יודע":

```prisma
model AuthorMemory {
  id          String   @id @default(cuid())
  authorSlug  String
  type        String   // "style_note" | "topic_expertise" | "past_stance" | "source_preference"
  content     String   @db.Text
  weight      Float    @default(1.0) // עולה עם כל אישור אנושי
  sourceId    String?  // Review שממנו נלמד
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([authorSlug, type])
}
```

**מה נשמר שם:**
- עמדות עבר של הכותב ("זיד תמיד ספקן לגבי GPT benchmarks")
- מקורות מועדפים ("לינה מצטטת Reuters לנושאי מדיניות")
- סגנון שמשתפר ("הקדמה שקיבלה הכי הרבה views")
- נושאים שכוסו לעומק

### 0.3 — מדדי איכות לכל כתבה
```prisma
model ReviewMetrics {
  id           String   @id @default(cuid())
  reviewId     String   @unique
  review       Review   @relation(...)
  avgReadTime  Int?     // שניות — מ-analytics
  bounceRate   Float?   // % — אם גולש עזב מיד
  scrollDepth  Float?   // % — עד כמה קרא
  shareCount   Int      @default(0)
  qualityScore Float?   // 0-1 — חישוב אוטומטי
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

**למה זה חשוב:** כתבות עם `qualityScore` גבוה = positive training data לעתיד.

---

## שלב 1 — Fine-tuning (חודשים 2–4)

**מטרה:** מודל קטן שכותב כמו זיד/לינה, בעלות 10x פחות מ-GPT-4o.

### 1.1 — בניית Training Dataset
אחרי ~50 כתבות מפורסמות לכל כותב, אפשר לבנות dataset:

```jsonl
// zayd_training.jsonl — פורמט OpenAI fine-tuning
{"messages": [
  {"role": "system", "content": "<zayd_system_prompt>"},
  {"role": "user", "content": "<sources_prompt>"},
  {"role": "assistant", "content": "<actual_published_article_json>"}
]}
```

**סקריפט אוטומטי שצריך לכתוב:**
```typescript
// scripts/export-training-data.ts
// שולף כתבות עם qualityScore > 0.7
// ממיר לפורמט JSONL
// מייצא zayd_v1.jsonl + lina_v1.jsonl
```

### 1.2 — Fine-tune על GPT-4o-mini
עלות: ~$5–15 לאימון ראשון
תוצאה: מודל שכותב כמו זיד בעלות $0.006 לכתבה במקום $0.08

```typescript
// lib/review-openai.ts — שינוי פשוט אחרי fine-tune
const model = process.env.OPENAI_MODEL ?? "gpt-4o";
// ↓ אחרי fine-tune:
const model = process.env.OPENAI_MODEL ?? "ft:gpt-4o-mini:lumiq:zayd-v1:xxxxx";
```

**חשוב:** שמור את GPT-4o כ-fallback — אם fine-tuned model נכשל, עובר אוטומטית.

### 1.3 — Evaluation
אחרי כל fine-tune, הרץ evaluation:
- כתב 10 כתבות עם GPT-4o (baseline)
- כתב אותן עם fine-tuned model
- השווה: אורך, סגנון, quality score, עלות

---

## שלב 2 — RAG מלא (חודשים 3–6)

**מטרה:** במקום לשלוח 4 מאמרים מלאים ל-API → שלח רק את החלקים הרלוונטיים. חיסכון של 60-70% בעלות.

### 2.1 — Chunking של מקורות
```typescript
// lib/rag.ts
export async function buildRagContext(
  sources: Source[],
  topic: string
): Promise<string> {
  // 1. חתוך כל מקור ל-chunks של ~500 tokens
  // 2. embed כל chunk
  // 3. מצא את ה-chunks הכי רלוונטיים לנושא
  // 4. החזר רק את ה-top-10 chunks
  // במקום 4 מאמרים מלאים (~8000 tokens) → ~2000 tokens בלבד
}
```

### 2.2 — Knowledge Base מקומי
כל כתבה שמתפרסמת מתווספת ל-knowledge base. לפני שפונים ל-API:

```typescript
// בדוק אם יש כבר כיסוי טוב לנושא ב-DB
const existing = await findSimilarReviews(topic, authorSlug, 3);
if (existingCoverage > 0.85) {
  // הנושא כוסה לאחרונה — דלג או עדכן במקום לכתוב מחדש
}
```

---

## שלב 3 — מודל היברידי (חודשים 6–12)

**מטרה:** מודל מקומי לעבודה הרגילה, API רק לנושאים מורכבים.

### 3.1 — Local Model עם Ollama
```bash
# שרת $20/חודש (4GB RAM) מספיק להרצת:
# - Llama 3.1 8B fine-tuned → כתיבת כתבות בסיסיות
# - Mistral 7B → clustering
# - nomic-embed-text → embeddings מקומיים (מחליף OpenAI embeddings!)
ollama run lumiq/zayd-v3
```

**ארכיטקטורה היברידית:**
```typescript
async function writeReview(topic, sources, authorSlug) {
  const complexity = await assessComplexity(topic); // 0-1

  if (complexity < 0.6 && localModelAvailable()) {
    // נושא פשוט → מודל מקומי, אפס עלות
    return await writeWithLocalModel(topic, sources, authorSlug);
  } else {
    // נושא מורכב / פוליטי / טכני עמוק → GPT-4o
    return await writeWithOpenAI(topic, sources, authorSlug);
  }
}
```

### 3.2 — Embeddings מקומיים
```typescript
// lib/embeddings.ts — החלפה שקופה
const EMBED_PROVIDER = process.env.EMBED_PROVIDER ?? "openai"; // "openai" | "local"

export async function embedText(text: string): Promise<number[]> {
  if (EMBED_PROVIDER === "local") {
    return await ollamaEmbed(text); // nomic-embed-text
  }
  return await openaiEmbed(text); // fallback
}
```

**השפעה:** embeddings = $0 לחלוטין. זה כבר 20% מהעלות.

### 3.3 — Clustering מקומי
```typescript
// cluster-news: במקום GPT-4o-mini → אלגוריתם מקומי
// TF-IDF + cosine similarity על ה-embeddings שכבר יש לנו
// אפס עלות, תוצאות דומות ל-GPT-4o-mini
```

---

## שלב 4 — Self-improving Loop (שנה 2)

**מטרה:** כל כתבה חדשה שמצליחה משפרת את הסוכן אוטומטית.

```
פרסום → מדד ביצועים (views, read time, shares)
                ↓
        אם qualityScore > 0.75
                ↓
        הוסף ל-training queue
                ↓
        כל 50 כתבות חדשות → re-fine-tune
                ↓
        deploy מודל חדש → v2, v3, v4...
```

```typescript
// cron/retrain.ts — רץ חודשי
async function retrainIfReady() {
  const newHighQuality = await prisma.review.count({
    where: {
      metrics: { qualityScore: { gte: 0.75 } },
      createdAt: { gte: lastTrainDate }
    }
  });

  if (newHighQuality >= 50) {
    await exportTrainingData();
    await triggerFineTune(); // OpenAI Fine-tuning API
    await notifyAdmin("מודל חדש מוכן לבדיקה");
  }
}
```

---

## שלב 5 — מוצר ומכירת הידע (שנה 2–3)

**מטרה:** הסוכנים של Lumiq הופכים למוצר עצמאי.

### 5.1 — Lumiq API
```
POST /api/v1/analyze
{
  "topic": "GPT-5 release",
  "depth": "deep" | "summary",
  "author": "zayd" | "lina" | "auto",
  "language": "ar"
}
→ {
  "article": "...",
  "analysis": "...",
  "confidence": 0.92
}
```

**קהל יעד:** אתרי חדשות ערביים, חברות AI בשוק הערבי, מחקר אקדמי.
**מחיר:** $0.05–0.20 לניתוח — רווחי כי המודל שלך רץ locally.

### 5.2 — White-label Agents
מכירת גרסאות מותאמות של זיד/לינה לארגונים:
- "זיד של Aramco" — מנתח חדשות AI לסקטור האנרגיה
- "לינא של بنك X" — עוקבת אחרי רגולציה AI פיננסית

### 5.3 — Knowledge Licensing
המודל המאומן + ה-knowledge base (pgvector) = נכס ייחודי שניתן לתמחר.
- ה-embedding space של Lumiq מייצג שנת ידע על AI בערבית
- אין מתחרה עם אותו corpus

---

## לוח זמנים מפורט

```
חודש 1-2:   שלב 0 — תשתית נתונים (embeddings, AuthorMemory, ReviewMetrics)
חודש 2-4:   שלב 1 — Fine-tune ראשון על GPT-4o-mini (50+ כתבות)
חודש 3-6:   שלב 2 — RAG מלא, חיסכון 60% בעלות API
חודש 6-9:   שלב 3a — Embeddings מקומיים (nomic-embed-text)
חודש 9-12:  שלב 3b — Local model ל-clustering (החלפת GPT-4o-mini)
חודש 12-18: שלב 3c — Local model לכתיבה (Llama fine-tuned)
חודש 18-24: שלב 4 — Self-improving loop
חודש 24+:   שלב 5 — מוצר + API מסחרי
```

---

## מדד הצלחה — תלות ב-API לאורך זמן

```
היום:      100% תלות ב-OpenAI
חודש 6:     70% (RAG + embeddings מקומיים)
חודש 12:    40% (clustering מקומי + fine-tuned model לנושאים פשוטים)
חודש 18:    15% (רק GPT-4o לנושאים מורכבים מאוד)
חודש 24:     5% (fallback בלבד)
```

---

## עלויות משוערות

### היום (100 כתבות/חודש):
- GPT-4o כתיבה: ~$10/חודש
- Embeddings: ~$0.50/חודש
- Clustering: ~$1/חודש
- **סה"כ: ~$12/חודש**

### אחרי שלב 1 (fine-tune):
- Fine-tuned GPT-4o-mini: ~$1.5/חודש
- **חיסכון: 87%**

### אחרי שלב 3 (local model):
- VPS $20/חודש לשרת Ollama
- API רק לנושאים מורכבים: ~$1/חודש
- **עלות קבועה, ללא תלות במחיר OpenAI**

---

## סיכום — למה זה אפשרי

1. **corpus ייחודי** — כתבות AI בערבית שכתבנו, metadata עשיר, embeddings. אין מתחרה עם אותו dataset.
2. **אישיות מוגדרת** — זיד ולינה הם brand. fine-tuning ישמר ויעמיק את האישיות.
3. **pipeline מלא** — תשתית קיימת, לא בונים מאפס.
4. **שוק פתוח** — AI בערבית כמעט ריק. מי שיבנה את הידע הזה ראשון — ינצח.

> **המסקנה:** בשנה אחת אפשר להגיע ל-15% תלות ב-API. בשנתיים — מוצר שאפשר למכור.
