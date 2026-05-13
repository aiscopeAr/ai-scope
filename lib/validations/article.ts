import { z } from "zod";

export const articleSchema = z.object({
  title: z.string().min(1, "العنوان بالإنجليزية مطلوب"),
  titleAr: z.string().min(1, "العنوان بالعربية مطلوب"),
  slug: z.string().min(1, "الرابط المختصر مطلوب").regex(/^[a-z0-9-]+$/, "الرابط المختصر يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط"),
  content: z.string().min(1, "المحتوى بالإنجليزية مطلوب"),
  contentAr: z.string().min(1, "المحتوى بالعربية مطلوب"),
  excerpt: z.string().optional(),
  imageUrl: z.string().url("رابط الصورة غير صالح").optional().or(z.literal("")),
  sourceUrl: z.string().url("رابط المصدر غير صالح"),
  sourceName: z.string().min(1, "اسم المصدر مطلوب"),
  categoryId: z.string().min(1, "التصنيف مطلوب"),
  published: z.boolean(),
  publishedAt: z.string().optional(),
  score: z.number().int().min(0).max(10).optional(),
});

export type ArticleSchemaInput = z.infer<typeof articleSchema>;
