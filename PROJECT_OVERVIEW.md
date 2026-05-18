# AI Scope — نطاق الذكاء الاصطناعي
## סיכום מלא של הפרויקט

---

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
