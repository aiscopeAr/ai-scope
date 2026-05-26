# איך עובדים הכתבים — לינא וזייד

## מי הם?

שני הכתבים של AIScope הם **דמויות AI** — לא בני אדם אמיתיים, אלא `system prompt`-ים שונים שמגדירים טון, זווית, ואופי כתיבה שונים לחלוטין. שניהם מבוססים על GPT-4o (או המודל שמוגדר ב-`OPENAI_MODEL`).

---

## מה ההבדל ביניהם?

| | **זיד** | **לינא** |
|---|---|---|
| **תחומים** | `ai-models`, `research`, `tools` | `companies`, `policy` |
| **טון** | מנתח-ספקן, טכני, מדויק | חוקרת-עיתונאית, מחברת הקשרים |
| **פתיחת מאמר** | ניתוח טכני או שאלה שחושפת פגם בטענות | "כשאופנהיימר AI הכריזה על X, השאלה האמיתית הייתה..." |
| **צבע accent** | `#6366f1` (indigo) | `#ec4899` (pink) |
| **avatar** | `/images/authors/zayd.webp` | `/images/authors/lina.webp` |

---

## איך המערכת בוחרת מי כותב?

### שלב 1 — ניחוש ראשוני לפני כתיבה

בקובץ [lib/review-openai.ts](../lib/review-openai.ts) (שורה 104-105):

```ts
const prelimCategory = authorSlugHint ? null : guessCategoryFromTopic(topic);
const authorSlug = authorSlugHint ?? pickAuthor(prelimCategory ?? "ai-models");
```

הפונקציה `guessCategoryFromTopic` בודקת מילות מפתח בכותרת הנושא:
- `openai`, `google`, `meta`, `funding` → `companies` → **לינא**
- `law`, `regulation`, `policy`, `eu` → `policy` → **לינא**
- `gpt`, `claude`, `gemini`, `benchmark` → `ai-models` → **זיד**
- `research`, `arxiv`, `paper` → `research` → **זיד**
- `tool`, `app`, `product`, `api` → `tools` → **זיד**
- ברירת מחדל: **זיד**

### שלב 2 — GPT-4o מחליט בעצמו

כשה-AI כותב את הטיוטה, הוא מחזיר `suggestedCategory` ב-JSON. בסוף הפונקציה (שורה 145):

```ts
const finalAuthorSlug = authorSlugHint ?? pickAuthor(suggestedCategory);
```

כלומר — ה-AI יכול לתקן את הניחוש הראשוני על סמך תוכן המאמר עצמו.

### שלב 3 — שמירה ב-tag

כשהמאמר מתפרסם, שם הכותב נשמר ב-tags של המאמר כ-`__author:zayd` או `__author:lina` (tag פנימי, לא מוצג לגולשים).

---

## איך ה-system prompt עובד?

כל כותב מקבל `systemPrompt` ייחודי (מוגדר ב-[lib/authors.ts](../lib/authors.ts)).

לפני כתיבה, ה-AI מקבל:
1. **system message** = `author.systemPrompt` (אופי + סגנון הכתיבה)
2. **user message** = הנחיות תוכן + המקורות (עד 3,000 תווים כל אחד)

**זיד** מקבל הנחיות לכתוב כ"מנתח מתחרה בנאי" שמבקש בנצ'מרקים, משווה, ומסיים בשאלה טכנית פתוחה.

**לינא** מקבלת הנחיות לכתוב כ"כתבת חקרנית" שמחפשת את הסיפור מאחורי הסיפור הרשמי, מחברת לאזור הערבי, ומסיימת בשאלת "מה יקרה בעוד שנה?"

---

## "זיכרון" הכתב

לפני כל כתיבה, המערכת מחפשת מאמרים **קודמים** של אותו כתב שדומים לנושא הנוכחי ([lib/embeddings.ts](../lib/embeddings.ts)):

```ts
pastReviews = await findSimilarReviews(topic, authorSlug, 4);
```

עד 4 מאמרים קודמים מוכנסים ל-prompt כ"ذاكرة الكاتب" (זיכרון הכתב), ומנחים את ה-AI להתייחס אליהם אם יש קשר אמיתי. זה יוצר עקביות בין מאמרים לאורך זמן.

---

## זרימת הנתונים המלאה

```
RSS feed / admin
      ↓
 enqueueNewsItem()        ← [lib/review-queue.ts]
      ↓
 createReviewCluster()    ← כמה פריטי RSS על אותו נושא מקובצים יחד
      ↓
 writeReview()            ← [lib/review-openai.ts]
    ├─ guessCategoryFromTopic(topic)
    ├─ pickAuthor(category)  ← זיד או לינא?
    ├─ findSimilarReviews()  ← זיכרון הכתב
    └─ GPT-4o.chat()        ← systemPrompt של הכתב + המקורות
      ↓
 ReviewDraft { titleAr, contentAr, authorSlug, ... }
      ↓
 markReviewProcessed()    ← שמירה ב-ReviewQueue
      ↓
 [אדמין מאשר]
      ↓
 approveReview()          ← פרסום + יצירת embedding + טיוטות סושיאל
```

---

## נקודות חשובות

- `authorSlugHint` — ניתן לכפות כתב ספציפי (למשל מדף האדמין) במקום להשאיר למערכת להחליט.
- אם ה-pgvector לא זמין, המערכת כותבת ללא זיכרון — שגיאה שקטה (`catch {}`).
- ה-`temperature` מוגדר על `0.8` — מאפשר יצירתיות אבל לא אנדומליות.
- המאמר חייב לחזור כ-JSON נקי — הקוד מנקה backticks אם GPT הוסיף כאלה.
