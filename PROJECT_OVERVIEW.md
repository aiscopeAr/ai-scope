# AIScope — תיעוד מלא של הפרויקט

> עודכן: 2026-05-25

---

## תוכן עניינים
1. [מה זה AIScope?](#מה-זה-aiscope)
2. [Stack טכנולוגי](#stack-טכנולוגי)
3. [משתני סביבה](#משתני-סביבה)
4. [מסד הנתונים — מודלים](#מסד-הנתונים--מודלים)
5. [ה-Pipeline: מ-RSS לפרסום](#ה-pipeline-מ-rss-לפרסום)
6. [Cron Jobs — לוח זמנים](#cron-jobs--לוח-זמנים)
7. [הכתבים — זיד ולינא](#הכתבים--זיד-ולינא)
8. [יצירת תמונות](#יצירת-תמונות)
9. [Embeddings וזיכרון הכתב](#embeddings-וזיכרון-הכתב)
10. [סושיאל מדיה](#סושיאל-מדיה)
11. [ממשק האדמין](#ממשק-האדמין)
12. [דפים פרונטאנד](#דפים-פרונטאנד)
13. [SEO ו-Schema.org](#seo-ו-schemaorg)
14. [סקריפטים עזר](#סקריפטים-עזר)
15. [מבנה תיקיות](#מבנה-תיקיות)

---

## מה זה AIScope?

אתר חדשות וניתוחים בערבית בתחום הבינה המלאכותית. המערכת:
- **מאחזרת** כתבות אוטומטית מ-RSS feeds של מקורות AI מובילים
- **מקבצת** כתבות קשורות לנושאים
- **כותבת** תחקיר עמוק בערבית בעזרת GPT-4o, בקול של אחד משני "כתבי AI" — זיד או לינא
- **מפרסמת** אוטומטית (עד 3 מאמרים ביום) עם תמונה שנוצרת ב-Replicate
- **מפיצה** לסושיאל מדיה (Twitter, Telegram ועוד)

---

## Stack טכנולוגי

| שכבה | טכנולוגיה |
|------|-----------|
| Framework | Next.js 16.2.6 (App Router) |
| UI | React 19, Tailwind CSS, shadcn/ui, Radix UI |
| DB | PostgreSQL + pgvector (Prisma ORM v6) |
| Auth | NextAuth v4 (credentials) |
| AI — כתיבה | OpenAI GPT-4o (`OPENAI_MODEL` env) |
| AI — clustering | GPT-4o-mini |
| AI — embeddings | text-embedding-3-small (1536 dims) |
| תמונות | Replicate flux-schnell → Cloudinary |
| Deploy | Vercel (Hobby plan — crons יומיים בלבד) |

---

## משתני סביבה

```env
# DB
DATABASE_URL=           # Prisma connection pooler URL
DIRECT_URL=             # Direct Postgres URL (for migrations)

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=           # e.g. https://ai-scope.vercel.app
ADMIN_EMAIL=
ADMIN_PASSWORD=

# AI
OPENAI_API_KEY=
OPENAI_MODEL=           # ברירת מחדל: gpt-4o

# תמונות
REPLICATE_API_TOKEN=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# אבטחת crons
CRON_SECRET=            # Bearer token שVercel מוסיף אוטומטית

# SEO
NEXT_PUBLIC_SITE_URL=   # e.g. https://ai-scope.vercel.app
```

---

## מסד הנתונים — מודלים

### Source
מקורות RSS מנוהלים מהאדמין.
```
id, name, rssUrl, website, enabled, priority, lastSyncedAt
```

### NewsItem
פריט RSS גולמי לפני עיבוד.
```
id, sourceUrl (unique), title, content, publishedAt, sourceName, sourceId
imageUrl, status: "pending"|"clustered"|"skipped"
clusterId → ReviewQueue
```

### ReviewQueue
אשכול של כמה NewsItems → ייהפך לתחקיר אחד.
```
id, topic, authorSlug
titleAr, contentAr, summaryAr, tags[], keywords[], faq, imageAlt
seoTitle, seoDescription, slug, imageUrl, featuredImagePrompt
status: "pending"|"processing"|"processed"|"approved"|"rejected"|"failed"
retryCount, failureReason, processedAt, approvedAt
```

### Review
מאמר מפורסם — יחידת התוכן המרכזית.
```
id, title, titleAr, slug (unique)
summary, content (Markdown 1500-3000 מילים)
authorSlug: "zayd"|"lina"
categoryId → Category
tags[], keywords[], faq (JSON), imageUrl, imageAlt
seoTitle, seoDescription
sources (JSON: [{title, url, name}])
relatedIds[], viewCount, published, publishedAt
embedding: vector(1536)   ← pgvector
```

### Category
```
id, name, nameAr, slug (unique)
```

### SocialAccount
```
id, platform: "twitter"|"instagram"|"telegram"|"facebook"|"tiktok"
name, enabled, credentials (JSON)
```

### SocialPost
```
id, reviewId → Review, accountId → SocialAccount
platform, caption, status: "pending"|"approved"|"sent"|"failed"|"skipped"
sentAt, errorMsg
```

### AdSlot
```
id, name, position, type: "script", code, enabled
```

### AITool
מדריך כלי AI (ספרייה נפרדת, לא חלק מה-pipeline).
```
id, name, slug, tagline, descriptionAr, contentAr
website, logoUrl, screenshots[], toolCategory, category, pricing
monthlyPrice, pricingDetails, pros[], cons[], useCases[]
arabicSupport, hasApi, tags[], faq, seo*
featured, editorPick, published, viewCount, likes
```

### Comparison / ComparisonSide
השוואות בין כלי AI.

### TrendingKeyword
מילות מפתח טרנדינג מהשבוע האחרון (נוצרת ע"י cron יומי).

---

## ה-Pipeline: מ-RSS לפרסום

```
1. fetch-news (06:00)
   └─ fetchRssFeed() ← lib/rss.ts
      └─ סינון ל-AI keywords
      └─ enqueueNewsItem() → NewsItem [status=pending]

2. cluster-news (06:30)
   └─ GPT-4o-mini מקבץ עד 40 NewsItems לנושאים
   └─ createReviewCluster() → ReviewQueue [status=pending]
   └─ פריטים לא מקובצים → [status=skipped]

3. process-review (07:00)
   └─ לוקח ReviewQueue [status=pending/failed]
   └─ writeReview() ← lib/review-openai.ts
      ├─ guessCategoryFromTopic(topic) → category ראשוני
      ├─ pickAuthor(category) → zayd | lina
      ├─ findSimilarReviews() ← lib/embeddings.ts (זיכרון)
      └─ GPT-4o עם systemPrompt של הכתב
   └─ markReviewProcessed() → ReviewQueue [status=processed]
   └─ אם לא AI related → [status=rejected]

4. publish-review (09:00)
   └─ max 3 ביום
   └─ generateReviewImage() ← lib/images.ts
      ├─ Replicate flux-schnell
      └─ uploadImageFromUrl() → Cloudinary
   └─ approveReview() → Review [published=true]
      ├─ embedReview() ← lib/embeddings.ts (background)
      └─ יצירת SocialPost drafts

5. social-queue (09:30)
   └─ שולח SocialPosts [status=approved] לפלטפורמות

6. trending (00:00)
   └─ מנתח tags + חברות מ-7 ימים אחרונים
   └─ מעדכן TrendingKeyword
```

---

## Cron Jobs — לוח זמנים

| Route | Schedule (UTC) | מטרה |
|-------|---------------|------|
| `/api/cron/fetch-news` | `0 6 * * *` | שליפת RSS |
| `/api/cron/cluster-news` | `30 6 * * *` | קיבוץ לנושאים |
| `/api/cron/process-review` | `0 7 * * *` | כתיבה ב-GPT-4o |
| `/api/cron/publish-review` | `0 9 * * *` | פרסום + תמונה |
| `/api/cron/social-queue` | `30 9 * * *` | שליחה לסושיאל |
| `/api/cron/trending` | `0 0 * * *` | ניתוח מגמות |

> **חשוב:** Vercel Hobby מגביל crons ל-1/יום — לכן כל job רץ פעם אחת ביום.

כל ה-crons מאומתים עם `CRON_SECRET` (Bearer token בheader).

---

## הכתבים — זיד ולינא

שני "כתבי AI" — system prompts שונים עם טון ואופי ייחודי.
ראה תיעוד מפורט: [docs/authors-how-they-work.md](docs/authors-how-they-work.md)

### זיד
- **תחום:** `ai-models`, `research`, `tools`
- **טון:** מנתח-ספקן, טכני, מדויק
- **accent:** `#6366f1` (indigo)
- **avatar:** `/images/authors/zayd.webp`
- פותח עם שאלה טכנית שחושפת פגם בטענות
- מסיים בשאלה טכנית מפתוחה

### לינא
- **תחום:** `companies`, `policy`
- **טון:** כתבת-חקרנית, מחברת הקשרים
- **accent:** `#ec4899` (pink)
- **avatar:** `/images/authors/lina.webp`
- פותחת עם "כשאופנהיימר AI הכריזה על X, השאלה האמיתית הייתה..."
- מסיימת ב"מה יקרה בעוד שנה?"

### כיצד נבחר הכתב?

1. **ניחוש ראשוני** — `guessCategoryFromTopic(topic)` בודק מילות מפתח:
   - `openai, google, meta, funding` → `companies` → לינא
   - `law, regulation, policy, eu` → `policy` → לינא
   - `gpt, claude, gemini, benchmark` → `ai-models` → זיד
   - `research, arxiv, paper` → `research` → זיד
   - `tool, app, product, api` → `tools` → זיד
2. **AI מחליט** — GPT-4o מחזיר `suggestedCategory` ב-JSON → `pickAuthor()`
3. **שמירה** — כתב נשמר ב-tag `__author:zayd` (פנימי, לא מוצג לגולשים)

---

## יצירת תמונות

**שתי פונקציות:**

### `lib/images.ts` — `generateReviewImage(prompt)` ← משמשת cron
- Prompt suffix: `digital art, dark background, cinematic lighting, high quality, no text, no watermark`
- Fallback: אם Cloudinary נכשל → מחזיר URL של Replicate (לא null)

### `lib/replicate.ts` — `generateArticleImage(prompt)` ← ישן
- אם Cloudinary נכשל → מחזיר `null`

**Flow:**
```
featuredImagePrompt (מ-GPT-4o)
  → Replicate flux-schnell (16:9, webp, quality 80, go_fast: true)
  → extractOutputUrl() — מטפל ב-FileOutput objects
  → Cloudinary upload (folder: aiscope/reviews)
  → מחזיר Cloudinary URL קבוע
```

### `scripts/backfill-images.mjs`
לתמונות חסרות ב-reviews קיימים:
```bash
node scripts/backfill-images.mjs
```

---

## Embeddings וזיכרון הכתב

**קובץ:** [lib/embeddings.ts](lib/embeddings.ts)

- מודל: `text-embedding-3-small` (1536 dims)
- שדה ב-DB: `Review.embedding` (pgvector `vector(1536)`)

### `embedReview(reviewId)`
נקרא לאחר פרסום (background, non-blocking).

### `findSimilarReviews(queryText, authorSlug, limit=4)`
מחפש מאמרים דומים לפי cosine similarity.
מוכנס ל-prompt כ"ذاكرة الكاتب".

> אם pgvector לא זמין — ממשיכים ללא זיכרון (שגיאה שקטה).

---

## סושיאל מדיה

**תיקייה:** `lib/social/`

- `types.ts` — `SocialPlatform`, `PLATFORM_HINTS`
- `generate.ts` — `generateCaption()` עם GPT-4o-mini
- `index.ts` — `getProvider()`
- `providers/` — twitter, instagram, telegram, facebook, tiktok

**Flow:**
1. פרסום → `approveReview()` יוצר `SocialPost` drafts (status=`pending`)
2. Admin מאשר (status=`approved`)
3. `cron/social-queue` שולח לפלטפורמות

---

## ממשק האדמין

Route: `/admin` — מוגן ב-NextAuth (credentials)

| דף | תיאור |
|----|-------|
| `/admin` | Dashboard |
| `/admin/queue` | ניהול ReviewQueue |
| `/admin/reviews` | רשימת מאמרים |
| `/admin/reviews/[id]` | עריכת מאמר |
| `/admin/ai-tools` | כלי AI |
| `/admin/sources` | RSS feeds |
| `/admin/social` | חשבונות + פוסטים |
| `/admin/ads` | פרסומות |

---

## דפים פרונטאנד

**Layout:** `app/(main)/layout.tsx` — Header + Footer + Analytics

| Route | תיאור |
|-------|-------|
| `/` | Homepage: featured + 8 אחרונים + 6 כלים + Authors |
| `/reviews` | Grid + filter by category |
| `/reviews/[slug]` | מאמר מלא + FAQ + Sources + Author card |
| `/author/[slug]` | Bio + voice traits + כל המאמרים |
| `/category/[slug]` | סינון קטגוריה |
| `/ai-tools` | מדריך כלים |
| `/ai-tools/[slug]` | דף כלי |
| `/compare/[slug]` | השוואת כלים |
| `/search` | חיפוש |
| `/rss.xml` | RSS feed |
| `/sitemap.ts` | Sitemap |
| `/news-sitemap.xml` | Google News Sitemap |

---

## SEO ו-Schema.org

```ts
SITE_URL      = NEXT_PUBLIC_SITE_URL ?? "https://ai-news-ar.vercel.app"
SITE_NAME     = "AI Scope"
SITE_NAME_AR  = "نطاق الذكاء الاصطناعي"
SITE_TWITTER  = "@AIScope_ar"
```

כל דף מאמר מייצר:
- OpenGraph + Twitter Card
- `Article` schema.org ב-JSON-LD
- `canonical` + `alternates`

---

## מבנה תיקיות

```
AIScope/
├── app/
│   ├── (main)/          ← Layout ציבורי
│   ├── admin/           ← ממשק ניהול
│   └── api/
│       ├── admin/       ← REST API
│       └── cron/        ← 6 cron jobs
├── components/
│   ├── ui/              ← shadcn
│   └── *.tsx
├── lib/
│   ├── authors.ts       ← זיד + לינא
│   ├── review-openai.ts ← writeReview()
│   ├── review-queue.ts  ← state machine
│   ├── images.ts        ← generateReviewImage()
│   ├── replicate.ts     ← generateArticleImage() (ישן)
│   ├── embeddings.ts    ← pgvector
│   ├── cloudinary.ts
│   ├── social/
│   ├── auth.ts
│   ├── db.ts
│   ├── rss.ts
│   ├── seo.ts
│   └── utils.ts
├── prisma/
│   ├── schema.prisma
│   └── seed-categories.ts
├── scripts/
│   └── backfill-images.mjs
├── docs/
│   └── authors-how-they-work.md
├── vercel.json          ← cron schedule
└── next.config.ts       ← image domains
```

## מה זה?

פלטפורמת חדשות AI בערבית עם pipeline אוטומטי מלא:
- שולפת כתבות מ-RSS → מתרגמת ועורכת עם AI → מפרסמת אוטומטית → מפיצה לסושיאל מידיה

**URL:** https://ai-news-ar.vercel.app  
**GitHub:** https://github.com/aiscopeAr/ai-scope  
**Branch:** main  
**DB:** Neon PostgreSQL (serverless)  
**Deploy:** Vercel (Hobby plan)

---

## Stack טכני

| שכבה | טכנולוגיה |
|------|-----------|
| Framework | Next.js 16.2.6 (App Router) |
| Database | Neon PostgreSQL + Prisma ORM |
| AI | OpenAI GPT-4o / GPT-4o-mini |
| Images | Replicate (Flux model) |
| Auth | NextAuth.js |
| Deploy | Vercel |
| Cron Jobs | GitHub Actions (חינם, כל שעה) |
| Analytics | Google Analytics 4 |
| SEO | Google Search Console |

---

## משתני סביבה (Vercel)

```
DATABASE_URL              — Neon connection string
NEXTAUTH_URL              — https://ai-news-ar.vercel.app
NEXTAUTH_SECRET           — secret לאימות
CRON_SECRET               — 503fc74cc4b376d528a91408015c0f3e...
ADMIN_EMAIL               — אימייל מנהל
ADMIN_PASSWORD            — סיסמת מנהל
OPENAI_API_KEY            — OpenAI ($10 credit)
REPLICATE_API_TOKEN       — לייצור תמונות
NEXT_PUBLIC_SITE_URL      — https://ai-news-ar.vercel.app
NEXT_PUBLIC_GSC_VERIFICATION — Google Search Console verification token
```

---

## מבנה Prisma Schema

```
Article          — כתבות מפורסמות (titleAr, contentAr, slug, imageUrl, viewCount, tags...)
ArticleQueue     — תור עיבוד AI (pending → processing → processed → approved)
Category         — קטגוריות (AI Models, Tools, Research...)
Source           — מקורות RSS (MIT, TechCrunch, VentureBeat...)
Settings         — הגדרות מערכת (autoPublish, maxDailyArticles...)
AdSlot           — חריצי פרסום (position, type: script/iframe/image, enabled)
SocialAccount    — חשבונות סושיאל (platform, credentials JSON, enabled)
SocialPost       — מנשורים שנוצרו (articleId, caption, status, sentAt)
TrendingKeyword  — מילות מפתח טרנדינג
```

---

## Pipeline אוטומטי — איך עובד

```
כל שעה בדיוק (:00)
GitHub Action → GET /api/cron/fetch-news
  └─ שולף עד 10 כתבות מכל מקור RSS
  └─ שומר ב-ArticleQueue עם status="pending"

כל שעה ב-:20
GitHub Action → GET /api/cron/process-queue (×3)
  └─ לוקח BATCH_SIZE=2 כתבות pending
  └─ processArticleWithAI() — GPT-4o מתרגם + עורך לעיתונאי ערבי
  └─ generateArticleImage() — Replicate יוצר תמונה
  └─ markProcessed() → status="processed"
  └─ autoPublishReady() — מפרסם עד 30 כתבות ביום
     └─ יוצר Article record
     └─ generateAllCaptions() — GPT-4o-mini כותב captions לכל פלטפורמה
     └─ יוצר SocialPost records עם status="approved"

כל שעה ב-:40
GitHub Action → GET /api/cron/social-queue
  └─ שולח עד 10 SocialPost approved
  └─ getProvider(platform).send(payload, credentials)
  └─ מעדכן status="sent" או "failed"

כל יום ב-05:00 UTC
GitHub Action → /api/cron/trending
  └─ מחשב מילות מפתח טרנדינג
```

---

## GitHub Actions Workflows

| קובץ | זמן | מה עושה |
|------|-----|---------|
| `.github/workflows/fetch-news.yml` | כל שעה :00 | שולף כתבות מ-RSS |
| `.github/workflows/process-queue.yml` | כל שעה :20 | מעבד ומפרסם עם AI |
| `.github/workflows/social-queue.yml` | כל שעה :40 | שולח פוסטים לסושיאל |
| `.github/workflows/trending.yml` | יומי 05:00 | מחשב טרנדינג |

> **למה GitHub Actions ולא Vercel Crons?**  
> Vercel Hobby מגביל ל-cron job אחד ביום בלבד. GitHub Actions חינמי וללא הגבלה.

---

## API Routes

### Public
```
GET  /api/articles              — רשימת כתבות (pagination, category, search)
GET  /api/articles/[slug]       — כתבה בודדת
POST /api/views/[slug]          — ספירת צפייה
GET  /api/ads                   — פרסומות לפי position
GET  /sitemap.xml               — sitemap (revalidate: 3600)
GET  /robots.txt                — robots
GET  /rss.xml                   — RSS feed
```

### Admin
```
GET/POST   /api/admin/articles          — ניהול כתבות
PATCH/DEL  /api/admin/articles/[id]     — עריכה/מחיקה
GET/POST   /api/admin/sources           — ניהול מקורות RSS
PATCH/DEL  /api/admin/sources/[id]
GET/POST   /api/admin/ads               — ניהול חריצי פרסום
PATCH/DEL  /api/admin/ads/[id]
GET/POST   /api/admin/social/accounts   — ניהול חשבונות סושיאל
PATCH/DEL  /api/admin/social/accounts/[id]
GET        /api/admin/social/posts      — רשימת פוסטים
PATCH/DEL  /api/admin/social/posts/[id]
```

### Cron (מוגן עם CRON_SECRET)
```
GET /api/cron/fetch-news        — שליפת RSS
GET /api/cron/process-queue     — עיבוד AI + פרסום
GET /api/cron/social-queue      — שליחת פוסטים
GET /api/cron/trending          — חישוב טרנדינג
```

---

## ספריית Social Media (`lib/social/`)

### Provider System
כל פלטפורמה ממשת ממשק אחיד:
```ts
interface SocialProvider {
  platform: SocialPlatform;
  send(payload: SocialPostPayload, credentials: Record<string, string>): Promise<{ id: string }>;
}
```

| פלטפורמה | קובץ | סטטוס |
|---------|------|--------|
| Twitter/X | `providers/twitter.ts` | מוכן — OAuth 1.0a |
| Telegram | `providers/telegram.ts` | מוכן — Bot API |
| Facebook | `providers/facebook.ts` | מוכן — Graph API v19.0 |
| Instagram | `providers/instagram.ts` | מוכן — שני שלבים (container → publish) |
| TikTok | `providers/tiktok.ts` | stub — דורש וידאו |

### Caption Generation
`lib/social/generate.ts` — GPT-4o-mini כותב caption לפי סגנון כל פלטפורמה:

| פלטפורמה | מקסימום | סגנון |
|---------|---------|-------|
| Twitter | 250 תווים | קצר, hook חזק, 3 hashtags |
| Instagram | 800 תווים | emoji, סיפור, 10 hashtags |
| Telegram | 500 תווים | ישיר ועיתונאי, 3 hashtags |
| Facebook | 400 תווים | ידידותי, שאלה בסוף, 5 hashtags |
| TikTok | 150 תווים | hook מטורף, emoji רב, 5 hashtags |

---

## ממשק Admin

### דפים

| דף | URL | תיאור |
|----|-----|--------|
| Dashboard | `/admin` | סטטיסטיקות, כרטיסי ניווט, top articles |
| Articles | `/admin/articles` | טבלה עם מיון, חיפוש, עריכה |
| Queue | `/admin/queue` | אישור/דחייה/פרסום ידני |
| Sources | `/admin/sources` | ניהול מקורות RSS |
| Ads | `/admin/ads` | ניהול חריצי פרסום |
| Social | `/admin/social` | חשבונות + פוסטים (approve/skip/history) |

### Dashboard — כרטיסי ניווט
- מקלות (Articles) — ספירה כוללת
- טאבור מראה (Queue) — בהמתנה + urgent ring
- מקורות (Sources)
- פרסומות (Ads) — פעילות
- הכי נצפה (Most Viewed) — סה"כ צפיות
- מאמר חדש (New Article)
- סושיאל מידיה (Social) — חשבונות פעילים + פוסטים ממתינים + urgent ring

---

## SEO

- **Google Analytics 4:** `G-0TS7VKFC1K`
- **Google Search Console:** מאומת עם HTML meta tag
- **Sitemap:** `/sitemap.xml` — 25+ URLs, revalidate 3600
- **JSON-LD:** NewsArticle schema בכל כתבה + BreadcrumbList
- **hreflang:** `ar` → `https://ai-news-ar.vercel.app`
- **robots.txt:** מאפשר כל crawling
- **OpenGraph + Twitter cards** בכל דף

---

## Analytics — ViewTracker

כל כניסה לכתבה:
1. `ViewTracker` (Client Component) שולח `POST /api/views/[slug]`
2. `viewCount` ב-DB מתעדכן אוטומטית
3. נראה ב-Dashboard ובטבלת Articles

---

## Ad Slot System

מיקומים מוגדרים מראש:
```
homepage-top, homepage-mid
category-top
article-top, article-mid, article-bottom
```
סוגים: `script` (Google AdSense), `iframe`, `image`  
ניהול מלא מ-`/admin/ads`

---

## דפים ציבוריים

| דף | URL |
|----|-----|
| Homepage | `/` |
| Article | `/news/[slug]` |
| Category | `/category/[slug]` |
| Search | `/search` |
| About | `/about` — תוכן ערבי מלא |
| Contact | `/contact` — 3 כרטיסי יצירת קשר |
| Privacy | `/privacy` — מדיניות פרטיות 7 סעיפים |
| Terms | `/terms` — תנאי שימוש 7 סעיפים |

---

## מה עוד לא מחובר (תשתית קיימת, API חסר)

| דבר | מה חסר |
|-----|---------|
| Twitter | לפתוח חשבון → להוסיף credentials ב-`/admin/social` |
| Instagram | חשבון עסקי + Meta App + credentials |
| Telegram | ליצור Bot → @BotFather → token + chat_id |
| Facebook | Facebook Page + Long-lived Token |
| TikTok | דורש וידאו — stub בלבד |

**כשפותחים חשבון:** נכנסים ל-`/admin/social` → מוסיפים חשבון עם ה-credentials → מפעילים toggle → הכל עובד אוטומטית.

---

## בעיות ידועות / הערות

1. **Google Search Console** — Sitemap הוגש, Google צריך עוד 24-72 שעה לסרוק
2. **Google Indexing** — האתר חדש, אין צפיות אורגניות עדיין
3. **TikTok** — Provider קיים כ-stub, דורש video content כדי להפעיל
4. **middleware deprecation** — Next.js 16 מדווח על Next.js middleware API ישן, לא חוסם כלום

---

## איך לעדכן את האתר

```bash
# לאחר שינויים מקומיים:
git add <files>
git commit -m "..."
git push origin main
# Vercel מ-deploy אוטומטית
```

> ⚠️ **חשוב:** לא לעשות push אלא אם ה-user ביקש במפורש.
