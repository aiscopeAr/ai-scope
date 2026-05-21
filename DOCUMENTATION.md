# AIScope — תיעוד מלא של המערכת

> **AIScope** הוא אתר חדשות ותוכן בינה מלאכותית בערבית.  
> הוא מאסף ידיעות מ-RSS, מעבד ומתרגם אותן לערבית באמצעות OpenAI, מפיק תמונות עם Replicate, ומפיץ לרשתות חברתיות.

---

## תוכן עניינים

1. [ארכיטקטורה כללית](#1-ארכיטקטורה-כללית)
2. [מסד הנתונים — Prisma Schema](#2-מסד-הנתונים--prisma-schema)
3. [צינור העיבוד של ידיעות](#3-צינור-העיבוד-של-ידיעות)
4. [API Routes](#4-api-routes)
5. [ספריות עזר (lib/)](#5-ספריות-עזר-lib)
6. [עמודי ציבור (app/(main)/)](#6-עמודי-ציבור-appmain)
7. [פאנל אדמין (app/admin/)](#7-פאנל-אדמין-appadmin)
8. [רכיבים (components/)](#8-רכיבים-components)
9. [משתני סביבה](#9-משתני-סביבה)
10. [Cron Jobs](#10-cron-jobs)
11. [אימות וניהול הרשאות](#11-אימות-וניהול-הרשאות)
12. [SEO ומטא-דאטה](#12-seo-ומטא-דאטה)
13. [רשתות חברתיות](#13-רשתות-חברתיות)
14. [תרשים זרימת נתונים](#14-תרשים-זרימת-נתונים)

---

## 1. ארכיטקטורה כללית

```
┌─────────────────────────────────────────────────────────┐
│                      NEXT.JS 16                         │
│                                                         │
│   app/(main)/      → עמודים ציבוריים                    │
│   app/admin/       → פאנל ניהול                         │
│   app/api/         → API routes (REST)                  │
│   lib/             → לוגיקה עסקית                       │
│   components/      → רכיבי React                        │
└──────────────┬──────────────────────────────────────────┘
               │
       ┌───────┴────────┐
       │   PostgreSQL   │  ← Prisma ORM
       └───────┬────────┘
               │
   ┌───────────┼───────────┐
   │           │           │
OpenAI      Replicate   Cloudinary
(תרגום,     (תמונות     (אחסון
 עיבוד,      Flux)       תמונות)
 SEO)
```

### Stack טכנולוגי

| שכבה | טכנולוגיה |
|------|-----------|
| Framework | Next.js 16 (React 19, TypeScript) |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js v4 (JWT, Credentials) |
| AI / תרגום | OpenAI GPT-4o-mini |
| יצירת תמונות | Replicate (Flux-Schnell) |
| אחסון תמונות | Cloudinary |
| CSS | Tailwind CSS + shadcn/ui |
| Deployment | Vercel |

---

## 2. מסד הנתונים — Prisma Schema

קובץ: `prisma/schema.prisma`

### מודלים — מנוע ידיעות

---

#### `Category` — תצריפי ידיעות

```
id        String   @id @default(cuid())
name      String                          // שם באנגלית
nameAr    String                          // שם בערבית
slug      String   @unique                // /category/[slug]
articles  Article[]
sources   Source[]
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
```

---

#### `Source` — מקורות RSS

```
id           String         @id @default(cuid())
name         String                               // שם המקור
rssUrl       String                               // כתובת ה-RSS
website      String?                              // אתר הבית
enabled      Boolean        @default(true)        // פעיל/כבוי
priority     Int            @default(5)           // 1 (גבוה) - 10 (נמוך)
categoryId   String?                              // תצריף ברירת מחדל
lastSyncedAt DateTime?                            // זמן sync אחרון
queueItems   ArticleQueue[]
```

> **אינדקסים:** `enabled`

---

#### `Article` — ידיעות מפורסמות

```
id           String    @id @default(cuid())
title        String                          // כותרת מקורית (אנגלית)
titleAr      String                          // כותרת בערבית (נוצרת ע"י AI)
slug         String    @unique               // /news/[slug]
content      String    @db.Text             // תוכן מקורי
contentAr    String    @db.Text             // תוכן בערבית (נוצר ע"י AI)
excerpt      String?   @db.Text             // תקציר
imageUrl     String?                         // URL תמונה ראשית (Cloudinary)
imageAlt     String?                         // alt לתמונה (SEO + נגישות)
sourceUrl    String                          // מקור המאמר המקורי
sourceName   String                          // שם המקור
tags         String[]                        // תגיות (מערך מחרוזות)
keywords     String[]                        // מילות מפתח SEO
faq          Json?                           // שאלות ותשובות [{question, answer}]
relatedTopics String[]                       // נושאים קשורים
score        Int       @default(0)           // ציון רלוונטיות (0-10)
viewCount    Int       @default(0)           // מספר צפיות
published    Boolean   @default(false)       // האם מפורסם
publishedAt  DateTime?                       // זמן פרסום
categoryId   String
category     Category  @relation(...)
```

> **אינדקסים:** `(published, publishedAt)`, `categoryId`

---

#### `ArticleQueue` — תור עיבוד ידיעות

מודל זה הוא ה"אזור בינייםה" של כל ידיעה לפני פרסום.

```
id                 String    @id @default(cuid())
sourceUrl          String    @unique              // מונע כפילויות
rawTitle           String?                        // כותרת גולמית מ-RSS
rawContent         String    @db.Text             // תוכן גולמי מ-RSS
rawPublishedAt     DateTime?                      // תאריך פרסום גולמי
sourceName         String?
sourceId           String?
source             Source?   @relation(...)

// שדות שמולאו על ידי AI (לאחר עיבוד)
titleAr            String?                        // כותרת ערבית
summaryAr          String?   @db.Text             // סיכום ערבית
contentAr          String?   @db.Text             // תוכן ערבי מלא
tags               String[]
keywords           String[]
faq                Json?
imageAlt           String?
relatedTopics      String[]
seoTitle           String?
seoDescription     String?
suggestedCategory  String?
slug               String?
featuredImagePrompt String?                       // prompt לתמונה
imageUrl           String?                        // URL תמונה שנוצרה

// מצב ניהול
status             String    @default("pending")
// ערכים: pending | processing | processed | approved | rejected | failed
retryCount         Int       @default(0)          // מספר ניסיונות כושלים
failureReason      String?                        // סיבת כישלון
processedAt        DateTime?
approvedAt         DateTime?
```

> **אינדקסים:** `status`, `sourceId`

**מחזור חיים של `status`:**
```
pending → processing → processed → approved (→ Article נוצר)
                                 → rejected
        → failed (retryCount < 5 → pending again)
```

---

#### `Settings` — הגדרות גלובליות

```
id               String   @id @default(cuid())
autoPublish      Boolean  @default(true)       // פרסום אוטומטי
minScore         Int      @default(7)          // ציון מינימום לפרסום
publishInterval  Int      @default(60)         // דקות בין פרסומים
translationModel String                        // מודל OpenAI
```

---

### מודלים — כלי AI

#### `AITool` — ספריית כלי AI

```
id              String   @id @default(cuid())
name            String
slug            String   @unique
tagline         String?
descriptionAr   String   @db.Text             // תיאור קצר בערבית
contentAr       String?  @db.Text             // סקירה מלאה (800+ מילים)
website         String?
logoUrl         String?
screenshots     String[]
toolCategory    String   @default("other")    // טקסונומיה 18 קטגוריות
category        String   @default("other")    // שדה ישן (תאימות)
pricing         String   @default("freemium") // free | freemium | paid
monthlyPrice    Float?
pricingDetails  String?  @db.Text             // Markdown תמחור
pros            String[]
cons            String[]
useCases        String[]
arabicSupport   Boolean  @default(false)
hasApi          Boolean  @default(false)
tags            String[]
faq             Json?                         // [{question, answer}]
seoTitle        String?
seoDescription  String?
imageAlt        String?
relatedTopics   String[]
featured        Boolean  @default(false)
editorPick      Boolean  @default(false)
published       Boolean  @default(true)
viewCount       Int      @default(0)
likes           Int      @default(0)
releaseDate     DateTime?
lastUpdated     DateTime?
sourceUrl       String?
comparisons     ComparisonSide[]
```

> **אינדקסים:** `(toolCategory, published)`, `(published, viewCount)`, `(featured, published)` ועוד

---

#### `Company` — פרופילי חברות AI

```
id              String   @id @default(cuid())
name            String
slug            String   @unique
descriptionAr   String   @db.Text
website         String?
logoUrl         String?
country         String?
founded         Int?                           // שנת הקמה
specialties     String[]                       // תחומי התמחות (ערבית)
notableModels   String[]                       // מודלים ידועים
published       Boolean  @default(true)
viewCount       Int      @default(0)
```

---

#### `Guide` — מדריכים חינוכיים

```
id              String   @id @default(cuid())
title           String
slug            String   @unique
excerpt         String   @db.Text
content         String   @db.Text             // Markdown
category        String   // beginner | advanced | tutorial | how-to | comparison
tags            String[]
difficulty      String   @default("beginner")
faq             Json?
readingTime     Int?                          // דקות קריאה
published       Boolean  @default(true)
viewCount       Int      @default(0)
```

---

#### `Comparison` + `ComparisonSide` — השוואות כלים

**`Comparison`:**
```
id        String           @id @default(cuid())
slug      String           @unique
title     String
summaryAr String           @db.Text
verdict   String?          @db.Text           // המלצה סופית
criteria  Json?                               // [{name, weight}]
published Boolean          @default(true)
sides     ComparisonSide[]
```

**`ComparisonSide`** (כלי אחד בהשוואה):
```
comparisonId String
toolId       String
score        Int?           // 0-100
notes        String?
strengths    String[]
weaknesses   String[]
bestFor      String?
```

---

### מודלים — ספריית Prompts

#### `Prompt` — פרומפטים לכלי AI

```
id            String         @id @default(cuid())
title         String                               // שם באנגלית
titleAr       String                               // שם בערבית
slug          String         @unique
description   String         @db.Text
descriptionAr String         @db.Text
promptText    String         @db.Text             // הפרומפט עצמו
promptTextAr  String         @db.Text             // גרסה ערבית
examples      Json?
useCases      Json?
culturalNotes String?        @db.Text             // הערות תרבותיות
categoryId    String
aiModelId     String
tags          String[]
difficulty    String         @default("intermediate")
viewCount     Int            @default(0)
copyCount     Int            @default(0)
featured      Boolean        @default(false)
published     Boolean        @default(true)
```

#### `PromptQueue` — תור עיבוד פרומפטים
מבנה דומה ל-`ArticleQueue`, מעביר פרומפטים גולמיים לעיבוד AI.

#### `PromptSource` — מקורות חיצוניים לפרומפטים
```
name      String
type      String           // "github" | "web" | ...
url       String
config    Json?
active    Boolean
priority  Int
```

---

### מודלים — רשתות חברתיות

#### `SocialAccount` — חשבונות רשתות חברתיות

```
id          String       @id @default(cuid())
platform    String       // twitter | instagram | telegram | facebook | tiktok
name        String       // שם תצוגה
enabled     Boolean      @default(false)
credentials String       @db.Text   // JSON מוצפן עם מפתחות API
posts       SocialPost[]
```

#### `SocialPost` — פוסטים בתור

```
id        String    @id @default(cuid())
articleId String
accountId String
platform  String
caption   String    @db.Text
status    String    @default("pending")
// pending | approved | sent | failed | skipped
sentAt    DateTime?
errorMsg  String?
```

---

### מודלים — אחרים

#### `AdSlot` — חריצי פרסומות

```
id       String   @id @default(cuid())
name     String
position String   // header | sidebar | article-top | article-bottom | ...
type     String   @default("script")
code     String   @db.Text           // קוד HTML/JavaScript
enabled  Boolean  @default(true)
```

#### `TrendingKeyword` — מילות מפתח טרנדיות

```
keyword  String
count    Int      @default(1)
type     String   @default("tag")   // tag | keyword | topic
```

> **Unique:** `(keyword, type)` — מונע כפילויות

#### `ToolEvent` — מעקב אירועי כלים

```
toolId    String
type      String   // view | like | click
createdAt DateTime
```

---

## 3. צינור העיבוד של ידיעות

```
RSS מקורות
    │
    ▼
[fetch-news cron]
├── מביא עד 10 פריטים למקור מופעל
├── מסנן כפילויות (sourceUrl @unique)
├── מריץ isAiRelated() (classifier מהיר, ללא עלות API)
└── שומר ל-ArticleQueue (status: "pending")
    │
    ▼
[process-queue cron] — מעבד פריט אחד בכל הפעלה
├── מאפס פריטי "processing" תקועים (> 5 דקות)
├── לוקח פריט pending
├── שולח ל-processArticleWithAI()
│   ├── מבנה: system prompt + user prompt ל-GPT-4o-mini
│   ├── מחזיר JSON: titleAr, contentAr, summaryAr, tags, keywords,
│   │              seoTitle, seoDescription, slug, faq, imageAlt,
│   │              featuredImagePrompt, relatedTopics, isAiRelated
│   └── אם isAiRelated=false → status: "rejected"
├── מעדכן ArticleQueue (status: "processed")
└── אם כישלון: status: "failed", retryCount++
    │
    ▼
[אדמין /admin/queue]  ← בדיקה ידנית (אופציונלי)
├── אדמין רואה פריטים processed
├── יכול לערוך: קטגוריה, slug, כותרת
├── אישור → approveQueueItem()
└── דחיה → status: "rejected"
    │
    ▼
[publish-queue cron] — אם autoPublish=true
├── בודק מגבלה יומית (50 ידיעות/יום)
├── מריץ Replicate Flux לתמונה
│   └── מעלה ל-Cloudinary → URL קבוע
├── יוצר Article (published: true)
├── יוצר SocialPost לכל חשבון מופעל
└── pingGoogleNews() + pingGoogleSitemap()
    │
    ▼
[social-queue cron]
├── לוקח SocialPost (status: "pending")
├── מייצר caption באמצעות generateCaption()
├── שולח דרך provider מתאים (Twitter, Telegram, ...)
└── מעדכן status: "sent" | "failed"
```

---

## 4. API Routes

### מוסכמות

- כל ה-admin routes דורשים `session.user.role === "admin"`.
- ה-cron routes דורשים header: `Authorization: Bearer <CRON_SECRET>`.
- מענה שגיאה סטנדרטי: `{ error: "..." }` עם status מתאים.

---

### Admin — ניהול ידיעות

#### `GET /api/admin/articles`
מחזיר רשימת ידיעות עם חיפוש, סינון ומיון.

**Query params:**

| פרמטר | ברירת מחדל | תיאור |
|-------|------------|-------|
| `search` | — | חיפוש בכותרת (EN/AR) |
| `status` | `all` | `published` / `draft` |
| `sortBy` | `createdAt` | `publishedAt`, `viewCount`, `score` |
| `sortOrder` | `desc` | `asc` |
| `page` | `1` | עמוד |
| `limit` | `20` | פריטים לעמוד |

**Response:** `{ articles[], total, page, limit }`

---

#### `POST /api/admin/articles`
יוצר ידיעה חדשה. גוף הבקשה עובר ולידציה ב-`articleSchema` (Zod).

**Body (required):** `title, titleAr, slug, content, contentAr, categoryId`  
**Body (optional):** `excerpt, imageUrl, imageAlt, sourceName, tags[], keywords[], publishedAt, score, published`

---

#### `GET /api/admin/articles/[id]`
מחזיר ידיעה בודדת לפי id.

#### `PUT /api/admin/articles/[id]`
מעדכן ידיעה (כל השדות אופציונליים).

#### `DELETE /api/admin/articles/[id]`
מוחק ידיעה.

---

#### `POST /api/admin/articles/bulk`
פעולות גורפות על ידיעות.

**Body:** `{ action: "publish" | "unpublish" | "delete", ids: string[] }`

---

### Admin — ניהול תור

#### `GET /api/admin/queue`
מחזיר פריטי תור עם סינון וספירות לפי סטטוס.

**Query params:** `status, search, page, limit`  
**Response:** `{ items[], total, statusCounts: { pending, processing, processed, approved, rejected, failed } }`

#### `POST /api/admin/queue`
**Body:** `{ action: "reset-processing" }` — מאפס פריטי processing תקועים.

---

#### `GET /api/admin/queue/[id]`
מחזיר פריט תור בודד עם כל השדות.

#### `POST /api/admin/queue/[id]`
פעולה על פריט תור.

**Body:**
```json
{
  "action": "approve",
  "categoryId": "...",
  "slug": "...",
  "title": "...",
  "published": true
}
```
או `{ "action": "reject" }` / `{ "action": "retry" }`

**תהליך approve:**
1. `approveQueueItem(id, overrides)` נקרא
2. נוצר `Article` ב-DB
3. נוצרים `SocialPost` לכל חשבון מופעל
4. מחזיר `{ articleId }`

---

#### `POST /api/admin/queue/[id]/image`
ניהול תמונה לפריט תור.

**Body א':** `{ imageUrl: "https://..." }` — שומר URL ידני.  
**Body ב':** `{ generate: true }` — מריץ Replicate → מעלה ל-Cloudinary → שומר URL.

---

#### `POST /api/admin/queue/bulk`
**Body:** `{ action: "reject" | "retry", ids: string[] }`

---

### Admin — כלי AI

#### `GET /api/admin/ai-tools`
רשימת כל הכלים (כולל לא מפורסמים).

#### `POST /api/admin/ai-tools`
יוצר כלי AI חדש.

**שדות עיקריים:** `name, slug, tagline, descriptionAr, contentAr, website, logoUrl, toolCategory, pricing, monthlyPrice, pros[], cons[], useCases[], tags[], faq[], seoTitle, seoDescription, imageAlt, relatedTopics[], featured, editorPick, published, releaseDate, sourceUrl`

#### `GET/PUT/DELETE /api/admin/ai-tools/[id]`
פעולות CRUD על כלי בודד.

#### `POST /api/admin/ai-tools/[id]/regenerate`
מריץ מחדש `generateToolContent()` ב-OpenAI ומעדכן את הכלי.

---

### Admin — תוכן נוסף

| Route | Method | פעולה |
|-------|--------|-------|
| `/api/admin/categories` | GET, POST | ניהול תצריפים |
| `/api/admin/companies` | GET, POST | ניהול חברות |
| `/api/admin/companies/[id]` | GET, PUT, DELETE | חברה בודדת |
| `/api/admin/guides` | GET, POST | ניהול מדריכים |
| `/api/admin/guides/[id]` | GET, PUT, DELETE | מדריך בודד |
| `/api/admin/compare` | GET, POST | ניהול השוואות |
| `/api/admin/compare/[id]` | GET, PUT, DELETE | השוואה בודדת |
| `/api/admin/ads` | GET, POST | ניהול פרסומות |
| `/api/admin/ads/[id]` | GET, PUT, DELETE | פרסומת בודדת |

---

### Admin — רשתות חברתיות

#### `GET /api/admin/social/accounts`
רשימת חשבונות רשתות חברתיות.

#### `POST /api/admin/social/accounts`
יוצר חשבון חדש.  
**Body:** `{ platform, name, credentials: { ...API keys } }`  
הcredentials מאוחסנים כ-JSON string ב-DB.

#### `PUT /api/admin/social/accounts/[id]`
מעדכן חשבון (enabled/disabled, עדכון credentials).

#### `GET /api/admin/social/posts`
רשימת פוסטים לפי status.

#### `PUT /api/admin/social/posts/[id]`
מעדכן סטטוס פוסט (`approved`, `skipped`).

---

### Admin — SEO

#### `GET /api/admin/seo`
מחזיר ניתוח SEO של כל התוכן.

**Response:**
```json
{
  "summary": {
    "overallScore": 78,
    "articleSeoScore": 82,
    "toolSeoScore": 74,
    "totalArticles": 150,
    "totalTools": 80,
    "articlesMissingSeoCount": 27,
    "toolsMissingSeoCount": 21,
    "uncoveredKeywordsCount": 12
  },
  "articlesMissingSeo": [...],
  "toolsMissingSeo": [...],
  "topKeywords": [{ "keyword": "ChatGPT", "count": 45 }, ...],
  "uncoveredKeywords": [...],
  "categoryCoverage": [...]
}
```

**לוגיקת החישוב:**
- `articleSeoScore` = (ידיעות עם `imageAlt` ו-`keywords` לא ריק) / סה"כ × 100
- `toolSeoScore` = (כלים עם `seoTitle`, `seoDescription`, `imageAlt`) / סה"כ × 100
- `overallScore` = ממוצע שני הציונים
- `uncoveredKeywords` = מילות `TrendingKeyword` שאינן מופיעות ב-keywords/tags של אף ידיעה/כלי

---

#### `POST /api/admin/seo/analyze`
מריץ ניתוח AI (OpenAI) על נתוני SEO.

**Body:** `{ topKeywords[], uncoveredKeywords[], categoryCoverage[], overallScore }`

**Response:**
```json
{
  "summary": "תיאור מצב SEO...",
  "strengths": ["..."],
  "gaps": ["..."],
  "recommendations": [
    { "title": "...", "description": "...", "priority": "high" }
  ],
  "contentIdeas": [
    { "topic": "...", "keywords": ["..."], "reason": "..." }
  ]
}
```

---

### Admin — Analytics

#### `GET /api/admin/analytics`
מחזיר נתוני אנליטיקס של 30 הימים האחרונים.

**Response:**
```json
{
  "summary": {
    "totalViews": 12430,
    "totalArticles": 340,
    "publishedArticles": 290,
    "articlesLast7d": 45,
    "articlesLast30d": 180
  },
  "days": [{ "date": "2026-04-21", "articles": 5, "views": 120 }, ...],
  "topArticles": [...],
  "categoryStats": [...],
  "sourceStats": [...],
  "queueBreakdown": { "pending": 3, "processed": 12, "failed": 1, ... }
}
```

---

### Cron Routes

כל ה-cron routes דורשים:
```
Authorization: Bearer <CRON_SECRET>
```

#### `GET /api/cron/fetch-news`
מביא ידיעות חדשות מ-RSS.

**תהליך:**
1. מביא מקורות פעילים לפי `priority ASC`
2. לכל מקור: `fetchRssFeed(rssUrl)` → מסנן `isAiRelated()` → שומר ל-`ArticleQueue`
3. מדלג על sourceUrl שכבר קיים (`@unique` ב-DB)
4. מעדכן `source.lastSyncedAt`

**Response:** `{ ok, sources: N, totalAdded: N, totalFailed: N, results[] }`

---

#### `GET /api/cron/process-queue`
מעבד ידיעה אחת מהתור.

**תהליך:**
1. מאפס `processing` שתקועים > 5 דקות → חזרה ל-`pending`
2. לוקח פריט `pending` יחיד
3. `markProcessing(id)` → status: "processing"
4. `processArticleWithAI(title, content)` → קורא ל-OpenAI
5. אם `isAiRelated=false` → `rejectQueueItem(id)`
6. אחרת → `markProcessed(id, result)` → status: "processed"
7. אם שגיאה → `markFailed(id, reason)` (עד 5 ניסיונות, אחר כך: "failed")

**Response:** `{ ok, status: "processed"|"rejected"|"failed"|"empty" }`

---

#### `GET /api/cron/publish-queue`
מפרסם ידיעה אחת.

**תהליך:**
1. בודק ידיעות שפורסמו היום: אם ≥ 50 → עוצר
2. בודק הפרש זמן מהפרסום האחרון (`publishInterval` דקות)
3. לוקח פריט `processed` אחד
4. `generateArticleImage(featuredImagePrompt)`:
   - מריץ Replicate Flux-Schnell
   - מעלה תוצאה ל-Cloudinary
   - אם נכשל: `uploadImageFromUrl(rawImageUrl)` מ-RSS
   - אם נכשל: תמונת placeholder לפי קטגוריה
5. יוצר `Article` ב-DB (published: true)
6. יוצר `SocialPost` לכל `SocialAccount` מופעל
7. `pingGoogleNews()` + `pingGoogleSitemap()`

**Response:** `{ ok, published: slug, imageUrl, publishedToday: N }`

---

#### `GET /api/cron/social-queue`
שולח פוסטים ממתינים לרשתות חברתיות.

**תהליך:**
1. מביא `SocialPost` (status: "pending")
2. מביא `SocialAccount` מתאים
3. `generateCaption(article, platform)` → OpenAI → caption מותאם לפלטפורמה
4. `getProvider(platform).send(caption, mediaUrl, credentials)`
5. status → "sent" | "failed"

---

#### `GET /api/cron/fetch-prompts`
מביא פרומפטים ממקורות חיצוניים (GitHub repos ועוד).

#### `GET /api/cron/process-prompts`
מעבד פרומפט אחד: OpenAI → תרגום + העשרה → `PromptQueue` processed.

#### `GET /api/cron/trending`
מחשב מחדש את `TrendingKeyword` מ-tags/keywords של ידיעות האחרונות.

---

### Public API Routes

#### `GET /api/articles`
ידיעות מפורסמות (ציבורי, עם paginate).

**Query:** `page, limit, category, search`

#### `GET /api/news`
ידיעות אחרונות (קצרות, לפיד).

#### `POST /api/views/[slug]`
מגדיל `viewCount` של ידיעה ב-1.

#### `GET /api/search`
חיפוש גלובלי.

**Query:** `q, type (articles|tools|prompts), limit`  
**Response:** `{ results: [...] }`

#### `GET /api/ads`
מחזיר פרסומות לפי עמדה.

**Query:** `position`

#### `GET /api/prompts`
פרומפטים מפורסמים.

**Query:** `category, model, q, page, limit`

#### `POST /api/tools/[id]/like`
מגדיל `likes` של כלי ב-1.

---

## 5. ספריות עזר (lib/)

### `lib/openai.ts`

אחראי על כל האינטגרציה עם OpenAI.

```typescript
// types
type FaqItem = { question: string; answer: string }

type AiProcessedArticle = {
  titleAr: string
  summaryAr: string
  contentAr: string
  tags: string[]
  seoTitle: string
  seoDescription: string
  suggestedCategory: string   // ai-models|research|companies|tools|policy
  slug: string
  featuredImagePrompt: string // prompt לתמונה (אנגלית, עד 20 מילים)
  faq: FaqItem[]
  keywords: string[]
  imageAlt: string
  relatedTopics: string[]
  isAiRelated: boolean
}
```

**`processArticleWithAI(title, content)`**
- מודל: `process.env.OPENAI_MODEL ?? "gpt-4o-mini"`
- טמפרטורה: 0.7
- max_tokens: 3500
- system prompt: עיתונאי ערבי מקצועי
- user prompt: כולל כותרת + 6000 תווים ראשונים מהתוכן
- מחזיר: JSON מפורסר של `AiProcessedArticle`
- מנקה markdown wrappers מהתשובה לפני JSON.parse

---

### `lib/rss.ts`

```typescript
type RssItem = {
  title: string
  link: string
  description: string
  pubDate?: string
  content?: string
  imageUrl?: string
}

fetchRssFeed(url: string): Promise<RssItem[]>
```

- תמיכה ב-RSS 2.0 וב-Atom
- timeout: 15 שניות
- אורך תוכן מינימום: 400 תווים
- חיפוש תמונה: `enclosure` → `media:content` → `media:thumbnail` → `<img>` בתוכן

---

### `lib/cloudinary.ts`

```typescript
uploadImageFromUrl(sourceUrl: string, folder?: string): Promise<string | null>
```

- מעלה תמונה מ-URL ל-Cloudinary
- פורמט: WebP, quality: auto:good
- תיקייה ברירת מחדל: `"aiscope/articles"`
- מחזיר URL קבוע (CDN) או null אם נכשל

---

### `lib/replicate.ts`

```typescript
generateArticleImage(prompt: string): Promise<string | null>
```

- מודל: `black-forest-labs/flux-schnell`
- יחס גובה-רוחב: 16:9
- פורמט: WebP, quality: 85
- מחזיר URL זמני מ-Replicate → מעלה מיד ל-Cloudinary → מחזיר URL קבוע
- מחזיר null אם נכשל

---

### `lib/classifier.ts`

```typescript
isAiRelated(title: string, content: string): boolean
```

- בדיקה מהירה על בסיס מילות מפתח (ללא API)
- מילות מפתח אנגלית: `ai, machine learning, neural, gpt, llm, chatbot, ...`
- מילות מפתח ערבית: `الذكاء الاصطناعي, نموذج, تعلم الآلة, ...`
- משמש כ-pre-filter לפני קריאה ל-OpenAI

---

### `lib/queue.ts`

מנהל מחזור חיים של פריטי `ArticleQueue`.

```typescript
enqueueItem(item: RssItem & { sourceId?, categoryId? }): Promise<string | null>
// מחזיר id של פריט חדש, או null אם כפילות

markProcessing(id: string): Promise<void>
// status → "processing", processedAt = null

markProcessed(id: string, result: AiProcessedArticle): Promise<void>
// שומר תוצאות AI, status → "processed"

markFailed(id: string, reason: string): Promise<void>
// status → "failed" | "processing" (תלוי retryCount), retryCount++

resetForRetry(id: string): Promise<void>
// status → "pending", retryCount = 0

approveQueueItem(id: string, overrides?: {...}): Promise<string>
// יוצר Article, status → "approved"
// יוצר SocialPost לכל SocialAccount מופעל
// מחזיר articleId

rejectQueueItem(id: string): Promise<void>
// status → "rejected"
```

**לוגיקת fallback תמונות ב-`approveQueueItem`:**
- אם יש `imageUrl` → `uploadImageFromUrl()` → Cloudinary
- אחרת: placeholder לפי קטגוריה (Picsum)

---

### `lib/seo.ts`

```typescript
SITE_URL: string        // process.env.NEXT_PUBLIC_SITE_URL
SITE_NAME: string       // "AI Scope"
SITE_NAME_AR: string    // "نطاق الذكاء الاصطناعي"
SITE_DESCRIPTION_AR: string
SITE_TWITTER_HANDLE: string  // "@AIScope_ar"

buildTitle(pageTitle: string): string
// → "pageTitle | AI Scope"

buildArticleTitle(titleAr: string): string
// → "titleAr | نطاق الذكاء الاصطناعي"

truncate(text: string, maxLen?: number): string
// ברירת מחדל: 160 תווים, מסיים ב-"…"

absoluteUrl(path: string): string
// → "https://ai-scope.com/path"
```

---

### `lib/ping.ts`

```typescript
pingGoogleNews(): Promise<void>
// GET https://www.google.com/ping?sitemap=.../news-sitemap.xml

pingGoogleSitemap(): Promise<void>
// GET https://www.google.com/ping?sitemap=.../sitemap.xml
```

נקרא אחרי כל פרסום ידיעה חדשה.

---

### `lib/auth.ts`

```typescript
auth(): Promise<Session | null>
// שולף session נוכחי (server-side)
```

הגדרות NextAuth:
- אסטרטגיה: JWT
- Provider: CredentialsProvider
- authentication: hashSync (SHA256) על הסיסמה
- email ברירת מחדל: `ADMIN_EMAIL` | `"admin@aiscope.local"`
- סיסמה ברירת מחדל: `ADMIN_PASSWORD` | `"admin123456"`

---

### `lib/tools-ingestion.ts`

```typescript
type RawToolInput = {
  name: string
  website: string
  logoUrl?: string
  tagline?: string
  rawDescription: string
  pricing?: string
  monthlyPrice?: number
  sourceUrl?: string
  sourceName?: string
  tags?: string[]
}

generateToolContent(tool: RawToolInput): Promise<AiToolContent | null>
// קורא ל-OpenAI לייצור סקירה ערבית מלאה לכלי

ingestTool(input: RawToolInput): Promise<{ status: "created"|"duplicate"|"failed", slug? }>
// 1. בודק כפילות לפי website URL
// 2. generateToolContent() → OpenAI
// 3. שומר ל-AITool (published: false)
```

---

### `lib/social/`

#### `lib/social/types.ts`
```typescript
type SocialPlatform = "twitter" | "instagram" | "telegram" | "facebook" | "tiktok"

interface SocialProvider {
  send(caption: string, mediaUrl: string | null, credentials: object): Promise<void>
}

PLATFORM_HINTS: Record<SocialPlatform, {
  maxChars: number
  hashtagCount: number
  style: string
}>
```

#### `lib/social/generate.ts`
```typescript
generateCaption(article: ArticleData, platform: SocialPlatform): Promise<string>
// קורא ל-OpenAI עם PLATFORM_HINTS[platform]
// מחתך לפי maxChars של הפלטפורמה

generateAllCaptions(article: ArticleData, platforms: SocialPlatform[]): Promise<Record<SocialPlatform, string>>
// Promise.all על כל הפלטפורמות
```

#### `lib/social/index.ts`
```typescript
getProvider(platform: SocialPlatform): SocialProvider
// מחזיר instance של provider מתאים
```

#### Providers — `lib/social/providers/`

| קובץ | פלטפורמה | API |
|------|----------|-----|
| `twitter.ts` | Twitter/X | API v2 |
| `telegram.ts` | Telegram | Bot API |
| `facebook.ts` | Facebook | Graph API |
| `instagram.ts` | Instagram | Graph API |
| `tiktok.ts` | TikTok | OAuth 2.0 |

---

### `lib/prompts/`

#### `lib/prompts/process.ts`
```typescript
processPromptWithAI(item: PromptQueue): Promise<ProcessedPrompt>
// קורא ל-OpenAI לתרגום + העשרת פרומפט

autoPublishPrompt(queueId: string): Promise<void>
// מעביר פרומפט מעובד ל-Prompt (published: true)
```

#### `lib/prompts/scrapers/github.ts`
```typescript
scrapeAwesomePrompts(): Promise<RawPrompt[]>
// גורד repo-ים של "awesome-prompts" ב-GitHub
```

---

### `lib/validations/article.ts`

```typescript
const articleSchema = z.object({
  title:      z.string().min(1),
  titleAr:    z.string().min(1),
  slug:       z.string().min(1),
  content:    z.string().min(1),
  contentAr:  z.string().min(1),
  categoryId: z.string().min(1),
  // optional:
  excerpt, imageUrl, imageAlt, sourceName,
  tags, keywords, publishedAt, score, published
})
```

---

## 6. עמודי ציבור (app/(main)/)

### Layout

**`app/(main)/layout.tsx`** — רכיב שרת, עוטף עם `<Header>` ו-`<Footer>`.

---

### עמוד ראשי — `app/(main)/page.tsx`

`export const dynamic = "force-dynamic"`

**נתונים שנטענים במקביל:**
- 13 ידיעות אחרונות
- 5 ידיעות טרנדיות (7 ימים, viewCount גבוה)
- 5 ידיעות הנקראות ביותר (all-time)
- כל התצריפים עם ספירת ידיעות
- 6 כלי AI מומלצים (featured)

**מה מוצג:**
- Hero עם סטטיסטיקות חיות
- כרטיס ידיעה ראשית (featured)
- גלריית כלי AI עם קישורי קטגוריה
- רצועת טרנדינג (גלילה אופקית)
- רשת ידיעות ראשית + sidebar
- `<LiveFeed>` — לשוניות קטגוריה + סינון (client component)
- "הנקראים ביותר" בצד

---

### עמוד כלי AI — `app/(main)/ai-tools/page.tsx`

`export const revalidate = 300` (ISR — מתרענן כל 5 דקות)

**נתונים:** כל הכלים המפורסמים מקובצים לפי `toolCategory`  
**מה מוצג:** tabs, filters, cards בגריד

---

### עמוד כלי בודד — `app/(main)/ai-tools/[slug]/page.tsx`

**generateMetadata:** SEO דינמי מ-`tool.seoTitle`, `tool.seoDescription`, OG image  
**מה מוצג:** פרטי כלי, FAQ, כלים קשורים, קישורי השוואה

---

### עמוד ידיעה — `app/(main)/news/[slug]/page.tsx`

**generateMetadata:** כותרת, description, OG tags, canonical URL  
**רכיבים:**
- `<ViewTracker>` — POST /api/views/[slug] בעת טעינה
- `<ReadingProgress>` — סרגל קריאה
- `<ShareButtons>` — שיתוף סושיאל
- `<AdSlot position="article-top">` + `position="article-bottom"`

---

### עמודים נוספים

| עמוד | Route | קאשינג |
|------|-------|--------|
| חיפוש | `/search?q=...` | dynamic |
| קטגוריה | `/category/[slug]` | dynamic |
| נושא | `/topic/[slug]` | dynamic |
| ספריית Prompts | `/tools` | dynamic |
| פרומפט בודד | `/tools/[slug]` | revalidate 600 |
| Prompts לפי קטגוריה | `/tools/category/[slug]` | revalidate 300 |
| מדריכים | `/guides` | revalidate 600 |
| מדריך בודד | `/guides/[slug]` | revalidate 600 |
| כלים לפי שימוש | `/ai-tools/for/[usecase]` | revalidate 300 |
| השוואות | `/compare` | revalidate 600 |
| השוואה בודדת | `/compare/[slug]` | revalidate 600 |
| חברות | `/companies` | revalidate 600 |
| חברה בודדת | `/companies/[slug]` | revalidate 600 |
| אלטרנטיבות | `/alternatives/[slug]` | revalidate 600 |
| אודות | `/about` | static |
| פרטיות | `/privacy` | static |
| תנאי שימוש | `/terms` | static |
| יצירת קשר | `/contact` | static |

---

## 7. פאנל אדמין (app/admin/)

כל העמודים דורשים session עם `role: "admin"`.  
ניווט דרך `/admin/login` (CredentialsProvider של NextAuth).

---

### `/admin` — דשבורד ראשי

**Server Component** עם `force-dynamic`.

**נתונים שנטענים:** articleCount, publishedCount, publishedToday, recentArticles, topArticles, categories, sources, settings, pendingQueue, processedQueue, failedQueue, totalViews, activeAds, activeSocialAccounts, pendingSocialPosts, guideCount, toolCount, companyCount, comparisonCount, trendingKeywords

**כרטיסי ניווט לכל מקטע האדמין** (כולל כרטיס SEO חדש).

---

### `/admin/articles` — ניהול ידיעות

`"use client"` — טוען נתונים ב-`useEffect` מ-`/api/admin/articles`.

**תכונות:**
- טבלה עם עמודות הניתנות למיון
- חיפוש בזמן אמת
- סינון: published/draft
- Bulk actions: publish, unpublish, delete
- Pagination (20 פריטים לעמוד)
- מחיקה עם dialog אישור

---

### `/admin/queue` — תור ביקורת

`"use client"` — הממשק המורכב ביותר במערכת.

**תכונות:**
- לשוניות סטטוס עם ספירות (pending, processed, failed, approved, rejected)
- שורות הניתנות להרחבה עם:
  - תמונה ממוזערת
  - תגית סטטוס, תצריף, מקור
  - סיכום ותוכן מלא
  - עורך תמונה (צפייה/העלאה/יצירה ע"י AI)
- טופס אישור: תצריף, slug, כותרת, האם לפרסם מיד
- כפתור retry לפריטים כושלים
- Bulk actions: retry, reject
- כפתור איפוס processing תקועים

---

### `/admin/seo` — דשבורד SEO

`"use client"` — טוען מ-`/api/admin/seo`.

**תכונות:**
- `ScoreRing` — טבעת SVG עם ניקוד 0–100 (ירוק ≥80, צהוב ≥60, אדום <60)
- 4 לשוניות:
  - **نظرة عامة:** כיסוי תצריפים + מילות מפתח לא מכוסות
  - **المقالات:** ידיעות חסרי `imageAlt`/`keywords` עם לינק לעריכה
  - **الأدوات:** כלים חסרי SEO fields
  - **الكلمات المفتاحية:** Top 20 + מילים טרנדיות ללא תוכן
- כפתור **"تحليل AI"** → POST /api/admin/seo/analyze → מציג panel עם חוזקות, פערים, המלצות, 5 רעיונות תוכן

---

### `/admin/analytics` — אנליטיקס

`"use client"` — מציג נתוני 30 ימים.

**רכיבים:**
- `<BarChart>` — גרף SVG עמודות יומי (מאמרים / צפיות)
- `<HBar>` — פס אחוזי אופקי
- `<StatCard>` — כרטיס סטטיסטיקה
- תצריפים לפי views, מקורות לפי views, top 10 ידיעות

---

### עמודי אדמין נוספים

| עמוד | פעולות עיקריות |
|------|----------------|
| `/admin/sources` | CRUD, enable/disable, priority, test feed |
| `/admin/ai-tools` | CRUD, bulk publish, regenerate content |
| `/admin/companies` | CRUD, search |
| `/admin/compare` | CRUD, הוסף/הסר צדדים |
| `/admin/guides` | CRUD, difficulty/category filter |
| `/admin/prompts` | CRUD |
| `/admin/prompts/queue` | ביקורת + אישור פרומפטים |
| `/admin/ads` | CRUD, enable/disable |
| `/admin/social` | ניהול חשבונות + ביקורת + שליחת פוסטים |

---

## 8. רכיבים (components/)

### Layout

**`Header.tsx`** — ניווט ראשי, לינקים לקטגוריות, שדה חיפוש  
**`Footer.tsx`** — לינקים, זכויות יוצרים  
**`AdSlot.tsx`** — מרנדר קוד HTML/JS של פרסומת לפי position

---

### תוכן

**`NewsCard.tsx`** — כרטיס ידיעה (תמונה, כותרת, תקציר, מקור, תאריך, קטגוריה)

**`ToolCard.tsx`** — כרטיס כלי AI (לוגו, שם, tagline, pricing badge, tags, כפתור like)

**`ToolsDirectory.tsx`** — ספריית כלים עם tabs לקטגוריות וסינונים

**`LiveFeed.tsx`** — `"use client"`, פיד ידיעות חי עם:
- לשוניות קטגוריה
- סינון בזמן אמת
- timestamps (date-fns, ar locale)

**`ToolInteractions.tsx`** — `"use client"`, כפתורי like/share לכלי

---

### UX

**`ViewTracker.tsx`** — `"use client"`, POST /api/views/[slug] ב-useEffect  
**`ReadingProgress.tsx`** — `"use client"`, סרגל קריאה (scroll progress)  
**`ShareButtons.tsx`** — שיתוף WhatsApp, Twitter, Telegram  
**`SearchBox.tsx`** — שדה חיפוש עם הצעות  
**`AnalyticsProvider.tsx`** — Google Analytics 4  
**`CardSkeleton.tsx`** — skeleton loading

---

### Admin

**`AdminLoginForm.tsx`** — `"use client"`, טופס כניסה (signIn מ-NextAuth)  
**`AdminSignOutButton.tsx`** — כפתור יציאה  
**`ArticleForm.tsx`** — טופס יצירה/עריכת ידיעה

---

### shadcn/ui

`ui/button`, `ui/input`, `ui/textarea`, `ui/select`, `ui/badge`, `ui/card`, `ui/dialog`, `ui/dropdown-menu`, `ui/table`, `ui/toast`

---

## 9. משתני סביבה

```bash
# מסד נתונים
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
DIRECT_URL="postgresql://..."          # עוקף connection pooler (Vercel)

# NextAuth
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="random-secret-32chars"

# כניסת אדמין (ברירות מחדל: admin@aiscope.local / admin123456)
ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_PASSWORD="your-secure-password"

# OpenAI
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o-mini"             # אופציונלי, ברירת מחדל: gpt-4o-mini

# Replicate (יצירת תמונות)
REPLICATE_API_TOKEN="r8_..."

# Cloudinary (אחסון תמונות)
CLOUDINARY_CLOUD_NAME="your-cloud"
CLOUDINARY_API_KEY="123456789"
CLOUDINARY_API_SECRET="abc..."

# Cron security
CRON_SECRET="random-long-secret"       # Header: Authorization: Bearer <CRON_SECRET>

# Site
NEXT_PUBLIC_SITE_URL="https://yourdomain.com"
NEXT_PUBLIC_GSC_VERIFICATION="google..."   # Google Search Console verification
```

---

## 10. Cron Jobs

מומלץ להשתמש ב-**Vercel Cron** או שירות חיצוני כמו **EasyCron**.

| Job | Endpoint | תדירות מומלצת | מה עושה |
|-----|----------|----------------|---------|
| Fetch news | `GET /api/cron/fetch-news` | כל 15 דקות | מביא RSS חדש |
| Process queue | `GET /api/cron/process-queue` | כל 2 דקות | מעבד ידיעה אחת |
| Publish queue | `GET /api/cron/publish-queue` | כל 5 דקות | מפרסם ידיעה אחת |
| Social queue | `GET /api/cron/social-queue` | כל 10 דקות | שולח פוסטים |
| Trending | `GET /api/cron/trending` | כל שעה | עדכן מילות מפתח |
| Fetch prompts | `GET /api/cron/fetch-prompts` | פעם ביום | מביא פרומפטים |
| Process prompts | `GET /api/cron/process-prompts` | כל 5 דקות | מעבד פרומפט אחד |

**Headers לכל קריאה:**
```
Authorization: Bearer <CRON_SECRET>
```

---

## 11. אימות וניהול הרשאות

### כיצד עובד

1. `/admin/login` — טופס שולח `signIn("credentials", { email, password })`
2. NextAuth מוצא משתמש ב-DB → מאמת סיסמה (SHA256)
3. JWT נשמר ב-cookie מוצפן (`NEXTAUTH_SECRET`)
4. כל server component ב-admin: `const session = await auth()` → redirect אם null
5. כל admin API route: `requireAdmin()` → `auth()` → בדיקת `role === "admin"`

### הוספת אדמין
כרגע המשתמש היחיד מוגדר ב-env vars. להוסיף משתמשים — יש להרחיב את `authOptions` ב-`lib/auth.ts` לשאול את ה-DB.

---

## 12. SEO ומטא-דאטה

### Metadata דינמית

כל עמוד תוכן ממש את `generateMetadata()`:

```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const article = await getArticle(params.slug)
  return {
    title: buildArticleTitle(article.titleAr),
    description: truncate(article.excerpt ?? article.summaryAr, 160),
    openGraph: {
      title: article.titleAr,
      description: ...,
      images: [{ url: article.imageUrl }],
      type: "article",
    },
    twitter: { card: "summary_large_image", ... },
    alternates: { canonical: absoluteUrl(`/news/${article.slug}`) },
  }
}
```

### Sitemap

- **`/sitemap.ts`** — כל הידיעות, כלים, חברות, מדריכים, השוואות (דינמי, Next.js Metadata API)
- **`/news-sitemap.xml`** — News Sitemap עבור Google News (format מיוחד)
- **`/rss.xml`** — RSS feed מ-`lib/rss.ts`
- **`/robots.ts`** — robots.txt, disallow /admin

### Ping לגוגל

אחרי כל פרסום: `pingGoogleNews()` + `pingGoogleSitemap()` → מבקש מגוגל לסרוק מחדש.

---

## 13. רשתות חברתיות

### תהליך פרסום

```
Article נוצר
    │
    ▼
approveQueueItem() / publish-queue cron
    │
    ├── SocialPost נוצר לכל SocialAccount מופעל
    │   (status: "pending")
    │
    ▼
social-queue cron
    │
    ├── generateCaption(article, platform)
    │   └── OpenAI עם PLATFORM_HINTS מתאים לפלטפורמה
    │
    └── getProvider(platform).send(caption, imageUrl, credentials)
        ├── twitter.ts → POST /2/tweets
        ├── telegram.ts → sendMessage (Bot API)
        ├── facebook.ts → POST /{pageId}/feed
        ├── instagram.ts → POST /{igUserId}/media
        └── tiktok.ts → upload + POST /v2/post/publish
```

### PLATFORM_HINTS

| פלטפורמה | maxChars | hashtagCount | style |
|----------|----------|--------------|-------|
| twitter | 280 | 3 | קצר, ישיר |
| instagram | 2200 | 10 | storytelling |
| telegram | 4096 | 5 | אינפורמטיבי |
| facebook | 63206 | 5 | שיחתי |
| tiktok | 2200 | 8 | טרנדי |

---

## 14. תרשים זרימת נתונים

```
┌─────────────────────────────────────────────────────────────┐
│                      EXTERNAL SOURCES                       │
│   RSS Feeds    GitHub Repos    Product Hunt    Futurepedia  │
└───────┬────────────────┬─────────────────────────┬──────────┘
        │                │                         │
        ▼                ▼                         ▼
   fetch-news      fetch-prompts             admin manual
   cron job         cron job                 input
        │                │                         │
        ▼                ▼                         ▼
┌──────────────┐  ┌─────────────┐        ┌──────────────┐
│ ArticleQueue │  │PromptQueue  │        │   AITool     │
│ status:      │  │ status:     │        │ published:   │
│ pending      │  │ pending     │        │ false        │
└──────┬───────┘  └──────┬──────┘        └──────┬───────┘
       │                 │                      │
       ▼                 ▼                      ▼
process-queue       process-prompts       generateToolContent()
cron job            cron job              (OpenAI)
       │                 │                      │
       ▼                 ▼                      ▼
status: processed   status: processed     AITool (published: false)
       │                 │                      │
       ▼                 ▼               admin review
  admin review      auto-publish               │
  OR auto           (autoPublishPrompt)         ▼
       │                 │               AITool (published: true)
       ▼                 │
  approveQueueItem()     ▼
  + publishQueue         Prompt
  cron                (published: true)
       │
       ▼
  Article (published: true)
  + SocialPost[] (pending)
       │
       ├── pingGoogleNews()
       ├── pingGoogleSitemap()
       │
       ▼
  social-queue cron
       │
       ▼
  Platform APIs (Twitter, Telegram, Facebook, Instagram, TikTok)
       │
       ▼
  SocialPost status: "sent"
```

---

*תיעוד זה נוצר על בסיס קריאת קוד מלאה של המערכת.*  
*עדכון אחרון: 2026-05-21*
