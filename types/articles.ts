import type { Article, Category } from "@prisma/client";

export type ArticleWithCategory = Article & {
  category: Category;
};

export type ArticleFormData = {
  title: string;
  titleAr: string;
  slug: string;
  content: string;
  contentAr: string;
  excerpt?: string;
  imageUrl?: string;
  sourceUrl: string;
  sourceName: string;
  categoryId: string;
  published: boolean;
  publishedAt?: string;
  score?: number;
};

export type ArticleQueueStatus = "pending" | "approved" | "rejected";
