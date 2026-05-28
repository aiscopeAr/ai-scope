"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Search, X, ChevronUp, ChevronDown, Save, Eye } from "lucide-react";

interface AITool {
  id: string;
  name: string;
  tagline: string;
  logoUrl: string | null;
  toolCategory: string;
  pricing: string;
}

interface SideForm {
  toolId: string;
  toolName: string;
  toolLogo: string | null;
  score: string;
  notes: string;
  bestFor: string;
  strengths: string[];
  weaknesses: string[];
}

function emptySide(): SideForm {
  return { toolId: "", toolName: "", toolLogo: null, score: "", notes: "", bestFor: "", strengths: [""], weaknesses: [""] };
}

function slugify(str: string) {
  return str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export default function NewComparisonPage() {
  const router = useRouter();

  // form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summaryAr, setSummaryAr] = useState("");
  const [verdict, setVerdict] = useState("");
  const [criteria, setCriteria] = useState<string[]>(["السعر", "سهولة الاستخدام", "دعم العربية", "الأداء"]);
  const [sides, setSides] = useState<SideForm[]>([emptySide(), emptySide()]);
  const [published, setPublished] = useState(false);

  // tool search
  const [allTools, setAllTools] = useState<AITool[]>([]);
  const [searchQuery, setSearchQuery] = useState<Record<number, string>>({});
  const [openSearch, setOpenSearch] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // auto-slug from title
  useEffect(() => {
    if (title) setSlug(slugify(title));
  }, [title]);

  // load tools
  useEffect(() => {
    fetch("/api/admin/ai-tools?limit=500")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        const list = d.tools ?? (Array.isArray(d) ? d : []);
        setAllTools(list);
      })
      .catch((e) => console.error("Failed to load tools:", e));
  }, []);

  const filteredTools = useCallback((idx: number) => {
    const q = (searchQuery[idx] ?? "").toLowerCase();
    const usedIds = sides.map((s) => s.toolId).filter((id, i) => i !== idx && id);
    return allTools
      .filter((t) => !usedIds.includes(t.id))
      .filter((t) => !q || t.name.toLowerCase().includes(q) || t.tagline?.toLowerCase().includes(q));
  }, [allTools, searchQuery, sides]);

  // ── sides helpers ──────────────────────────────────────────────
  function addSide() { setSides((s) => [...s, emptySide()]); }
  function removeSide(idx: number) { setSides((s) => s.filter((_, i) => i !== idx)); }
  function moveSide(idx: number, dir: -1 | 1) {
    setSides((s) => {
      const arr = [...s];
      const target = idx + dir;
      if (target < 0 || target >= arr.length) return arr;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return arr;
    });
  }
  function updateSide(idx: number, patch: Partial<SideForm>) {
    setSides((s) => s.map((side, i) => i === idx ? { ...side, ...patch } : side));
  }
  function selectTool(idx: number, tool: AITool) {
    updateSide(idx, { toolId: tool.id, toolName: tool.name, toolLogo: tool.logoUrl });
    setOpenSearch(null);
    setSearchQuery((q) => ({ ...q, [idx]: "" }));
  }

  // strengths / weaknesses
  function addItem(idx: number, field: "strengths" | "weaknesses") {
    setSides((s) => s.map((side, i) => i === idx ? { ...side, [field]: [...side[field], ""] } : side));
  }
  function updateItem(idx: number, field: "strengths" | "weaknesses", itemIdx: number, val: string) {
    setSides((s) => s.map((side, i) => {
      if (i !== idx) return side;
      const arr = [...side[field]];
      arr[itemIdx] = val;
      return { ...side, [field]: arr };
    }));
  }
  function removeItem(idx: number, field: "strengths" | "weaknesses", itemIdx: number) {
    setSides((s) => s.map((side, i) => {
      if (i !== idx) return side;
      return { ...side, [field]: side[field].filter((_, ii) => ii !== itemIdx) };
    }));
  }

  // criteria
  function addCriterion() { setCriteria((c) => [...c, ""]); }
  function updateCriterion(i: number, val: string) { setCriteria((c) => c.map((v, ii) => ii === i ? val : v)); }
  function removeCriterion(i: number) { setCriteria((c) => c.filter((_, ii) => ii !== i)); }

  // ── save ──────────────────────────────────────────────────────
  async function handleSave(pub: boolean) {
    if (!title.trim()) return setError("يرجى كتابة عنوان المقارنة");
    if (!summaryAr.trim()) return setError("يرجى كتابة ملخص المقارنة");
    const validSides = sides.filter((s) => s.toolId);
    if (validSides.length < 2) return setError("يجب اختيار أداتين على الأقل");

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/comparisons/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim() || slugify(title),
          summaryAr: summaryAr.trim(),
          verdict: verdict.trim() || null,
          criteria: criteria.filter(Boolean),
          published: pub,
          sides: validSides.map((s) => ({
            toolId: s.toolId,
            score: s.score ? parseInt(s.score) : null,
            notes: s.notes.trim() || null,
            bestFor: s.bestFor.trim() || null,
            strengths: s.strengths.filter(Boolean),
            weaknesses: s.weaknesses.filter(Boolean),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطأ في الحفظ");
      router.push("/admin/comparisons");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "خطأ غير متوقع");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-5xl space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">مقارنة جديدة</h1>
          <p className="text-sm text-slate-500 mt-1">{sides.filter(s => s.toolId).length} أدوات محددة</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> حفظ مسودة
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-50"
          >
            <Eye className="h-4 w-4" /> نشر الآن
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Basic info */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
        <h2 className="font-bold text-slate-700">معلومات المقارنة</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">عنوان المقارنة *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: ChatGPT vs Claude vs Gemini"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Slug (URL)</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="chatgpt-vs-claude-vs-gemini"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-mono focus:border-indigo-400 focus:outline-none"
              dir="ltr"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-600">ملخص المقارنة * (يظهر في الصفحة)</label>
          <textarea
            value={summaryAr}
            onChange={(e) => setSummaryAr(e.target.value)}
            rows={3}
            placeholder="صف ما ستقارنه وما الذي سيساعد القارئ على اتخاذ قراره..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none resize-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-600">الخلاصة النهائية (اختياري)</label>
          <textarea
            value={verdict}
            onChange={(e) => setVerdict(e.target.value)}
            rows={2}
            placeholder="ما التوصية النهائية؟ من يناسب من؟"
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none resize-none"
          />
        </div>
      </div>

      {/* Criteria */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-slate-700">معايير المقارنة</h2>
          <button onClick={addCriterion} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700">
            <Plus className="h-3 w-3" /> إضافة معيار
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {criteria.map((c, i) => (
            <div key={i} className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
              <input
                value={c}
                onChange={(e) => updateCriterion(i, e.target.value)}
                className="w-24 bg-transparent text-xs text-slate-700 focus:outline-none"
                placeholder="معيار..."
              />
              <button onClick={() => removeCriterion(i)} className="text-slate-300 hover:text-red-400">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Sides */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-700">الأدوات ({sides.length})</h2>
          <button
            onClick={addSide}
            className="flex items-center gap-2 rounded-lg border border-dashed border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-100 transition"
          >
            <Plus className="h-4 w-4" /> إضافة أداة
          </button>
        </div>

        {sides.map((side, idx) => (
          <div key={idx} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Side header */}
            <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                {idx + 1}
              </span>
              <span className="flex-1 font-semibold text-slate-700 text-sm">
                {side.toolName || "اختر أداة..."}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => moveSide(idx, -1)} disabled={idx === 0} className="rounded p-1 text-slate-400 hover:text-slate-600 disabled:opacity-20">
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button onClick={() => moveSide(idx, 1)} disabled={idx === sides.length - 1} className="rounded p-1 text-slate-400 hover:text-slate-600 disabled:opacity-20">
                  <ChevronDown className="h-4 w-4" />
                </button>
                {sides.length > 2 && (
                  <button onClick={() => removeSide(idx)} className="rounded p-1 text-slate-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Tool picker */}
              <div className="relative">
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">الأداة *</label>
                {side.toolId ? (
                  <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                    {side.toolLogo && <img src={side.toolLogo} alt={side.toolName} className="h-7 w-7 rounded object-cover" />}
                    <span className="flex-1 text-sm font-semibold text-slate-700">{side.toolName}</span>
                    <button onClick={() => updateSide(idx, { toolId: "", toolName: "", toolLogo: null })} className="text-slate-400 hover:text-red-500">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5">
                      <Search className="h-4 w-4 text-slate-400" />
                      <input
                        value={searchQuery[idx] ?? ""}
                        onChange={(e) => { setSearchQuery((q) => ({ ...q, [idx]: e.target.value })); setOpenSearch(idx); }}
                        onFocus={() => setOpenSearch(idx)}
                        placeholder="ابحث عن أداة..."
                        className="flex-1 bg-transparent text-sm focus:outline-none"
                      />
                    </div>
                    {openSearch === idx && (
                      <div className="absolute z-10 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                        {filteredTools(idx).slice(0, 20).map((t) => (
                          <button
                            key={t.id}
                            onClick={() => selectTool(idx, t)}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-right text-sm hover:bg-indigo-50 transition"
                          >
                            {t.logoUrl ? (
                              <img src={t.logoUrl} alt={t.name} className="h-7 w-7 rounded object-cover shrink-0" />
                            ) : (
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-indigo-100 text-xs font-bold text-indigo-600">
                                {t.name[0]}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800">{t.name}</p>
                              {t.tagline && <p className="text-xs text-slate-400 truncate">{t.tagline}</p>}
                            </div>
                          </button>
                        ))}
                        {filteredTools(idx).length === 0 && (
                          <p className="px-4 py-3 text-sm text-slate-400">لا توجد نتائج</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Score + bestFor */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">الدرجة (من 10)</label>
                  <input
                    type="number" min="0" max="10"
                    value={side.score}
                    onChange={(e) => updateSide(idx, { score: e.target.value })}
                    placeholder="8"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">الأفضل لـ</label>
                  <input
                    value={side.bestFor}
                    onChange={(e) => updateSide(idx, { bestFor: e.target.value })}
                    placeholder="المطورين والمحترفين"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">ملاحظة سريعة (اختياري)</label>
                <input
                  value={side.notes}
                  onChange={(e) => updateSide(idx, { notes: e.target.value })}
                  placeholder="ملخص سريع عن هذه الأداة في السياق..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none"
                />
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* Strengths */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-semibold text-green-700">✓ نقاط القوة</label>
                    <button onClick={() => addItem(idx, "strengths")} className="text-xs text-green-600 hover:text-green-700">
                      + إضافة
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {side.strengths.map((s, ii) => (
                      <div key={ii} className="flex items-center gap-1.5">
                        <span className="text-green-500 text-xs">✓</span>
                        <input
                          value={s}
                          onChange={(e) => updateItem(idx, "strengths", ii, e.target.value)}
                          placeholder="ميزة..."
                          className="flex-1 rounded-md border border-green-100 bg-green-50 px-2.5 py-1.5 text-xs focus:border-green-300 focus:outline-none"
                        />
                        {side.strengths.length > 1 && (
                          <button onClick={() => removeItem(idx, "strengths", ii)} className="text-slate-300 hover:text-red-400">
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weaknesses */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-semibold text-red-700">✗ نقاط الضعف</label>
                    <button onClick={() => addItem(idx, "weaknesses")} className="text-xs text-red-600 hover:text-red-700">
                      + إضافة
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {side.weaknesses.map((w, ii) => (
                      <div key={ii} className="flex items-center gap-1.5">
                        <span className="text-red-400 text-xs">✗</span>
                        <input
                          value={w}
                          onChange={(e) => updateItem(idx, "weaknesses", ii, e.target.value)}
                          placeholder="عيب..."
                          className="flex-1 rounded-md border border-red-100 bg-red-50 px-2.5 py-1.5 text-xs focus:border-red-300 focus:outline-none"
                        />
                        {side.weaknesses.length > 1 && (
                          <button onClick={() => removeItem(idx, "weaknesses", ii)} className="text-slate-300 hover:text-red-400">
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Add more button */}
        <button
          onClick={addSide}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-4 text-sm font-semibold text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition"
        >
          <Plus className="h-5 w-5" /> إضافة أداة أخرى للمقارنة
        </button>
      </div>

      {/* Bottom save */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      <div className="flex items-center justify-end gap-3 pb-10">
        <button
          onClick={() => router.push("/admin/comparisons")}
          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
        >
          إلغاء
        </button>
        <button
          onClick={() => handleSave(false)}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> حفظ مسودة
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-50"
        >
          <Eye className="h-4 w-4" /> {saving ? "جاري الحفظ..." : "نشر الآن"}
        </button>
      </div>
    </div>
  );
}
