"use client";

import { BarChart2, ArrowUpRight, TrendingUp, Users, Eye, MousePointerClick } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-black text-slate-900">الإحصاءات</h1>
        <p className="mt-0.5 text-sm text-slate-500">بياناتك من مصدرين موثوقين</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">

        {/* Vercel Analytics */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black">
              <svg width="20" height="20" viewBox="0 0 76 76" fill="none">
                <path d="M38 8L68 63H8L38 8Z" fill="white"/>
              </svg>
            </div>
            <div>
              <p className="font-bold text-slate-900">Vercel Analytics</p>
              <p className="text-xs text-slate-500">page views · visitors · events</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { icon: Eye,              label: "مشاهدات الصفحات" },
              { icon: Users,            label: "الزوار الفريدون" },
              { icon: MousePointerClick, label: "الأحداث المخصصة" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-xl bg-slate-50 p-3 text-center">
                <Icon className="h-5 w-5 mx-auto mb-1 text-slate-400" />
                <p className="text-[11px] text-slate-500 leading-tight">{label}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2 mb-5 text-sm text-slate-600">
            <p>✅ <strong>Custom Events</strong> — prompt_copy, scroll_depth, time_on_page, tool_click</p>
            <p>✅ <strong>Countries</strong> — من أي دولة يأتي الزوار</p>
            <p>✅ <strong>Top Pages</strong> — أكثر الصفحات زيارة</p>
            <p>✅ <strong>Devices</strong> — موبايل أو ديسكتوب</p>
          </div>

          <a
            href="https://vercel.com/ai-scope-s-projects/ai-scope/analytics"
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            فتح Vercel Analytics
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        {/* Google Analytics */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E37400]">
              <BarChart2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Google Analytics 4</p>
              <p className="text-xs text-slate-500">G-0TS7VKFC1K · يجمع بيانات تلقائياً</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { icon: TrendingUp, label: "مصادر الزيارات" },
              { icon: Users,     label: "الجمهور والبلدان" },
              { icon: Eye,       label: "معدل الارتداد" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-xl bg-slate-50 p-3 text-center">
                <Icon className="h-5 w-5 mx-auto mb-1 text-slate-400" />
                <p className="text-[11px] text-slate-500 leading-tight">{label}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2 mb-5 text-sm text-slate-600">
            <p>✅ <strong>Organic Search</strong> — من أين يأتون من Google</p>
            <p>✅ <strong>Acquisition</strong> — مصادر الزيارات بالتفصيل</p>
            <p>✅ <strong>Retention</strong> — كم مرة يعود الزوار</p>
            <p>✅ <strong>Real-time</strong> — الزوار الآن على الموقع</p>
          </div>

          <a
            href="https://analytics.google.com/analytics/web/#/p538064799/reports/intelligenthome"
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E37400] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            فتح Google Analytics
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Tips */}
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
        <p className="font-semibold text-indigo-900 mb-3">💡 ماذا تراقب أسبوعياً؟</p>
        <div className="grid gap-2 sm:grid-cols-2 text-sm text-indigo-800">
          <p>• <strong>Vercel Events</strong> — أي برومبتس يُنسخ أكثر</p>
          <p>• <strong>Scroll Depth</strong> — هل يُكمل القراء المقالات</p>
          <p>• <strong>GA4 Acquisition</strong> — هل تنمو الزيارات العضوية</p>
          <p>• <strong>Top Pages</strong> — أي صفحات تجلب أكثر زيارات</p>
        </div>
      </div>
    </div>
  );
}
