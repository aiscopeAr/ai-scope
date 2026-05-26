"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";

type Platform = "twitter" | "instagram" | "telegram" | "facebook" | "tiktok";
type PostStatus = "pending" | "approved" | "sent" | "failed" | "skipped";

interface SocialAccount {
  id: string;
  platform: Platform;
  name: string;
  enabled: boolean;
  createdAt: string;
}

interface SocialPost {
  id: string;
  platform: Platform;
  caption: string;
  status: PostStatus;
  sentAt: string | null;
  errorMsg: string | null;
  createdAt: string;
  article: { titleAr: string; slug: string } | null;
}

const PLATFORM_LABELS: Record<Platform, string> = {
  twitter: "Twitter / X",
  instagram: "Instagram",
  telegram: "Telegram",
  facebook: "Facebook",
  tiktok: "TikTok",
};

const PLATFORM_COLORS: Record<Platform, string> = {
  twitter: "bg-sky-100 text-sky-700",
  instagram: "bg-pink-100 text-pink-700",
  telegram: "bg-blue-100 text-blue-700",
  facebook: "bg-indigo-100 text-indigo-700",
  tiktok: "bg-gray-100 text-gray-700",
};

const STATUS_COLORS: Record<PostStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  sent: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  skipped: "bg-gray-100 text-gray-500",
};

const CREDENTIAL_FIELDS: Record<Platform, { key: string; label: string; placeholder: string }[]> = {
  twitter: [
    { key: "apiKey", label: "API Key", placeholder: "Consumer Key" },
    { key: "apiSecret", label: "API Secret", placeholder: "Consumer Secret" },
    { key: "accessToken", label: "Access Token", placeholder: "OAuth Access Token" },
    { key: "accessTokenSecret", label: "Access Token Secret", placeholder: "OAuth Access Token Secret" },
  ],
  instagram: [
    { key: "igUserId", label: "IG User ID", placeholder: "Instagram Business User ID" },
    { key: "accessToken", label: "Access Token", placeholder: "Long-lived Page Access Token" },
  ],
  telegram: [
    { key: "botToken", label: "Bot Token", placeholder: "123456:ABC-DEF..." },
    { key: "chatId", label: "Chat / Channel ID", placeholder: "@mychannel or -100..." },
  ],
  facebook: [
    { key: "pageId", label: "Page ID", placeholder: "Facebook Page ID" },
    { key: "accessToken", label: "Page Access Token", placeholder: "Long-lived Page Access Token" },
  ],
  tiktok: [
    { key: "accessToken", label: "Access Token", placeholder: "TikTok OAuth Access Token" },
  ],
};

