# AI Scope — نطاق الذكاء الاصطناعي

פלטפורמת חדשות AI בערבית עם pipeline אוטומטי מלא.

**Live:** https://ai-news-ar.vercel.app

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Neon PostgreSQL** + Prisma ORM
- **OpenAI GPT-4o** — תרגום ועריכה עיתונאית
- **Replicate (Flux)** — ייצור תמונות
- **Vercel** — deploy
- **GitHub Actions** — cron jobs (כל שעה)

## Setup

```bash
npm install
cp .env.example .env
# מלא את משתני הסביבה
npx prisma db push
npm run dev
```

## משתני סביבה

ראה `.env.example` לרשימה מלאה.

## Pipeline אוטומטי

```
:00 — fetch-news    → שולף כתבות מ-RSS
:20 — process-queue → מתרגם עם AI + מפרסם
:40 — social-queue  → שולח לסושיאל מידיה
05:00 — trending    → מחשב מילות מפתח
```

## Admin

`/admin` — לוח בקרה מלא (כתבות, תור, מקורות, פרסומות, סושיאל)
