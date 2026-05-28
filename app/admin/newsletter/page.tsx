"use client";

import { useEffect, useState } from "react";
import { Mail, Download, UserCheck, UserX, RefreshCw } from "lucide-react";

interface Subscriber {
  id: string;
  email: string;
  status: string;
  source: string;
  createdAt: string;
}

interface Stats {
  total: number;
  active: number;
  unsubscribed: number;
  fromWebsite: number;
  fromPopup: number;
}

export default function NewsletterAdminPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "unsubscribed">("active");
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/newsletter");
    const data = await res.json();
    setSubscribers(data.subscribers ?? []);
    setStats(data.stats ?? null);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleStatus(id: string, current: string) {
    const next = current === "active" ? "unsubscribed" : "active";
    await fetch(`/api/admin/newsletter/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    load();
  }

  async function deleteSubscriber(id: string) {
    if (!confirm("حذف هذا المشترك؟")) return;
    await fetch(`/api/admin/newsletter/${id}`, { method: "DELETE" });
    load();
  }

  function exportCSV() {
    const rows = filtered.map((s) =>
      `${s.email},${s.status},${s.source},${new Date(s.createdAt).toLocaleDateString("ar-EG")}`
    );
    const csv = ["البريد الإلكتروني,الحالة,المصدر,تاريخ الاشتراك", ...rows].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lumiq-newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = subscribers.filter((s) => {
    if (filter !== "all" && s.status !== filter) return false;
    if (search && !s.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const SOURCE_LABEL: Record<string, string> = {
    website: "الموقع",
    popup: "النافذة",
    admin: "الإدارة",
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
            <Mail className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">النشرة البريدية</h1>
            <p className="text-xs text-slate-500">إدارة المشتركين</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
            <RefreshCw className="h-3.5 w-3.5" />
            تحديث
          </button>
          <button onClick={exportCSV} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700">
            <Download className="h-3.5 w-3.5" />
            تصدير CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "إجمالي المشتركين", value: stats.total, color: "text-indigo-600", bg: "bg-indigo-50" },
            { label: "نشط", value: stats.active, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "عبر الموقع", value: stats.fromWebsite, color: "text-sky-600", bg: "bg-sky-50" },
            { label: "عبر النافذة", value: stats.fromPopup, color: "text-violet-600", bg: "bg-violet-50" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className={`mt-1 text-3xl font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-slate-200 bg-white overflow-hidden">
          {(["all", "active", "unsubscribed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium transition ${filter === f ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}
            >
              {f === "all" ? "الكل" : f === "active" ? "نشط" : "غير مشترك"}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="بحث بالبريد الإلكتروني..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-indigo-400"
        />
        <span className="text-xs text-slate-400">{filtered.length} نتيجة</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 text-sm">جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Mail className="h-8 w-8 text-slate-200" />
            <p className="text-sm text-slate-400">لا يوجد مشتركون</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                <th className="px-4 py-3 text-right font-semibold">البريد الإلكتروني</th>
                <th className="px-4 py-3 text-right font-semibold">الحالة</th>
                <th className="px-4 py-3 text-right font-semibold">المصدر</th>
                <th className="px-4 py-3 text-right font-semibold">تاريخ الاشتراك</th>
                <th className="px-4 py-3 text-right font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">{s.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      s.status === "active"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}>
                      {s.status === "active" ? "نشط" : "غير مشترك"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{SOURCE_LABEL[s.source] ?? s.source}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                    {new Date(s.createdAt).toLocaleDateString("ar-EG")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleStatus(s.id, s.status)}
                        title={s.status === "active" ? "إلغاء الاشتراك" : "إعادة تفعيل"}
                        className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      >
                        {s.status === "active"
                          ? <UserX className="h-3.5 w-3.5" />
                          : <UserCheck className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => deleteSubscriber(s.id)}
                        title="حذف"
                        className="rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