export default function SocialPage() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newPlatform, setNewPlatform] = useState<Platform>("twitter");
  const [newName, setNewName] = useState("");
  const [newCredentials, setNewCredentials] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [postFilter, setPostFilter] = useState<PostStatus | "all">("all");

  async function loadAccounts() {
    setLoadingAccounts(true);
    try {
      const res = await fetch("/api/admin/social/accounts");
      if (!res.ok) throw new Error("Failed");
      setAccounts(await res.json());
    } catch {
      toast("خطأ في تحميل الحسابات", "error");
    } finally {
      setLoadingAccounts(false);
    }
  }

  async function loadPosts() {
    setLoadingPosts(true);
    try {
      const res = await fetch("/api/admin/social/posts");
      if (!res.ok) throw new Error("Failed");
      setPosts(await res.json());
    } catch {
      toast("خطأ في تحميل المنشورات", "error");
    } finally {
      setLoadingPosts(false);
    }
  }

  useEffect(() => {
    void loadAccounts();
    void loadPosts();
  }, []);

  async function toggleAccount(id: string, enabled: boolean) {
    await fetch(`/api/admin/social/accounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    await loadAccounts();
  }

  async function deleteAccount(id: string) {
    if (!confirm("حذف الحساب؟")) return;
    await fetch(`/api/admin/social/accounts/${id}`, { method: "DELETE" });
    toast("تم حذف الحساب");
    await loadAccounts();
  }

  async function saveAccount() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/social/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: newPlatform, name: newName, credentials: newCredentials }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast("تم إضافة الحساب");
      setShowAddAccount(false);
      setNewName("");
      setNewCredentials({});
      await loadAccounts();
    } catch (err) {
      toast(err instanceof Error ? err.message : "خطأ في الحفظ", "error");
    } finally {
      setSaving(false);
    }
  }

  async function approvePost(id: string) {
    await fetch(`/api/admin/social/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved" }),
    });
    await loadPosts();
  }

  async function skipPost(id: string) {
    await fetch(`/api/admin/social/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "skipped" }),
    });
    await loadPosts();
  }

  const filteredPosts = postFilter === "all" ? posts : posts.filter((p) => p.status === postFilter);
  const pendingCount = posts.filter((p) => p.status === "pending").length;
  const sentCount = posts.filter((p) => p.status === "sent").length;

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">إدارة الحسابات والمنشورات التلقائية</p>
        <button
          onClick={() => setShowAddAccount(true)}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
        >
          + إضافة حساب
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="text-2xl font-bold text-slate-800">{accounts.filter((a) => a.enabled).length}</div>
          <div className="text-slate-500 text-sm">حسابات نشطة</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          <div className="text-slate-500 text-sm">بانتظار الموافقة</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="text-2xl font-bold text-emerald-600">{sentCount}</div>
          <div className="text-slate-500 text-sm">منشورات أُرسلت</div>
        </div>
      </div>

      {/* Accounts */}
      <div>
        <h2 className="text-lg font-semibold text-slate-700 mb-3">الحسابات</h2>
        {loadingAccounts ? (
          <div className="text-slate-400 text-sm">جاري التحميل...</div>
        ) : accounts.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center text-slate-400 border border-dashed border-slate-200">
            لا توجد حسابات — أضف حساباً للبدء
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {accounts.map((account) => (
              <div key={account.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${PLATFORM_COLORS[account.platform]}`}>
                    {PLATFORM_LABELS[account.platform]}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={account.enabled}
                      onChange={(e) => toggleAccount(account.id, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-checked:bg-indigo-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                  </label>
                </div>
                <div className="font-medium text-slate-800">{account.name}</div>
                <button
                  onClick={() => deleteAccount(account.id)}
                  className="text-xs text-red-500 hover:text-red-700 text-start"
                >
                  حذف الحساب
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Posts */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-lg font-semibold text-slate-700">المنشورات</h2>
          <div className="flex gap-1">
            {(["all", "pending", "approved", "sent", "failed"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setPostFilter(s)}
                className={`text-xs px-2 py-1 rounded-full transition-colors ${
                  postFilter === s ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {s === "all" ? "الكل" : s === "pending" ? "انتظار" : s === "approved" ? "موافق" : s === "sent" ? "أُرسل" : "فشل"}
              </button>
            ))}
          </div>
        </div>

        {loadingPosts ? (
          <div className="text-slate-400 text-sm">جاري التحميل...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center text-slate-400 border border-dashed border-slate-200">
            لا توجد منشورات
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PLATFORM_COLORS[post.platform]}`}>
                        {PLATFORM_LABELS[post.platform]}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[post.status]}`}>
                        {post.status}
                      </span>
                      {post.article && (
                        <span className="text-xs text-slate-400 truncate">{post.article.titleAr}</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 line-clamp-3 whitespace-pre-line">{post.caption}</p>
                    {post.errorMsg && (
                      <p className="text-xs text-red-500 mt-1">{post.errorMsg}</p>
                    )}
                  </div>
                  {post.status === "pending" && (
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => approvePost(post.id)}
                        className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-lg hover:bg-emerald-200"
                      >
                        موافقة
                      </button>
                      <button
                        onClick={() => skipPost(post.id)}
                        className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-lg hover:bg-slate-200"
                      >
                        تخطي
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      {showAddAccount && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4" dir="rtl">
            <h3 className="text-lg font-bold text-slate-800">إضافة حساب جديد</h3>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">المنصة</label>
              <select
                value={newPlatform}
                onChange={(e) => { setNewPlatform(e.target.value as Platform); setNewCredentials({}); }}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              >
                {(Object.keys(PLATFORM_LABELS) as Platform[]).map((p) => (
                  <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">اسم الحساب</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="مثلاً: @aiscope_ar"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            {CREDENTIAL_FIELDS[newPlatform].map((field) => (
              <div key={field.key}>
                <label className="text-sm font-medium text-slate-700 block mb-1">{field.label}</label>
                <input
                  type="password"
                  value={newCredentials[field.key] ?? ""}
                  onChange={(e) => setNewCredentials((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono"
                />
              </div>
            ))}

            <div className="flex gap-2 pt-2">
              <button
                onClick={saveAccount}
                disabled={saving || !newName}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
              >
                {saving ? "جاري الحفظ..." : "حفظ"}
              </button>
              <button
                onClick={() => setShowAddAccount(false)}
                className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
