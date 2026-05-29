import { SITE_URL, SITE_NAME } from "@/lib/seo";

export interface NewsletterData {
  weekLabel: string; // e.g. "26–29 مايو 2026"
  articles: Array<{
    titleAr: string;
    summary: string;
    slug: string;
    imageUrl?: string | null;
    category: string;
  }>;
  tools: Array<{
    name: string;
    slug: string;
    tagline?: string | null;
    logoUrl?: string | null;
    category?: string | null;
  }>;
}

export function buildNewsletterHtml(data: NewsletterData): string {
  const accentColor = "#6366f1";
  const bgColor = "#f8fafc";
  const cardBg = "#ffffff";
  const textPrimary = "#0f172a";
  const textMuted = "#64748b";
  const borderColor = "#e2e8f0";

  const articlesHtml = data.articles
    .map(
      (a) => `
    <tr>
      <td style="padding:0 0 20px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:${cardBg};border-radius:12px;border:1px solid ${borderColor};overflow:hidden;">
          <tr>
            ${
              a.imageUrl
                ? `<td width="120" style="padding:0;vertical-align:top;">
                <img src="${a.imageUrl}" width="120" height="90" alt="${a.titleAr}"
                  style="display:block;object-fit:cover;width:120px;height:90px;border-radius:12px 0 0 12px;" />
              </td>`
                : ""
            }
            <td style="padding:14px 16px;vertical-align:top;">
              <p style="margin:0 0 4px 0;font-size:11px;color:${accentColor};font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">${a.category}</p>
              <p style="margin:0 0 6px 0;font-size:15px;font-weight:700;color:${textPrimary};line-height:1.4;">${a.titleAr}</p>
              <p style="margin:0 0 10px 0;font-size:13px;color:${textMuted};line-height:1.5;">${a.summary.slice(0, 120)}…</p>
              <a href="${SITE_URL}/reviews/${a.slug}?utm_source=newsletter&utm_medium=email&utm_campaign=weekly"
                style="display:inline-block;background:${accentColor};color:#fff;font-size:12px;font-weight:600;padding:6px 14px;border-radius:6px;text-decoration:none;">
                اقرأ التقرير ←
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
    )
    .join("");

  const toolsHtml = data.tools
    .map(
      (t) => `
    <td style="width:${Math.floor(100 / data.tools.length)}%;padding:0 6px;vertical-align:top;text-align:center;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:${cardBg};border-radius:10px;border:1px solid ${borderColor};">
        <tr><td style="padding:14px 10px;text-align:center;">
          ${
            t.logoUrl
              ? `<img src="${t.logoUrl}" width="40" height="40" alt="${t.name}"
                  style="border-radius:8px;margin:0 auto 8px;display:block;" />`
              : `<div style="width:40px;height:40px;border-radius:8px;background:${accentColor}20;margin:0 auto 8px;display:flex;align-items:center;justify-content:center;">
                  <span style="font-size:18px;">🤖</span>
                </div>`
          }
          <p style="margin:0 0 4px 0;font-size:13px;font-weight:700;color:${textPrimary};">${t.name}</p>
          ${t.tagline ? `<p style="margin:0 0 8px 0;font-size:11px;color:${textMuted};">${t.tagline.slice(0, 40)}</p>` : ""}
          <a href="${SITE_URL}/ai-tools/${t.slug}?utm_source=newsletter&utm_medium=email&utm_campaign=weekly"
            style="font-size:11px;color:${accentColor};font-weight:600;text-decoration:none;">
            عرض الأداة ↗
          </a>
        </td></tr>
      </table>
    </td>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>نشرة ${SITE_NAME} الأسبوعية</title>
</head>
<body style="margin:0;padding:0;background:${bgColor};font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${bgColor};">
    <tr><td align="center" style="padding:24px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0f172a,#1e1b4b);border-radius:16px;padding:32px 32px 24px;text-align:center;margin-bottom:20px;">
          <p style="margin:0 0 4px 0;font-size:28px;font-weight:900;color:#fff;letter-spacing:-0.5px;">${SITE_NAME}</p>
          <p style="margin:0 0 12px 0;font-size:14px;color:#a5b4fc;">لوميك — أخبار الذكاء الاصطناعي بالعربية</p>
          <div style="display:inline-block;background:rgba(99,102,241,0.25);border:1px solid rgba(99,102,241,0.4);border-radius:20px;padding:5px 16px;">
            <p style="margin:0;font-size:12px;color:#c7d2fe;font-weight:600;">📅 نشرة الأسبوع · ${data.weekLabel}</p>
          </div>
        </td></tr>

        <tr><td style="height:20px;"></td></tr>

        <!-- Intro -->
        <tr><td style="background:${cardBg};border-radius:12px;border:1px solid ${borderColor};padding:20px 24px;margin-bottom:16px;">
          <p style="margin:0;font-size:14px;color:${textMuted};line-height:1.7;">
            مرحباً 👋 — إليك أبرز ما شهده عالم الذكاء الاصطناعي هذا الأسبوع،
            من أهم التقارير والتحليلات، إضافةً إلى أحدث الأدوات التي تستحق الاهتمام.
          </p>
        </td></tr>

        <tr><td style="height:16px;"></td></tr>

        <!-- Articles section -->
        <tr><td>
          <p style="margin:0 0 12px 0;font-size:13px;font-weight:700;color:${textMuted};text-transform:uppercase;letter-spacing:1px;">📰 أبرز التقارير هذا الأسبوع</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${articlesHtml}
          </table>
        </td></tr>

        <!-- Tools section -->
        ${
          data.tools.length > 0
            ? `<tr><td style="padding-top:8px;">
          <p style="margin:0 0 12px 0;font-size:13px;font-weight:700;color:${textMuted};text-transform:uppercase;letter-spacing:1px;">🛠️ أدوات AI تستحق التجربة</p>
          <table width="100%" cellpadding="0" cellspacing="0"><tr>${toolsHtml}</tr></table>
        </td></tr>`
            : ""
        }

        <tr><td style="height:20px;"></td></tr>

        <!-- CTA -->
        <tr><td style="background:linear-gradient(135deg,${accentColor}15,${accentColor}08);border:1px solid ${accentColor}30;border-radius:12px;padding:20px 24px;text-align:center;">
          <p style="margin:0 0 8px 0;font-size:15px;font-weight:700;color:${textPrimary};">تابع لوميك على تيليغرام</p>
          <p style="margin:0 0 14px 0;font-size:13px;color:${textMuted};">أخبار الذكاء الاصطناعي أولاً بأول — مجاناً</p>
          <a href="https://t.me/lumiq_news" style="display:inline-block;background:#0088cc;color:#fff;font-size:13px;font-weight:700;padding:10px 24px;border-radius:8px;text-decoration:none;">
            انضم إلى القناة ✈️
          </a>
        </td></tr>

        <tr><td style="height:20px;"></td></tr>

        <!-- Footer -->
        <tr><td style="text-align:center;padding:16px;">
          <p style="margin:0 0 4px 0;font-size:11px;color:#94a3b8;">
            <a href="${SITE_URL}" style="color:${accentColor};text-decoration:none;">${SITE_URL}</a>
            · جميع الحقوق محفوظة © ${new Date().getFullYear()} ${SITE_NAME}
          </p>
          <p style="margin:0;font-size:11px;color:#94a3b8;">
            لإلغاء الاشتراك: <a href="${SITE_URL}/unsubscribe" style="color:#94a3b8;">اضغط هنا</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
