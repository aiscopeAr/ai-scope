"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  Search, Loader2, CheckCircle, XCircle, RefreshCw,
  ExternalLink, ChevronDown, ChevronUp, ImageIcon, Wand2, Link2,
  CheckSquare, Square, AlertTriangle,
} from "lucide-react";
import Image from "next/image";

import { useToast } from "@/components/ui/toast";
import {
  QUEUE_STATUS_LABELS,
  QUEUE_STATUS_COLORS,
  type QueueItemWithSource,
  type QueueStatus,
} from "@/types/pipeline";

type Category = { id: string; nameAr: string; name: string; slug: string };
type StatusCounts = Partial<Record<QueueStatus, number>>;

const STATUS_TABS: Array<{ value: string; label: string }> = [
  { value: "", label: "الكل" },
  { value: "processed", label: "جاهز للمراجعة" },
  { value: "pending", label: "قيد الانتظار" },
  { value: "failed", label: "فشل" },
  { value: "approved", label: "معتمد" },
  { value: "rejected", label: "مرفوض" },
];

function ImagePanel({
  itemId, imageUrl, imagePrompt, onImageChange,
}: {
  itemId: string; imageUrl: string | null; imagePrompt: string | null;
  onImageChange: (url: string) => void;
}) {
  const { toast } = useToast();
  const [mode, setMode] = React.useState<"view" | "url" | "generate">("view");
  const [urlInput, setUrlInput] = React.useState(imageUrl ?? "");
  const [generating, setGenerating] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  async function saveImageUrl(url: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/queue/${itemId}/image`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url }),
      });
      if (!res.ok) throw new Error();
      onImageChange(url); setMode("view"); toast("تم تحديث الصورة");
    } catch { toast("فشل تحديث الصورة", "error"); }
    finally { setSaving(false); }
  }

  async function generateImage() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/admin/queue/${itemId}/image`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generate: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.imageUrl) throw new Error();
      onImageChange(data.imageUrl); setUrlInput(data.imageUrl); setMode("view");
      toast("تم توليد الصورة بنجاح");
    } catch { toast("فشل توليد الصورة", "error"); }
    finally { setGenerating(false); }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500">الصورة</p>
        <div className="flex gap-1.5">
          <button onClick={() => setMode(mode === "url" ? "view" : "url")}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${mode === "url" ? "bg-[#667eea] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            <Link2 className="size-3" /> رابط
          </button>
          <button onClick={() => setMode(mode === "generate" ? "view" : "generate")}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${mode === "generate" ? "bg-[#667eea] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            <Wand2 className="size-3" /> توليد
          </button>
        </div>
      </div>
      {imageUrl ? (
        <div className="relative h-48 w-full overflow-hidden rounded-xl bg-slate-100">
          <Image src={imageUrl} alt="صورة المقال" fill className="object-cover" unoptimized />
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
          <div className="text-center"><ImageIcon className="mx-auto mb-1 size-8 opacity-40" /><p className="text-xs">لا توجد صورة</p></div>
        </div>
      )}
      {mode === "url" && (
        <div className="flex gap-2">
          <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/image.jpg" dir="ltr"
            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-[#667eea] focus:outline-none" />
          <button onClick={() => saveImageUrl(urlInput)} disabled={saving || !urlInput}
            className="flex items-center gap-1 rounded-xl bg-[#667eea] px-3 py-2 text-xs font-semibold text-white hover:bg-[#764ba2] disabled:opacity-50">
            {saving ? <Loader2 className="size-3 animate-spin" /> : "حفظ"}
          </button>
        </div>
      )}
      {mode === "generate" && (
        <div className="rounded-xl bg-slate-50 p-3 space-y-2">
          {imagePrompt && <p className="text-xs text-slate-500 italic" dir="ltr">{imagePrompt}</p>}
          <button onClick={generateImage} disabled={generating}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#667eea] to-[#764ba2] py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">
            {generating ? <><Loader2 className="size-4 animate-spin" /> جارٍ التوليد...</> : <><Wand2 className="size-4" /> توليد صورة بالذكاء الاصطناعي</>}
          </button>
        </div>
      )}
    </div>
  );
}

function ItemRow({
  item, categories, selected, onToggleSelect, onAction,
}: {
  item: QueueItemWithSource; categories: Category[];
  selected: boolean; onToggleSelect: (id: string) => void; onAction: () => void;
}) {
  const { toast } = useToast();
  const [expanded, setExpanded] = React.useState(false);
  const [acting, setActing] = React.useState(false);
  const [currentImageUrl, setCurrentImageUrl] = React.useState<string | null>(
    (item as QueueItemWithSource & { imageUrl?: string | null }).imageUrl ?? null
  );
  const [approveForm, setApproveForm] = React.useState({
    categoryId: categories[0]?.id ?? "",
    slug: item.slug ?? "",
    title: item.titleAr ?? item.rawTitle ?? "",
    published: true,
  });

  const statusKey = item.status as QueueStatus;
  const statusBadge = QUEUE_STATUS_COLORS[statusKey] ?? "bg-slate-100 text-slate-600";
  const statusLabel = QUEUE_STATUS_LABELS[statusKey] ?? item.status;

  async function doAction(body: Record<string, unknown>) {
    setActing(true);
    try {
      const res = await fetch(`/api/admin/queue/${item.id}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { toast(data.error ?? "فشل الإجراء", "error"); return; }
      toast(body.action === "approve" ? "تم اعتماد المقال ونشره" : body.action === "reject" ? "تم رفض المقال" : "تمت إعادة المحاولة");
      onAction();
    } catch { toast("فشل الاتصال", "error"); }
    finally { setActing(false); }
  }

  return (
    <div className={`rounded-[1.75rem] bg-white shadow-md shadow-slate-200/50 overflow-hidden transition ${selected ? "ring-2 ring-[#667eea]" : ""}`}>
      <div className="flex items-start gap-3 p-5">
        {/* Checkbox */}
        <button
          onClick={() => onToggleSelect(item.id)}
          className="mt-0.5 shrink-0 text-slate-300 hover:text-[#667eea] transition"
          aria-label={selected ? "إلغاء التحديد" : "تحديد"}
        >
          {selected ? <CheckSquare className="size-5 text-[#667eea]" /> : <Square className="size-5" />}
        </button>

        {/* Thumbnail */}
        {currentImageUrl ? (
          <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
            <Image src={currentImageUrl} alt="" fill className="object-cover" unoptimized />
          </div>
        ) : (
          <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-xl bg-slate-100">
            <ImageIcon className="size-6 text-slate-300" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusBadge}`}>{statusLabel}</span>
            {item.source && <span className="text-xs text-slate-400">{item.source.name}</span>}
            {item.suggestedCategory && (
              <span className="rounded-full bg-[#667eea]/10 px-2 py-0.5 text-xs text-[#667eea]">{item.suggestedCategory}</span>
            )}
          </div>
          <p className="font-bold text-slate-900 line-clamp-1">{item.titleAr || item.rawTitle || "بدون عنوان"}</p>
          {item.rawTitle && item.titleAr && item.rawTitle !== item.titleAr && (
            <p className="text-xs text-slate-400 line-clamp-1 mt-0.5" dir="ltr">{item.rawTitle}</p>
          )}
          <p className="text-xs text-slate-400 mt-1">
            {format(new Date(item.createdAt), "yyyy-MM-dd HH:mm")}
          </p>
          {/* Failure reason — prominent */}
          {item.failureReason && (
            <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              <span dir="ltr" className="break-all font-mono">{item.failureReason}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer"
            className="rounded-xl bg-slate-100 p-2 text-slate-500 hover:text-[#667eea] transition" title="المصدر الأصلي">
            <ExternalLink className="size-4" />
          </a>
          <button onClick={() => setExpanded((e) => !e)}
            className="rounded-xl bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 transition">
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              {item.summaryAr && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">الملخص</p>
                  <p className="text-sm text-slate-700 leading-7">{item.summaryAr}</p>
                </div>
              )}
              {item.contentAr && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">المحتوى المترجم</p>
                  <div className="max-h-48 overflow-y-auto rounded-xl bg-slate-50 p-3 text-sm text-slate-700 leading-7 whitespace-pre-wrap">{item.contentAr}</div>
                </div>
              )}
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">#{tag}</span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <ImagePanel
                itemId={item.id} imageUrl={currentImageUrl}
                imagePrompt={(item as QueueItemWithSource & { featuredImagePrompt?: string | null }).featuredImagePrompt ?? null}
                onImageChange={setCurrentImageUrl}
              />
            </div>
          </div>

          {item.status === "processed" && (
            <div className="rounded-2xl bg-slate-50 p-4 space-y-3">
              <p className="text-sm font-semibold text-slate-700">اعتماد ونشر المقال</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">التصنيف *</label>
                  <select value={approveForm.categoryId}
                    onChange={(e) => setApproveForm((f) => ({ ...f, categoryId: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#667eea] focus:outline-none">
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Slug *</label>
                  <input value={approveForm.slug}
                    onChange={(e) => setApproveForm((f) => ({ ...f, slug: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#667eea] focus:outline-none" dir="ltr" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">العنوان العربي</label>
                <input value={approveForm.title}
                  onChange={(e) => setApproveForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#667eea] focus:outline-none" dir="rtl" />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={approveForm.published}
                    onChange={(e) => setApproveForm((f) => ({ ...f, published: e.target.checked }))} className="rounded" />
                  نشر فوراً
                </label>
                <div className="flex gap-2">
                  <button onClick={() => doAction({ action: "reject" })} disabled={acting}
                    className="flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50">
                    <XCircle className="size-4" /> رفض
                  </button>
                  <button onClick={() => doAction({ action: "approve", ...approveForm })}
                    disabled={acting || !approveForm.categoryId || !approveForm.slug}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50">
                    {acting ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
                    اعتماد ونشر
                  </button>
                </div>
              </div>
            </div>
          )}

          {item.status === "failed" && (
            <div className="space-y-2">
              {item.failureReason && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="mb-1 text-xs font-bold text-red-600">سبب الفشل</p>
                  <pre className="whitespace-pre-wrap break-all text-xs text-red-700 font-mono" dir="ltr">{item.failureReason}</pre>
                </div>
              )}
              <div className="flex justify-end">
                <button onClick={() => doAction({ action: "retry" })} disabled={acting}
                  className="flex items-center gap-1.5 rounded-xl bg-[#667eea]/10 px-3 py-2 text-sm font-semibold text-[#667eea] hover:bg-[#667eea]/20 disabled:opacity-50">
                  {acting ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                  إعادة المحاولة
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminQueuePage() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<QueueItemWithSource[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [total, setTotal] = React.useState(0);
  const [statusCounts, setStatusCounts] = React.useState<StatusCounts>({});
  const [loading, setLoading] = React.useState(true);
  const [status, setStatus] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [bulkActing, setBulkActing] = React.useState(false);
  const limit = 20;

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status, search, page: String(page), limit: String(limit) });
      const [queueRes, catRes] = await Promise.all([
        fetch(`/api/admin/queue?${params}`),
        fetch("/api/admin/categories"),
      ]);
      if (queueRes.ok) {
        const data = await queueRes.json();
        setItems(data.items);
        setTotal(data.total);
        setStatusCounts(data.statusCounts ?? {});
      }
      if (catRes.ok) setCategories(await catRes.json());
    } catch {
      toast("فشل تحميل البيانات", "error");
    } finally {
      setLoading(false);
    }
  }, [status, search, page, toast]);

  React.useEffect(() => {
    const t = setTimeout(fetchData, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [fetchData, search]);

  // Clear selection when filter changes
  React.useEffect(() => { setSelected(new Set()); }, [status, page]);

  const totalPages = Math.ceil(total / limit);
  const allSelected = items.length > 0 && items.every((i) => selected.has(i.id));

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((i) => i.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function bulkAction(action: "reject" | "retry") {
    if (selected.size === 0) return;
    setBulkActing(true);
    try {
      const res = await fetch("/api/admin/queue/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids: [...selected] }),
      });
      const data = await res.json();
      if (!res.ok) { toast(data.error ?? "فشل الإجراء الجماعي", "error"); return; }
      toast(`تم تطبيق "${action === "reject" ? "الرفض" : "إعادة المحاولة"}" على ${data.count ?? selected.size} عنصر`);
      setSelected(new Set());
      fetchData();
    } catch {
      toast("فشل الاتصال", "error");
    } finally {
      setBulkActing(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 rounded-[2rem] bg-white p-6 shadow-lg shadow-slate-200/60 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold text-[#667eea]">لوحة الإدارة</p>
          <h1 className="text-3xl font-black text-slate-900">طابور المراجعة</h1>
          <p className="mt-1 text-slate-500">{total} عنصر</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href="/admin" className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">الرئيسية</a>
          <a href="/admin/sources" className="rounded-2xl bg-[#667eea]/10 px-4 py-2 text-sm font-semibold text-[#667eea] hover:bg-[#667eea]/20">إدارة المصادر</a>
          {(statusCounts["processing"] ?? 0) > 0 && (
            <button
              onClick={async () => {
                await fetch("/api/admin/queue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reset-processing" }) });
                fetchData();
                toast(`تمت إعادة تعيين ${statusCounts["processing"]} عنصر`);
              }}
              className="rounded-2xl bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-200"
            >
              إعادة تعيين المعالجة ({statusCounts["processing"]})
            </button>
          )}
        </div>
      </div>

      {/* Status tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const count = tab.value ? statusCounts[tab.value as QueueStatus] : total;
          return (
            <button key={tab.value} onClick={() => { setStatus(tab.value); setPage(1); }}
              className={`flex items-center gap-1.5 rounded-2xl px-4 py-2 text-sm font-semibold transition ${status === tab.value ? "bg-[#667eea] text-white" : "bg-white text-slate-600 shadow-sm hover:bg-slate-50"}`}>
              {tab.label}
              {count != null && count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs ${status === tab.value ? "bg-white/20" : tab.value === "failed" ? "bg-red-100 text-red-700" : "bg-slate-100"}`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search bar */}
      <div className="mb-4 flex items-center gap-3 rounded-[1.75rem] bg-white p-4 shadow-md shadow-slate-200/60">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="بحث بالعنوان أو المصدر..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-9 pl-3 text-sm focus:border-[#667eea] focus:outline-none" />
        </div>
      </div>

      {/* Bulk action bar — appears when items selected */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border-2 border-[#667eea]/30 bg-[#667eea]/5 px-5 py-3">
          <span className="flex-1 text-sm font-semibold text-[#667eea]">
            تم تحديد {selected.size} عنصر
          </span>
          <button onClick={() => bulkAction("retry")} disabled={bulkActing}
            className="flex items-center gap-1.5 rounded-xl bg-[#667eea]/10 px-3 py-2 text-sm font-semibold text-[#667eea] hover:bg-[#667eea]/20 disabled:opacity-50">
            {bulkActing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            إعادة المحاولة
          </button>
          <button onClick={() => bulkAction("reject")} disabled={bulkActing}
            className="flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50">
            {bulkActing ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
            رفض الكل
          </button>
          <button onClick={() => setSelected(new Set())}
            className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-500 hover:bg-slate-200">
            إلغاء
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="size-8 animate-spin text-[#667eea]" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[2rem] bg-white py-24 shadow-lg shadow-slate-200/60">
          <p className="text-lg font-semibold text-slate-700">لا توجد عناصر</p>
          <p className="mt-1 text-sm text-slate-400">قم بمزامنة مصدر للبدء في جلب المقالات</p>
        </div>
      ) : (
        <>
          {/* Select-all row */}
          <div className="mb-3 flex items-center gap-2 px-2">
            <button onClick={toggleSelectAll} className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#667eea] transition">
              {allSelected ? <CheckSquare className="size-4 text-[#667eea]" /> : <Square className="size-4" />}
              {allSelected ? "إلغاء تحديد الكل" : "تحديد الكل"}
            </button>
            <span className="text-xs text-slate-400">({items.length} في هذه الصفحة)</span>
          </div>

          <div className="space-y-4">
            {items.map((item) => (
              <ItemRow key={item.id} item={item} categories={categories}
                selected={selected.has(item.id)}
                onToggleSelect={toggleOne}
                onAction={fetchData} />
            ))}
          </div>
        </>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between rounded-[1.75rem] bg-white px-6 py-4 shadow-md shadow-slate-200/60">
          <p className="text-sm text-slate-500">صفحة {page} من {totalPages}</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40">السابق</button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40">التالي</button>
          </div>
        </div>
      )}
    </div>
  );
}
