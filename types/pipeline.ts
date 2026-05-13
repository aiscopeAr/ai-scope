import type { Source, Category, ArticleQueue } from "@prisma/client";

export type SourceWithCategory = Source & {
  category: Category | null;
  _count?: { queueItems: number };
};

export type QueueItemWithSource = ArticleQueue & {
  source: Source | null;
};

export type QueueStatus =
  | "pending"
  | "processing"
  | "processed"
  | "approved"
  | "rejected"
  | "failed";

export const QUEUE_STATUS_LABELS: Record<QueueStatus, string> = {
  pending: "قيد الانتظار",
  processing: "جارٍ المعالجة",
  processed: "تمت المعالجة",
  approved: "معتمد",
  rejected: "مرفوض",
  failed: "فشل",
};

export const QUEUE_STATUS_COLORS: Record<QueueStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  processed: "bg-purple-100 text-purple-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  failed: "bg-rose-100 text-rose-800",
};
